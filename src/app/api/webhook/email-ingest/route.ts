// Email-ingest webhook.
//
// Accepts a POST from an email-forwarding service (Cloudflare Email Workers,
// Postmark inbound, SendGrid inbound, etc). Contract is intentionally loose:
// we pull the "to" address to find the store, then scan attachments or body
// for CSV content and feed it through the same ingest pipeline as the UI.
//
// Call format (JSON):
//   {
//     "to": "greenfield@ingest.pace.direct",
//     "from": "dms@dealer.com",
//     "subject": "Daily deals",
//     "attachments": [{ "filename": "deals.csv", "content_type": "text/csv", "content": "<base64>" }],
//     "text": "..."
//   }
//
// Security: requires PACE_INGEST_WEBHOOK_SECRET header match.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { parseCsv, pick, toObjects } from "@/lib/csv";

interface InboundAttachment {
  filename?: string;
  content_type?: string;
  content?: string; // base64
}

interface InboundEmail {
  to: string;
  from?: string;
  subject?: string;
  attachments?: InboundAttachment[];
  text?: string;
}

function slugFromAddress(addr: string): string | null {
  // "greenfield@ingest.pace.direct" → "greenfield"
  // "Store Name <greenfield+tag@ingest.pace.direct>" → "greenfield"
  const m = addr.match(/([A-Za-z0-9._-]+)(?:\+[A-Za-z0-9._-]+)?@/);
  return m ? m[1].toLowerCase() : null;
}

function b64decode(s: string): string {
  return Buffer.from(s, "base64").toString("utf-8");
}

function parseDate(raw: string | undefined): { iso: string; date: string } | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return { iso: d.toISOString(), date: s.slice(0, 10) };
  }
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let [, mo, da, yr] = m;
    if (yr.length === 2) yr = "20" + yr;
    const d = new Date(`${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}T12:00:00Z`);
    if (!isNaN(d.getTime())) return { iso: d.toISOString(), date: d.toISOString().slice(0, 10) };
  }
  return null;
}

function parseGross(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
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
    req.headers.get("x-pace-secret") ?? req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (presented !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as InboundEmail;
  if (!body?.to)
    return NextResponse.json({ error: "to required" }, { status: 400 });

  const slug = slugFromAddress(body.to);
  if (!slug)
    return NextResponse.json({ error: "could not parse to address" }, { status: 400 });

  const admin = createServiceClient();
  const { data: store } = await admin
    .from("stores")
    .select("id, ingest_slug")
    .eq("ingest_slug", slug)
    .maybeSingle();

  if (!store) {
    return NextResponse.json({ error: `No store with ingest_slug ${slug}` }, { status: 404 });
  }

  // Find a CSV attachment — preferred path. Fallback: body text if it looks CSV-like.
  const csvAttachment = (body.attachments ?? []).find(
    (a) => (a.filename?.toLowerCase().endsWith(".csv") || a.content_type?.includes("csv")) && a.content,
  );
  const raw = csvAttachment ? b64decode(csvAttachment.content!) : body.text;
  if (!raw || !raw.includes(",")) {
    return NextResponse.json({ error: "No CSV content found in email" }, { status: 400 });
  }

  const rows = toObjects(parseCsv(raw));

  // Load reps for this store
  const { data: reps } = await admin
    .from("reps")
    .select("id, name, email")
    .eq("store_id", store.id)
    .eq("active", true);

  type RepLite = { id: string; name: string; email: string | null };
  const byEmail = new Map<string, RepLite>();
  const byName = new Map<string, RepLite>();
  for (const r of (reps ?? []) as RepLite[]) {
    if (r.email) byEmail.set(r.email.toLowerCase(), r);
    byName.set(normalizeName(r.name), r);
  }

  const { data: existingVins } = await admin
    .from("sales")
    .select("vin, sold_at_date")
    .eq("store_id", store.id)
    .is("deleted_at", null)
    .not("vin", "is", null);
  const seenVins = new Set<string>(
    (existingVins ?? []).map((s) => `${s.vin}|${s.sold_at_date}`),
  );

  let added = 0,
    skipped = 0,
    errored = 0;
  const toInsert: Record<string, unknown>[] = [];
  const errorLog: { row: number; msg: string }[] = [];

  rows.forEach((r, idx) => {
    const repEmail = pick(r, ["email", "rep_email", "salesperson_email"]);
    const repName = pick(r, ["rep", "rep_name", "salesperson", "salesperson_name", "name"]);
    const dateRaw = pick(r, ["sold_at", "sale_date", "deal_date", "sold_date", "date"]);
    const vin = pick(r, ["vin"]);
    const vehicle = pick(r, ["vehicle", "year_make_model", "vehicle_desc"]) ?? "";
    const grossRaw = pick(r, ["gross", "front_gross", "total_gross", "fe_gross"]);
    const kindRaw = pick(r, ["kind", "type", "new_used", "nu"]);
    const source = pick(r, ["source", "lead_source"]) ?? "other";

    let matched: RepLite | undefined;
    if (repEmail) matched = byEmail.get(repEmail.toLowerCase());
    if (!matched && repName) matched = byName.get(normalizeName(repName));

    const parsed = parseDate(dateRaw);
    if (!matched || !parsed) {
      errored++;
      errorLog.push({
        row: idx + 2,
        msg: !matched ? `Rep not found: ${repName ?? repEmail}` : `Invalid date: ${dateRaw}`,
      });
      return;
    }

    const vinClean = vin && vin.length >= 5 ? vin.toUpperCase() : null;
    if (vinClean && seenVins.has(`${vinClean}|${parsed.date}`)) {
      skipped++;
      return;
    }
    const kind: "new" | "used" =
      kindRaw && ["new", "n"].includes(kindRaw.toLowerCase()) ? "new" : "used";

    toInsert.push({
      rep_id: matched.id,
      store_id: store.id,
      sold_at: parsed.iso,
      sold_at_date: parsed.date,
      vin: vinClean,
      vehicle,
      gross: parseGross(grossRaw),
      kind,
      source: source.toLowerCase(),
    });
    added++;
  });

  // Create ingest_run (auto-committed unless there are errors)
  const autoCommit = errored === 0;
  const status = autoCommit ? "committed" : "previewing";

  const { data: run } = await admin
    .from("ingest_runs")
    .insert({
      store_id: store.id,
      source: "email",
      status,
      from_email: body.from ?? null,
      filename: csvAttachment?.filename ?? "inline.csv",
      rows_total: rows.length,
      rows_added: autoCommit ? added : 0,
      rows_skipped: skipped,
      rows_errored: errored,
      committed_at: autoCommit ? new Date().toISOString() : null,
      preview: autoCommit ? null : toInsert,
      error_log: errorLog,
    })
    .select("id, status")
    .single();

  if (autoCommit && toInsert.length > 0) {
    const rowsWithRun = toInsert.map((r) => ({ ...r, ingest_run_id: run?.id }));
    await admin
      .from("sales")
      .upsert(rowsWithRun, { onConflict: "store_id,vin,sold_at_date", ignoreDuplicates: true });
  }

  return NextResponse.json({
    data: {
      ingest_run_id: run?.id,
      status,
      added: autoCommit ? added : 0,
      skipped,
      errored,
      total: rows.length,
    },
  });
}
