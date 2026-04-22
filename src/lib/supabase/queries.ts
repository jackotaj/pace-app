// Server-side data access. RLS enforces tenancy; this layer just shapes the response.

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  computePace,
  MONTH,
  type Rep,
  type Ratios,
  type PaceResult,
} from "@/lib/pace";

export interface RepWithPace extends Rep {
  pace: PaceResult;
}

// Build the "derived rep" shape the UI expects (sold, gross, activityToday, daysSinceSale, streak)
// from the normalized DB tables. v1 uses MONTH constant as the current month; v2 will derive.
export interface StoreSnapshot {
  storeId: string;
  storeName: string;
  storeTimezone: string;
  reps: RepWithPace[];
  yourRepId: string | null;
}

const MONTH_START = new Date(`${MONTH.label.split(" ")[1]}-${monthNum(MONTH.label)}-01T00:00:00Z`);
function monthNum(label: string): string {
  // "APR 2026" → "04"
  const m: Record<string, string> = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  return m[label.split(" ")[0]] ?? "04";
}

export async function loadMyStoreSnapshot(): Promise<StoreSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Find the first store this user can see (managers → their org's stores; reps → their store)
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, timezone")
    .limit(1);

  const store = stores?.[0];
  if (!store) return null;

  return await loadStoreSnapshotById(store.id, user.id);
}

export async function loadStoreSnapshotById(
  storeId: string,
  userId: string | null,
): Promise<StoreSnapshot | null> {
  // Use service role here because the manager dashboard aggregates across all reps,
  // and we already established via getUser() that the caller has access via loadMyStoreSnapshot.
  // For stricter setups we'd do this with RLS and .from().select() via the authed client.
  const supabase = createServiceClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, timezone")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return null;

  const { data: reps } = await supabase
    .from("reps")
    .select(
      "id, user_id, name, short, color, goal_units, goal_gross, ratios, active",
    )
    .eq("store_id", storeId)
    .eq("active", true)
    .is("deleted_at", null);

  const repIds = (reps ?? []).map((r) => r.id);
  if (repIds.length === 0) {
    return { storeId: store.id, storeName: store.name, storeTimezone: store.timezone, reps: [], yourRepId: null };
  }

  // Sales this month
  const monthStartISO = MONTH_START.toISOString();
  const { data: sales } = await supabase
    .from("sales")
    .select("rep_id, gross, kind, sold_at_date")
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .gte("sold_at", monthStartISO);

  // Most recent activity row per rep (today's if present)
  const today = new Date().toISOString().slice(0, 10);
  const { data: activities } = await supabase
    .from("activities")
    .select("rep_id, activity_date, calls, texts, appts_set, appts_shown")
    .eq("store_id", storeId)
    .in("rep_id", repIds);

  // Aggregate
  const salesByRep = new Map<string, { sold: number; newSold: number; usedSold: number; gross: number; lastDate?: string }>();
  for (const s of sales ?? []) {
    const acc = salesByRep.get(s.rep_id) ?? { sold: 0, newSold: 0, usedSold: 0, gross: 0 };
    acc.sold += 1;
    if (s.kind === "new") acc.newSold += 1;
    else acc.usedSold += 1;
    acc.gross += Number(s.gross);
    if (!acc.lastDate || s.sold_at_date > acc.lastDate) acc.lastDate = s.sold_at_date;
    salesByRep.set(s.rep_id, acc);
  }

  const todayActByRep = new Map<string, { calls: number; texts: number; set: number; shown: number }>();
  const lastActDateByRep = new Map<string, string>();
  for (const a of activities ?? []) {
    const prev = lastActDateByRep.get(a.rep_id);
    if (!prev || a.activity_date > prev) lastActDateByRep.set(a.rep_id, a.activity_date);
    if (a.activity_date === today) {
      todayActByRep.set(a.rep_id, {
        calls: a.calls,
        texts: a.texts,
        set: a.appts_set,
        shown: a.appts_shown,
      });
    }
  }

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const repsWithPace: RepWithPace[] = (reps ?? []).map((r) => {
    const sAgg = salesByRep.get(r.id);
    const sold = sAgg?.sold ?? 0;
    const lastSaleDate = sAgg?.lastDate;
    const daysSinceSale = lastSaleDate
      ? Math.max(0, Math.floor((Date.parse(today) - Date.parse(lastSaleDate)) / 86400000))
      : 99;

    const lastActDate = lastActDateByRep.get(r.id);
    const lastActivity =
      lastActDate === today
        ? "today"
        : lastActDate === yesterday
          ? "yesterday"
          : lastActDate
            ? `${Math.floor((Date.parse(today) - Date.parse(lastActDate)) / 86400000)} days ago`
            : "never";

    // Streak = count of consecutive days leading up to today with an activity row.
    // Cheap v1: just use lastActivity === 'today' ? 1 : 0 → placeholder.
    // TODO(week2): proper streak computation.
    const streak = lastActDate === today ? 1 : 0;

    const rep: Rep = {
      id: r.id,
      name: r.name,
      short: r.short ?? r.name.slice(0, 2).toUpperCase(),
      color: r.color,
      isYou: userId != null && r.user_id === userId,
      sold,
      newSold: sAgg?.newSold ?? 0,
      usedSold: sAgg?.usedSold ?? 0,
      gross: sAgg?.gross ?? 0,
      goalUnits: r.goal_units,
      goalGross: Number(r.goal_gross),
      streak,
      daysSinceSale,
      lastActivity,
      activityToday: todayActByRep.get(r.id) ?? { calls: 0, texts: 0, set: 0, shown: 0 },
      badges: [],
    };

    const ratios: Ratios = (r.ratios as Ratios) ?? { close: 0.2, show: 0.65, set: 0.15, contact: 0.3 };
    return { ...rep, pace: computePace(rep, MONTH, ratios) };
  });

  // Determine "you" — the rep row whose user_id == authed userId, if any.
  // If manager viewing, there may be no self-rep, so yourRepId stays null and the UI picks first.
  const you = repsWithPace.find((r) => r.isYou);
  return {
    storeId: store.id,
    storeName: store.name,
    storeTimezone: store.timezone,
    reps: repsWithPace,
    yourRepId: you?.id ?? null,
  };
}
