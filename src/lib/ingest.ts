// Shared ingest logic: CSV row → normalized sale candidate.
// Handles multiple DMS/CRM export formats via column aliases + value normalization.

import { parseCsv, pick, toObjects } from "@/lib/csv";

export interface SaleCandidate {
  row: number;
  rep_id?: string;
  rep_name_raw: string;
  matched_rep_name?: string;
  deal_number: string | null;
  sale_id: string | null;
  sold_at: string | null;
  sold_at_date: string | null;
  vin: string | null;
  vehicle: string;
  front_gross: number;
  back_gross: number;
  gross: number; // front + back
  kind: "new" | "used";
  source: "walk-in" | "web" | "curb" | "referral" | "phone" | "other";
  skip_reason: "inactive" | "lost" | "duplicate_in_file" | null;
  duplicate: boolean; // duplicate vs existing DB
  errors: string[];
}

export interface RepLite {
  id: string;
  name: string;
  email: string | null;
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
    const d = new Date(
      `${yr}-${mo.padStart(2, "0")}-${da.padStart(2, "0")}T12:00:00Z`,
    );
    if (!isNaN(d.getTime())) return { iso: d.toISOString(), date: d.toISOString().slice(0, 10) };
  }
  return null;
}

function parseNum(raw: string | undefined): number {
  if (!raw) return 0;
  const n = Number(raw.replace(/[$,\s]/g, ""));
  return isNaN(n) ? 0 : n;
}

