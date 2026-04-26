// POST /api/ingest_runs/[id]/confirm — commits a preview ingest run.
// Auto-detects whether the preview is a sales batch or an activity batch by
// inspecting the row shape, then routes to the right table.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser, UnauthorizedError } from "@/lib/supabase/tenancy";
import type { ActivityCandidate, SaleCandidate } from "@/lib/ingest";

type AnyCandidate = SaleCandidate | ActivityCandidate;

function isActivity(r: AnyCandidate): r is ActivityCandidate {
  return (
    "calls" in r && "texts" in r && "appts_set" in r && "appts_shown" in r
  );
}

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireUser();
    const admin = createServiceClient();

    const { data: run } = await admin
      .from("ingest_runs")
      .select("id, store_id, status, preview")
      .eq("id", id)
      .maybeSingle();
    if (!run) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (run.status !== "previewing")
      return NextResponse.json({ error: `Run is ${run.status}` }, { status: 400 });

    const { data: memberships } = await admin
      .from("memberships")
      .select("role, store_id, org_id")
      .eq("user_id", user.id);
    const { data: store } = await admin
      .from("stores")
      .select("org_id")
      .eq("id", run.store_id)
      .maybeSingle();
    const ok = (memberships ?? []).some(
      (m) =>
        store &&
        m.org_id === store.org_id &&
        (m.role === "admin" || m.role === "manager") &&
        (m.store_id === null || m.store_id === run.store_id),
    );
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const rows = (run.preview as AnyCandidate[]) ?? [];
    const sample = rows[0];
    const kind: "activity" | "sales" =
      sample && isActivity(sample) ? "activity" : "sales";

    let inserted = 0;

    if (kind === "activity") {
      const candidates = rows as ActivityCandidate[];
      const toUpsert = candidates
        .filter(
          (r) => r.errors.length === 0 && r.rep_id && r.activity_date,
        )
        .map((r) => ({
          rep_id: r.rep_id!,
          store_id: run.store_id,
          activity_date: r.activity_date!,
          calls: r.calls,
          texts: r.texts,
          appts_set: r.appts_set,
          appts_shown: r.appts_shown,
        }));
      if (toUpsert.length > 0) {
        const { data, error } = await admin
          .from("activities")
          .upsert(toUpsert, { onConflict: "rep_id,activity_date" })
          .select("id");
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        inserted = data?.length ?? 0;
      }
    } else {
      const candidates = rows as SaleCandidate[];
      const toInsert = candidates
        .filter(
          (r) =>
            !r.skip_reason &&
            !r.duplicate &&
            r.errors.length === 0 &&
            r.rep_id &&
            r.sold_at &&
            r.sold_at_date,
        )
        .map((r) => ({
          rep_id: r.rep_id!,
          store_id: run.store_id,
          sold_at: r.sold_at!,
          sold_at_date: r.sold_at_date!,
          vin: r.vin,
          vehicle: r.vehicle,
          gross: r.gross,
          front_gross: r.front_gross,
          back_gross: r.back_gross,
          kind: r.kind,
          source: r.source as never,
          deal_number: r.deal_number,
          sale_id: r.sale_id,
          ingest_run_id: run.id,
        }));
      if (toInsert.length > 0) {
        const { data, error } = await admin
          .from("sales")
          .insert(toInsert)
          .select("id");
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        inserted = data?.length ?? 0;
      }
    }

    await admin
      .from("ingest_runs")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
        rows_added: inserted,
      })
      .eq("id", run.id);

    return NextResponse.json({ data: { inserted, kind } });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
