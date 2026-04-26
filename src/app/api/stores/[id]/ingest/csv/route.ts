// POST /api/stores/[id]/ingest/csv — upload CSV, auto-detect format
// (sales detail vs daily activity), parse via shared normalizer, produce a
// preview ingest_run (status='previewing'). No rows committed yet.

import { NextResponse } from "next/server";
import { requireManagerOfStore, UnauthorizedError } from "@/lib/supabase/tenancy";
import {
  detectFormat,
  normalizeActivityCsv,
  normalizeSalesCsv,
  type RepLite,
} from "@/lib/ingest";
import { parseCsv } from "@/lib/csv";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { admin, store, user } = await requireManagerOfStore(id);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file (CSV) is required" }, { status: 400 });
    }
    const csvText = await file.text();

    const { data: reps } = await admin
      .from("reps")
      .select("id, name, email")
      .eq("store_id", store.id)
      .eq("active", true);

    // Detect what kind of report this is from headers alone.
    const headers = parseCsv(csvText)[0] ?? [];
    const format = detectFormat(headers);

    if (format === "activity_daily") {
      // Pull existing (rep_id, activity_date) keys for duplicate-tagging.
      const { data: existing } = await admin
        .from("activities")
        .select("rep_id, activity_date")
        .eq("store_id", store.id);
      const existingKeys = new Set<string>(
        (existing ?? []).map((a) => `${a.rep_id}|${a.activity_date}`),
      );

      const { rows, counts } = normalizeActivityCsv({
        csvText,
        reps: (reps ?? []) as RepLite[],
        existingKeys,
      });

      const { data: run, error: runErr } = await admin
        .from("ingest_runs")
        .insert({
          store_id: store.id,
          source: "csv_upload",
          status: "previewing",
          triggered_by: user.id,
          filename: file.name,
          rows_total: counts.total,
          rows_added: counts.ready,
          rows_skipped: counts.duplicate,
          rows_errored: counts.errored,
          preview: rows,
        })
        .select("id, status, rows_total, rows_added, rows_skipped, rows_errored")
        .single();

      if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });

      return NextResponse.json({
        data: {
          ingest_run: run,
          format,
          counts,
          preview_sample: rows.slice(0, 12),
        },
      });
    }

    // Sales path (vinsolutions_detail OR generic_per_deal)
    const { data: existing } = await admin
      .from("sales")
      .select("deal_number, sale_id, vin, sold_at_date")
      .eq("store_id", store.id)
      .is("deleted_at", null);

    const deals = new Set<string>();
    const saleIds = new Set<string>();
    const vinDates = new Set<string>();
    for (const s of existing ?? []) {
      if (s.deal_number) deals.add(s.deal_number);
      if (s.sale_id) saleIds.add(s.sale_id);
      if (s.vin && s.sold_at_date) vinDates.add(`${s.vin}|${s.sold_at_date}`);
    }

    const result = normalizeSalesCsv({
      csvText,
      reps: (reps ?? []) as RepLite[],
      existingKeys: { deals, saleIds, vinDates },
    });

    const { data: run, error: runErr } = await admin
      .from("ingest_runs")
      .insert({
        store_id: store.id,
        source: "csv_upload",
        status: "previewing",
        triggered_by: user.id,
        filename: file.name,
        rows_total: result.counts.total,
        rows_added: result.counts.ready,
        rows_skipped: result.counts.duplicate + result.counts.filtered,
        rows_errored: result.counts.errored,
        preview: result.rows,
      })
      .select("id, status, rows_total, rows_added, rows_skipped, rows_errored")
      .single();

    if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });

    return NextResponse.json({
      data: {
        ingest_run: run,
        format: result.format,
        counts: result.counts,
        preview_sample: result.rows.slice(0, 12),
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
