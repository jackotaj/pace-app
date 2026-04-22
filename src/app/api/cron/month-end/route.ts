// Month-end snapshot cron. Runs daily; snapshots only trigger on day 1 of a month
// (for the month that just ended) or when re-triggered manually via ?month=YYYY-MM.
//
// Vercel cron: configured in vercel.json.
// Auth: CRON_SECRET header (Vercel sends this automatically) or ?token= for manual.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const cronSecret = process.env.CRON_SECRET;
  const presented =
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
    url.searchParams.get("token");
  if (cronSecret && presented !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const manualMonth = url.searchParams.get("month"); // YYYY-MM
  // Default: snapshot the PREVIOUS month.
  const target = manualMonth ?? (() => {
    const d = new Date(now.getUTCFullYear(), now.getUTCMonth() - 1, 1);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
  })();

  const [yearStr, monthStr] = target.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
  const monthEnd = new Date(Date.UTC(year, month, 1)).toISOString();

  const admin = createServiceClient();
  const { data: reps } = await admin
    .from("reps")
    .select("id, store_id, goal_units, goal_gross, ratios");
  if (!reps) return NextResponse.json({ error: "no reps" }, { status: 500 });

  const snapshots = [];
  for (const r of reps) {
    const { data: sales } = await admin
      .from("sales")
      .select("gross")
      .eq("rep_id", r.id)
      .gte("sold_at", monthStart)
      .lt("sold_at", monthEnd)
      .is("deleted_at", null);
    const units = sales?.length ?? 0;
    const gross = (sales ?? []).reduce((s, x) => s + Number(x.gross), 0);

    const ratios = (r.ratios as { close?: number } | null) ?? {};
    const closeRate = ratios.close ?? 0.2;
    const apptsShown = Math.max(units + 3, Math.round(units / closeRate));
    const trueClose = apptsShown > 0 ? units / apptsShown : 0;

    snapshots.push({
      rep_id: r.id,
      store_id: r.store_id,
      year_month: target,
      units,
      gross,
      goal_units: r.goal_units,
      goal_gross: Number(r.goal_gross),
      appts_shown: apptsShown,
      close_rate: Number(trueClose.toFixed(4)),
      streak_max: 0, // TODO: derive from activities
    });
  }

  const { error } = await admin
    .from("month_snapshots")
    .upsert(snapshots, { onConflict: "rep_id,year_month" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { year_month: target, count: snapshots.length } });
}
