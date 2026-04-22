// POST /api/stores/[id]/ingest/csv — upload CSV (multipart form), parse, match reps,
// produce a preview ingest_run (status='previewing'). No rows committed yet.
//
// Expected CSV columns (case-insensitive, aliases tolerated):
//   sold_at | sale_date | deal_date        → required (ISO date or MM/DD/YYYY)
//   rep | salesperson | rep_name | email   → required
//   vin                                     → optional (but enables dedup)
//   vehicle | year_make_model               → optional
//   gross | front_gross | total_gross       → optional (defaults 0)
//   kind | type                             → optional ("new" | "used"), default used
//   source                                  → optional

import { NextResponse } from "next/server";
import { requireManagerOfStore, UnauthorizedError } from "@/lib/supabase/tenancy";
import { parseCsv, pick, toObjects } from "@/lib/csv";

interface PreviewRow {
  row: number;
  rep_id?: string;
  rep_name_raw: string;
  sold_at: string | null;
  sold_at_date: string | null;
  vin: string | null;
  vehicle: string;
  gross: number;
  kind: "new" | "used";
  source: string;
  duplicate: boolean;
  matched_rep_name?: string;
  errors: string[];
}

function parseDate(raw: string | undefined): { iso: string; date: string } | null {
  if (!raw) return null;
  const s = raw.trim();
  // ISO yyyy-mm-dd or yyyy-mm-ddThh:mm:ssZ
  const iso = /^\d{4}-\d{2}-\d{2}/.test(s) ? s : null;
  if (iso) {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) return { iso: d.toISOString(), date: iso.slice(0, 10) };
  }
  // MM/DD/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m) {
    let [, mo, da, yr] = m;
    if (yr.length === 2) yr = "20" + yr;
    const d = new Date(`${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}T12:00:00Z`);
    if (!isNaN(d.getTime()))
      return { iso: d.toISOString(), date: d.toISOString().slice(0, 10) };
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
    const text = await file.text();
    const rows = toObjects(parseCsv(text));

    // Load reps for name/email matching
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

    // Load existing sales for dedup (store + vin + sold_at_date)
    const { data: existingVins } = await admin
      .from("sales")
      .select("vin, sold_at_date")
      .eq("store_id", store.id)
      .is("deleted_at", null)
      .not("vin", "is", null);
    const seenVins = new Set<string>(
      (existingVins ?? []).map((s) => `${s.vin}|${s.sold_at_date}`),
    );

    let added = 0;
    let skipped = 0;
    let errored = 0;
    const preview: PreviewRow[] = [];

    rows.forEach((r, idx) => {
      const errors: string[] = [];
      const repEmail = pick(r, ["email", "rep_email", "salesperson_email"]);
      const repName = pick(r, ["rep", "rep_name", "salesperson", "salesperson_name", "name"]);
      const dateRaw = pick(r, ["sold_at", "sale_date", "deal_date", "sold_date", "date"]);
      const vin = pick(r, ["vin"]);
      const vehicle = pick(r, ["vehicle", "year_make_model", "vehicle_desc"]) ?? "";
      const grossRaw = pick(r, ["gross", "front_gross", "total_gross", "fe_gross"]);
      const kindRaw = pick(r, ["kind", "type", "new_used", "nu"]);
      const source = pick(r, ["source", "lead_source"]) ?? "other";

      let matchedRep: RepLite | undefined;
      if (repEmail) matchedRep = byEmail.get(repEmail.toLowerCase());
      if (!matchedRep && repName) matchedRep = byName.get(normalizeName(repName));
      if (!matchedRep) errors.push(`Rep not found: ${repName ?? repEmail ?? "(blank)"}`);

      const parsedDate = parseDate(dateRaw);
      if (!parsedDate) errors.push(`Invalid date: ${dateRaw ?? "(blank)"}`);

      const kind: "new" | "used" =
        kindRaw && ["new", "n"].includes(kindRaw.toLowerCase()) ? "new" : "used";

      const vinClean = vin && vin.length >= 5 ? vin.toUpperCase() : null;
      const isDup =
        vinClean && parsedDate
          ? seenVins.has(`${vinClean}|${parsedDate.date}`)
          : false;
      if (isDup) skipped++;
      else if (errors.length > 0) errored++;
      else added++;

      preview.push({
        row: idx + 2, // +2 because we dropped header and 1-indexed
        rep_id: matchedRep?.id,
        rep_name_raw: repName ?? repEmail ?? "",
        sold_at: parsedDate?.iso ?? null,
        sold_at_date: parsedDate?.date ?? null,
        vin: vinClean,
        vehicle,
        gross: parseGross(grossRaw),
        kind,
        source: source.toLowerCase(),
        duplicate: isDup,
        matched_rep_name: matchedRep?.name,
        errors,
      });
    });

    // Save the ingest_run as a preview
    const { data: run, error: runErr } = await admin
      .from("ingest_runs")
      .insert({
        store_id: store.id,
        source: "csv_upload",
        status: "previewing",
        triggered_by: user.id,
        filename: file.name,
        rows_total: preview.length,
        rows_added: added,
        rows_skipped: skipped,
        rows_errored: errored,
        preview,
      })
      .select("id, status, rows_total, rows_added, rows_skipped, rows_errored")
      .single();

    if (runErr) return NextResponse.json({ error: runErr.message }, { status: 500 });

    return NextResponse.json({
      data: {
        ingest_run: run,
        preview_sample: preview.slice(0, 10),
      },
    });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
