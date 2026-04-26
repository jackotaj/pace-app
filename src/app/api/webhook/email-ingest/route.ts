// Email-ingest webhook. Routes by "to" address slug → store. Uses shared
// normalizer so VinSolutions/Reynolds/generic detail CSVs all work.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import {
  detectFormat,
  normalizeActivityCsv,
  normalizeSalesCsv,
  type RepLite,
} from "@/lib/ingest";
import { parseCsv } from "@/lib/csv";

interface InboundAttachment {
  filename?: string;
  content_type?: string;
  content?: string;
}
interface InboundEmail {
  to: string;
  from?: string;
  subject?: string;
  attachments?: InboundAttachment[];
  text?: string;
}

function slugFromAddress(addr: string): string | null {
  const m = addr.match(/([A-Za-z0-9._-]+)(?:\+[A-Za-z0-9._-]+)?@/);
  return m ? m[1].toLowerCase() : null;
}
function b64decode(s: string): string {
  return Buffer.from(s, "base64").toString("utf-8");
}

export async function POST(req: Request) {
  const expected = process.env.PACE_INGEST_WEBHOOK_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "PACE_INGEST_WEBHOOK_SECRET not configured" },
      { status: 500 },
    );
  }
  const presented =
    req.headers.get("x-pace-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (presented !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as InboundEmail;
  if (!body?.to) return NextResponse.json({ error: "to required" }, { status: 400 });

  const slug = slugFromAddress(body.to);
  if (!slug) return NextResponse.json({ error: "could not parse to address" }, { status: 400 });

  const admin = createServiceClient();
  const { data: store } = await admin
    .from("stores")
    .select("id, ingest_slug")
    .eq("ingest_slug", slug)
    .maybeSingle();
  if (!store) return NextResponse.json({ error: `No store with ingest_slug ${slug}` }, { status: 404 });

  const csvAttachment = (body.attachments ?? []).find(
    (a) => (a.filename?.toLowerCase().endsWith(".csv") || a.content_type?.includes("csv")) && a.content,
  );
  const csvText = csvAttachment ? b64decode(csvAttachment.content!) : body.text;
  if (!csvText || !csvText.includes(",")) {
    return NextResponse.json({ error: "No CSV content found in email" }, { status: 400 });
  }

  const { data: reps } = await admin
    .from("reps")
    .select("id, name, email")
    .eq("store_id", store.id)
    .eq("active", true);

  // Auto-detect format from headers — sales detail vs daily activity.
  const headers = parseCsv(csvText)[0] ?? [];
  const detectedFormat = detectFormat(headers);

  if (detectedFormat === "activity_daily") {
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

    const autoCommit = counts.errored === 0;
    const status = autoCommit ? "committed" : "previewing";

    const { data: run } = await admin
      .from("ingest_runs")
      .insert({
        store_id: store.id,
        source: "email",
        status,
        from_email: body.from ?? null,
        filename: csvAttachment?.filename ?? "inline.csv",
        rows_total: counts.total,
        rows_added: autoCommit ? counts.ready + counts.duplicate : 0,
        rows_skipped: 0,
        rows_errored: counts.errored,
        committed_at: autoCommit ? new Date().toISOString() : null,
        preview: autoCommit ? null : rows,
        error_log: rows
          .filter((r) => r.errors.length > 0)
          .map((r) => ({ row: r.row, msgs: r.errors })),
      })
      .select("id, status")
      .single();

    if (autoCommit) {
      const toUpsert = rows
        .filter((r) => r.errors.length === 0 && r.rep_id && r.activity_date)
        .map((r) => ({
          rep_id: r.rep_id!,
          store_id: store.id,
          activity_date: r.activity_date!,
          calls: r.calls,
          texts: r.texts,
          appts_set: r.appts_set,
          appts_shown: r.appts_shown,
        }));
      if (toUpsert.length > 0) {
        const { error: upErr } = await admin
          .from("activities")
          .upsert(toUpsert, { onConflict: "rep_id,activity_date" });
        if (upErr) {
          await admin
            .from("ingest_runs")
            .update({ status: "errored", error_log: [{ msg: upErr.message }] })
            .eq("id", run?.id);
          return NextResponse.json({ error: upErr.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      data: { ingest_run_id: run?.id, format: detectedFormat, status, ...counts },
    });
  }

  // Sales path
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

  const { format, rows, counts } = normalizeSalesCsv({
    csvText,
    reps: (reps ?? []) as RepLite[],
    existingKeys: { deals, saleIds, vinDates },
  });

  const autoCommit = counts.errored === 0;
  const status = autoCommit ? "committed" : "previewing";

  const { data: run } = await admin
    .from("ingest_runs")
    .insert({
      store_id: store.id,
      source: "email",
      status,
      from_email: body.from ?? null,
      filename: csvAttachment?.filename ?? "inline.csv",
      rows_total: counts.total,
      rows_added: autoCommit ? counts.ready : 0,
      rows_skipped: counts.duplicate + counts.filtered,
      rows_errored: counts.errored,
      committed_at: autoCommit ? new Date().toISOString() : null,
      preview: autoCommit ? null : rows,
      error_log: rows
        .filter((r) => r.errors.length > 0)
        .map((r) => ({ row: r.row, msgs: r.errors })),
    })
    .select("id, status")
    .single();

  if (autoCommit) {
    const toInsert = rows
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
        store_id: store.id,
        sold_at: r.sold_at!,
        sold_at_date: r.sold_at_date!,
        vin: r.vin,
        vehicle: r.vehicle,
        gross: r.gross,
        front_gross: r.front_gross,
        back_gross: r.back_gross,
        kind: r.kind,
        source: r.source,
        deal_number: r.deal_number,
        sale_id: r.sale_id,
        ingest_run_id: run?.id,
      }));
    if (toInsert.length > 0) {
      const { error: insErr } = await admin.from("sales").insert(toInsert);
      if (insErr) {
        await admin
          .from("ingest_runs")
          .update({ status: "errored", error_log: [{ msg: insErr.message }] })
          .eq("id", run?.id);
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
    }
  }

  return NextResponse.json({
    data: {
      ingest_run_id: run?.id,
      format,
      status,
      ...counts,
    },
  });
}
