// Server-side data access. RLS enforces tenancy; this layer just shapes the response.

import { createClient, createServiceClient } from "@/lib/supabase/server";
import {
  buildMonth,
  computePace,
  type MonthCtx,
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
  storeCity: string | null;
  storeState: string | null;
  month: MonthCtx;
  reps: RepWithPace[];
  yourRepId: string | null;
  yourRole: "admin" | "manager" | "rep" | null;
  repCount: number;
}

function todayInTz(tz: string): string {
  // Returns YYYY-MM-DD for the current day in the given timezone.
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

export async function loadMyStoreSnapshot(): Promise<StoreSnapshot | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const admin = createServiceClient();

  // Find the user's memberships — prefer store-scoped (rep) over org-scoped (manager).
  const { data: memberships } = await admin
    .from("memberships")
    .select("role, org_id, store_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return null;

  // Prefer a specific store membership. Otherwise pick any store in the user's org.
  const withStore = memberships.find((m) => m.store_id);
  let storeId: string | null = withStore?.store_id ?? null;
  if (!storeId) {
    const orgIds = Array.from(new Set(memberships.map((m) => m.org_id).filter(Boolean)));
    if (orgIds.length === 0) return null;
    const { data: stores } = await admin
      .from("stores")
      .select("id")
      .in("org_id", orgIds)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1);
    storeId = stores?.[0]?.id ?? null;
  }
  if (!storeId) return null;

  return await loadStoreSnapshotById(storeId, user.id);
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
    .select("id, name, timezone, city, state, org_id")
    .eq("id", storeId)
    .maybeSingle();
  if (!store) return null;

  // Compute current month in store's timezone.
  const month = buildMonth(new Date(), store.timezone);
  const today = todayInTz(store.timezone);
  const monthStartDate = today.slice(0, 7) + "-01";
  const monthStartISO = `${monthStartDate}T00:00:00Z`;

  // Determine caller's role in this store
  let yourRole: "admin" | "manager" | "rep" | null = null;
  if (userId) {
    const { data: m } = await supabase
      .from("memberships")
      .select("role, store_id")
      .eq("user_id", userId)
      .eq("org_id", store.org_id);
    const repMem = m?.find((x) => x.store_id === storeId && x.role === "rep");
    const mgrMem = m?.find((x) => x.role === "admin" || x.role === "manager");
    yourRole = repMem ? "rep" : mgrMem ? (mgrMem.role as "admin" | "manager") : null;
  }

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
    return {
      storeId: store.id,
      storeName: store.name,
      storeTimezone: store.timezone,
      storeCity: store.city ?? null,
      storeState: store.state ?? null,
      month,
      reps: [],
      yourRepId: null,
      yourRole,
      repCount: 0,
    };
  }

  // Sales this month
  const { data: sales } = await supabase
    .from("sales")
    .select("rep_id, gross, kind, sold_at_date")
    .eq("store_id", storeId)
    .is("deleted_at", null)
    .gte("sold_at", monthStartISO);
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

  // yesterday in store tz
  const yDate = new Date(Date.parse(`${today}T12:00:00Z`) - 24 * 60 * 60 * 1000);
  const yesterday = todayInTz(store.timezone)
    ? new Date(yDate.getUTCFullYear(), yDate.getUTCMonth(), yDate.getUTCDate())
        .toISOString()
        .slice(0, 10)
    : yDate.toISOString().slice(0, 10);

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
    return { ...rep, pace: computePace(rep, month, ratios) };
  });

  // Determine "you" — the rep row whose user_id == authed userId, if any.
  const you = repsWithPace.find((r) => r.isYou);
  return {
    storeId: store.id,
    storeName: store.name,
    storeTimezone: store.timezone,
    storeCity: store.city ?? null,
    storeState: store.state ?? null,
    month,
    reps: repsWithPace,
    yourRepId: you?.id ?? null,
    yourRole,
    repCount: repsWithPace.length,
  };
}
