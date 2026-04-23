// CSV sales ingest — drop/pick a CSV, preview parsed rows, confirm.

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ic, SectionHead } from "@/components/primitives";
import { fmtUSD } from "@/lib/pace";

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

interface IngestRun {
  id: string;
  status: string;
  rows_total: number;
  rows_added: number;
  rows_skipped: number;
  rows_errored: number;
}

export function IngestFlow({
  storeId,
  storeName,
  ingestSlug,
}: {
  storeId: string;
  storeName: string;
  ingestSlug: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [run, setRun] = useState<IngestRun | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<number | null>(null);

  async function upload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/stores/${storeId}/ingest/csv`, {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setRun(json.data.ingest_run);
      setPreview(json.data.preview_sample);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function confirm() {
    if (!run) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ingest_runs/${run.id}/confirm`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Confirm failed");
      setCommitted(json.data.inserted);
      setTimeout(() => {
        router.push("/app/manager");
        router.refresh();
      }, 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        fontFamily: "var(--font-inter-tight)",
        color: "#0d0e10",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Link
            href="/app/manager"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#6b6862", fontSize: 13 }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ fontSize: 12, color: "#6b6862" }}>
            {storeName}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e3da",
            borderRadius: 16,
            padding: "28px",
          }}
        >
          <SectionHead>Sales ingest</SectionHead>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -0.6,
              marginTop: 6,
              marginBottom: 8,
            }}
          >
            Upload yesterday&apos;s deals.
          </div>
          <div style={{ fontSize: 13, color: "#6b6862", lineHeight: 1.5, marginBottom: 20 }}>
            Drop a CSV from your DMS / CRM. Columns we look for:
            <code style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, background: "#f7f5ef", padding: "2px 6px", borderRadius: 4, marginLeft: 4 }}>
              sold_at, rep, vin, vehicle, gross, kind
            </code>
            . Aliases like <code style={{ fontFamily: "var(--font-jetbrains)" }}>sale_date</code>, <code style={{ fontFamily: "var(--font-jetbrains)" }}>salesperson</code>, <code style={{ fontFamily: "var(--font-jetbrains)" }}>front_gross</code> are tolerated.
          </div>

          {committed !== null ? (
            <div
              style={{
                background: "#e5f5ec",
                color: "#17a058",
                border: "1px solid #17a05833",
                borderRadius: 12,
                padding: "14px 16px",
                fontWeight: 600,
              }}
            >
              ✓ Imported {committed} sales. Redirecting to dashboard…
            </div>
          ) : !run ? (
            <>
              <div
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) setFile(f);
                }}
                style={{
                  border: "2px dashed #d8d4c7",
                  borderRadius: 14,
                  padding: "48px 24px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: "#f7f5ef",
                }}
              >
                <input
                  ref={fileInput}
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <div style={{ fontSize: 15, fontWeight: 600, color: "#0d0e10" }}>
                  {file ? file.name : "Click or drop a CSV"}
                </div>
                <div style={{ fontSize: 12, color: "#6b6862", marginTop: 4 }}>
                  {file
                    ? `${(file.size / 1024).toFixed(1)} KB — ready to preview`
                    : "Max 5 MB · one deal per row"}
                </div>
              </div>

              {error && (
                <div
                  style={{
                    marginTop: 14,
                    background: "#fbe9e7",
                    color: "#d43f3a",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={upload}
                disabled={!file || loading}
                style={primaryBtn(!file || loading)}
              >
                {loading ? "Parsing…" : "Preview →"}
              </button>

              {ingestSlug && (
                <div
                  style={{
                    marginTop: 20,
                    padding: "12px 14px",
                    background: "#f7f5ef",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#6b6862",
                  }}
                >
                  <div style={{ fontFamily: "var(--font-archivo)", fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#9a968d", marginBottom: 4 }}>
                    Or forward DMS emails to
                  </div>
                  <code style={{ fontFamily: "var(--font-jetbrains)", fontSize: 13, color: "#0d0e10" }}>
                    {ingestSlug}@ingest.pace.direct
                  </code>
                  <div style={{ marginTop: 4 }}>(coming online once DNS + email routing are live)</div>
                </div>
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <SummaryCell label="Total" value={run.rows_total} />
                <SummaryCell label="Ready" value={run.rows_added} color="#17a058" />
                <SummaryCell label="Duplicate" value={run.rows_skipped} color="#d88a1a" />
                <SummaryCell label="Errors" value={run.rows_errored} color="#d43f3a" />
              </div>

              <div style={{ border: "1px solid #e6e3da", borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "40px 1.4fr 0.8fr 1.4fr 0.8fr 0.6fr 1fr",
                    padding: "10px 12px",
                    background: "#f7f5ef",
                    fontFamily: "var(--font-archivo)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    color: "#6b6862",
                    textTransform: "uppercase",
                  }}
                >
                  <div>#</div><div>Rep</div><div>Date</div><div>Vehicle · VIN</div><div>Gross</div><div>Kind</div><div>Status</div>
                </div>
                {preview.map((r) => (
                  <div
                    key={r.row}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "40px 1.4fr 0.8fr 1.4fr 0.8fr 0.6fr 1fr",
                      padding: "10px 12px",
                      borderTop: "1px solid #e6e3da",
                      fontSize: 12,
                      alignItems: "center",
                    }}
                  >
                    <div style={{ color: "#9a968d", fontFamily: "var(--font-jetbrains)" }}>{r.row}</div>
                    <div>
                      {r.matched_rep_name ?? <span style={{ color: "#d43f3a" }}>{r.rep_name_raw || "(blank)"}</span>}
                    </div>
                    <div style={{ fontFamily: "var(--font-jetbrains)" }}>{r.sold_at_date ?? "—"}</div>
                    <div style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {r.vehicle || "—"}
                      {r.vin && (
                        <span style={{ color: "#9a968d", marginLeft: 6, fontFamily: "var(--font-jetbrains)", fontSize: 11 }}>
                          {r.vin.slice(-6)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 700 }}>{fmtUSD(r.gross)}</div>
                    <div style={{ color: "#6b6862" }}>{r.kind}</div>
                    <div>
                      {r.errors.length > 0 ? (
                        <span style={{ color: "#d43f3a", fontWeight: 600 }}>Error</span>
                      ) : r.duplicate ? (
                        <span style={{ color: "#d88a1a", fontWeight: 600 }}>Duplicate</span>
                      ) : (
                        <span style={{ color: "#17a058", fontWeight: 600 }}>Ready</span>
                      )}
                    </div>
                  </div>
                ))}
                {run.rows_total > preview.length && (
                  <div style={{ padding: "10px 12px", borderTop: "1px solid #e6e3da", fontSize: 12, color: "#6b6862" }}>
                    …and {run.rows_total - preview.length} more rows
                  </div>
                )}
              </div>

              {error && (
                <div
                  style={{
                    marginBottom: 14,
                    background: "#fbe9e7",
                    color: "#d43f3a",
                    borderRadius: 10,
                    padding: "10px 12px",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => {
                    setRun(null);
                    setPreview([]);
                    setFile(null);
                  }}
                  style={ghostBtn}
                >
                  Discard
                </button>
                <button
                  onClick={confirm}
                  disabled={loading || run.rows_added === 0}
                  style={{ ...primaryBtn(loading || run.rows_added === 0), flex: 1 }}
                >
                  {loading ? "Committing…" : `Commit ${run.rows_added} sales →`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCell({ label, value, color = "#0d0e10" }: { label: string; value: number; color?: string }) {
  return (
    <div
      style={{
        background: "#f7f5ef",
        border: "1px solid #e6e3da",
        borderRadius: 10,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: "#6b6862",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontSize: 22,
          fontWeight: 800,
          color,
          letterSpacing: -0.5,
          marginTop: 2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    marginTop: 14,
    width: "100%",
    height: 50,
    background: disabled ? "#9a968d" : "#0d0e10",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    fontFamily: "var(--font-archivo)",
    fontWeight: 700,
    fontSize: 13,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    cursor: disabled ? "default" : "pointer",
  };
}

const ghostBtn: React.CSSProperties = {
  marginTop: 14,
  padding: "0 20px",
  height: 50,
  background: "transparent",
  color: "#0d0e10",
  border: "1px solid #d8d4c7",
  borderRadius: 10,
  fontFamily: "var(--font-archivo)",
  fontWeight: 600,
  fontSize: 13,
  letterSpacing: 1,
  textTransform: "uppercase",
  cursor: "pointer",
};