function normalizeName(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeSource(raw: string | undefined): SaleCandidate["source"] {
  if (!raw) return "other";
  const s = raw.toLowerCase();
  if (s.includes("walk") || s.includes("local") || s.includes("in-person") || s === "ups") return "walk-in";
  if (s.includes("internet") || s.includes("web") || s.includes("online") || s.includes("digital")) return "web";
  if (s === "phone" || s.startsWith("phone") || s.includes("inbound") || s.includes("inbound phone")) return "phone";
  if (s.includes("repeat") || s.includes("referral") || s.includes("service")) return "referral";
  if (s.includes("curb")) return "curb";
  return "other";
}

function normalizeKind(raw: string | undefined): "new" | "used" {
  if (!raw) return "used";
  const s = raw.toLowerCase();
  if (s === "new" || s === "n") return "new";
  // Certified / Pre-owned / Used / CPO / 'U' all bucket as used
  return "used";
}

function buildVehicle(row: Record<string, string>): string {
  const year = pick(row, ["year"]);
  const make = pick(row, ["make"]);
  const model = pick(row, ["model"]);
  const trim = pick(row, ["trim"]);
  const explicit = pick(row, ["vehicle", "year_make_model", "vehicle_desc"]);
  if (explicit) return explicit;
  return [year, make, model, trim].filter(Boolean).join(" ").trim();
}

// Detects VinSolutions/Reynolds style detail format (has "Lead Status Type" + "Deal Number").
function isDetailReport(headers: string[]): boolean {
  const h = new Set(headers.map((x) => x.toLowerCase()));
  return h.has("lead status type") || h.has("deal number") || h.has("sale id");
}

export interface NormalizeInput {
  csvText: string;
  reps: RepLite[];
  existingKeys: {
    deals: Set<string>; // store's deal_numbers already in DB
    saleIds: Set<string>; // store's sale_ids already in DB
    vinDates: Set<string>; // "vin|yyyy-mm-dd"
  };
}

export interface NormalizeResult {
  format: "vinsolutions_detail" | "generic_per_deal";
  rows: SaleCandidate[];
  counts: { total: number; ready: number; duplicate: number; errored: number; filtered: number };
}

export function normalizeSalesCsv({ csvText, reps, existingKeys }: NormalizeInput): NormalizeResult {
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) {
    return {
      format: "generic_per_deal",
      rows: [],
      counts: { total: 0, ready: 0, duplicate: 0, errored: 0, filtered: 0 },
    };
  }
  const headers = parsed[0];
  const isDetail = isDetailReport(headers);
  const rows = toObjects(parsed);

  const byEmail = new Map<string, RepLite>();
  const byName = new Map<string, RepLite>();
  for (const r of reps) {
    if (r.email) byEmail.set(r.email.toLowerCase(), r);
    byName.set(normalizeName(r.name), r);
  }

  // In-file dedup: first occurrence wins for a given deal_number / sale_id.
  const seenDeal = new Set<string>();
  const seenSaleId = new Set<string>();

  const out: SaleCandidate[] = [];
  let ready = 0,
    duplicate = 0,
    errored = 0,
    filtered = 0;

  rows.forEach((r, idx) => {
    const errors: string[] = [];

    // VinSolutions-style status filter
    if (isDetail) {
      const status = pick(r, ["status"]);
      const leadType = pick(r, ["lead status type"]);
      if (status && status.toLowerCase() === "inactive") {
        out.push(skeleton(idx, r, "inactive"));
        filtered++;
        return;
      }
      if (leadType && leadType.toLowerCase() !== "sold") {
        out.push(skeleton(idx, r, "lost"));
        filtered++;
        return;
      }
    }

    const repEmail = pick(r, ["email", "rep_email", "salesperson_email"]);
    const repName = pick(r, [
      "rep",
      "rep_name",
      "salesperson",
      "salesperson_name",
      "name",
      "sales rep",
      "sales_rep",
      "sales representative",
      "sales_representative",
      "user",
    ]);
    const dateRaw = pick(r, ["sold_at", "sale_date", "deal_date", "sold_date", "sold date", "date"]);
    const vin = pick(r, ["vin"]);
    const vehicle = buildVehicle(r);
    const grossRaw = pick(r, ["gross", "total_gross", "fe_gross"]);
    const frontGrossRaw = pick(r, ["front_gross", "front gross", "fe_gross", "front"]);
    const backGrossRaw = pick(r, ["back_gross", "back gross", "bo_gross", "back"]);
    const kindRaw = pick(r, ["kind", "type", "new_used", "nu", "inventory type", "inventory_type"]);
    const leadSource = pick(r, ["lead source", "lead_source", "source"]);
    const leadTypeVal = pick(r, ["lead type", "lead_type"]); // VinSolutions uses this for Internet/Walk-in/Phone
    const dealNumber = pick(r, ["deal number", "deal_number", "deal"]);
    const saleId = pick(r, ["sale id", "sale_id", "saleid"]);

    let matchedRep: RepLite | undefined;
    if (repEmail) matchedRep = byEmail.get(repEmail.toLowerCase());
    if (!matchedRep && repName) matchedRep = byName.get(normalizeName(repName));
    if (!matchedRep) errors.push(`Rep not found: ${repName ?? repEmail ?? "(blank)"}`);

    const parsedDate = parseDate(dateRaw);
    if (!parsedDate) errors.push(`Invalid date: ${dateRaw ?? "(blank)"}`);

    const kind = normalizeKind(kindRaw);
    // Prefer Lead Type over Lead Source for the channel (Walk-in/Phone/Internet) —
    // Lead Source is often more granular ("Capital One", "Repeat Customer", "Truecar") and
    // we'd want to bucket those. Lead Source wins ONLY if Lead Type is absent.
    const sourceRaw = leadTypeVal ?? leadSource;
    const source = normalizeSource(sourceRaw);

    const vinClean = vin && vin.length >= 5 ? vin.toUpperCase() : null;
    const dealNum = dealNumber?.trim() || null;
    const sId = saleId?.trim() || null;

    // In-file dedup (within this upload)
    if (dealNum && seenDeal.has(dealNum)) {
      out.push({ ...skeleton(idx, r, "duplicate_in_file"), deal_number: dealNum });
      duplicate++;
      return;
    }
    if (!dealNum && sId && seenSaleId.has(sId)) {
      out.push({ ...skeleton(idx, r, "duplicate_in_file"), sale_id: sId });
      duplicate++;
      return;
    }
    if (dealNum) seenDeal.add(dealNum);
    if (sId) seenSaleId.add(sId);

    // Dedup against DB
    const isDupDB =
      (dealNum && existingKeys.deals.has(dealNum)) ||
      (sId && existingKeys.saleIds.has(sId)) ||
      (vinClean && parsedDate && existingKeys.vinDates.has(`${vinClean}|${parsedDate.date}`));

    const front = parseNum(frontGrossRaw);
    const back = parseNum(backGrossRaw);
    const total = parseNum(grossRaw);
    // Use explicit total if provided, otherwise sum front + back
    const gross = total !== 0 ? total : front + back;

    if (isDupDB) duplicate++;
    else if (errors.length > 0) errored++;
    else ready++;

    out.push({
      row: idx + 2,
      rep_id: matchedRep?.id,
      rep_name_raw: repName ?? repEmail ?? "",
      matched_rep_name: matchedRep?.name,
      deal_number: dealNum,
      sale_id: sId,
      sold_at: parsedDate?.iso ?? null,
      sold_at_date: parsedDate?.date ?? null,
      vin: vinClean,
      vehicle,
      front_gross: front,
      back_gross: back,
      gross,
      kind,
      source,
      skip_reason: null,
      duplicate: !!isDupDB,
      errors,
    });
  });

  return {
    format: isDetail ? "vinsolutions_detail" : "generic_per_deal",
    rows: out,
    counts: { total: out.length, ready, duplicate, errored, filtered },
  };
}

function skeleton(idx: number, r: Record<string, string>, reason: SaleCandidate["skip_reason"]): SaleCandidate {
  return {
    row: idx + 2,
    rep_name_raw: pick(r, ["rep", "sales rep", "salesperson", "user", "name"]) ?? "",
    matched_rep_name: undefined,
    deal_number: null,
    sale_id: null,
    sold_at: null,
    sold_at_date: null,
    vin: null,
    vehicle: "",
    front_gross: 0,
    back_gross: 0,
    gross: 0,
    kind: "used",
    source: "other",
    skip_reason: reason,
    duplicate: false,
    errors: [],
  };
}
