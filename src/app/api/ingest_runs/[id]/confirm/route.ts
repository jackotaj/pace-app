// POST /api/ingest_runs/[id]/confirm — commits a preview ingest run to sales table.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser, UnauthorizedError } from "@/lib/supabase/tenancy";

interface PreviewRow {
  row: number;
  rep_id?: string;
  sold_at: string | null;
  sold_at_date: string | null;
  vin: string | null;
  vehicle: string;
  gross: number;
  kind: "new" | "used";
  source: string;
  duplicate: boolean;
  errors: string[];
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

    // Verify caller manages this store
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

    const rows = (run.preview as PreviewRow[]) ?? [];
    const toInsert = rows
      .filter((r) => r.errors.length === 0 && !r.duplicate && r.rep_id && r.sold_at && r.sold_at_date)
      .map((r) => ({
        rep_id: r.rep_id!,
        store_id: run.store_id,
        sold_at: r.sold_at!,
        sold_at_date: r.sold_at_date!,
        vin: r.vin,
        vehicle: r.vehicle,
        gross: r.gross,
        kind: r.kind,
        source: r.source as never,
        ingest_run_id: run.id,
      }));

    let inserted = 0;
    if (toInsert.length > 0) {
      // Use upsert-like insert with onConflict ignore; the partial unique index handles dedup.
      const { data, error } = await admin
        .from("sales")
        .upsert(toInsert, { onConflict: "store_id,vin,sold_at_date", ignoreDuplicates: true })
        .select("id");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      inserted = data?.length ?? 0;
    }

    await admin
      .from("ingest_runs")
      .update({
        status: "committed",
        committed_at: new Date().toISOString(),
        rows_added: inserted,
      })
      .eq("id", run.id);

    return NextResponse.json({ data: { inserted } });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
