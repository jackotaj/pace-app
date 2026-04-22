// Manager onboarding flow — 2 required steps:
//   1. Claim your store (org name, store name, city/state, timezone)
//   2. Paste your roster (name, email, goal_units, goal_gross) — parse CSV/TSV/lines
// Optional step 3 (first CSV upload) is deferred to /app/manager/ingest after setup.

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Ic, SectionHead } from "@/components/primitives";

const TIMEZONES = [
  { id: "America/New_York", label: "Eastern (NY, Miami, Detroit)" },
  { id: "America/Chicago", label: "Central (Chicago, Dallas, St. Louis)" },
  { id: "America/Denver", label: "Mountain (Denver, Salt Lake)" },
  { id: "America/Phoenix", label: "Arizona (Phoenix)" },
  { id: "America/Los_Angeles", label: "Pacific (LA, Seattle)" },
  { id: "America/Boise", label: "Mountain · Boise" },
  { id: "America/Anchorage", label: "Alaska" },
  { id: "Pacific/Honolulu", label: "Hawaii" },
];

interface RosterRow {
  name: string;
  email: string;
  goal_units: string;
  goal_gross: string;
}

function parseRoster(raw: string): RosterRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line) => {
    // Allow commas, tabs, or pipes as separators. Also "Name <email>" format.
    const parts = line.split(/\t|,|\|/).map((p) => p.trim());
    let name = parts[0] ?? "";
    let email = parts[1] ?? "";
    const goal_units = parts[2] ?? "";
    const goal_gross = parts[3] ?? "";

    // "Name Name <email@domain>" form
    const m = name.match(/^(.+?)\s*<([^>]+)>$/);
    if (m) {
      name = m[1].trim();
      email = m[2].trim();
    }
    return { name, email, goal_units, goal_gross };
  });
}

export function OnboardFlow({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [orgName, setOrgName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [storeId, setStoreId] = useState<string | null>(null);

  // Step 2
  const [rosterText, setRosterText] = useState("");
  const [defaultGoalUnits, setDefaultGoalUnits] = useState("12");
  const [defaultGoalGross, setDefaultGoalGross] = useState("25000");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rosterPreview = useMemo(() => parseRoster(rosterText), [rosterText]);

  async function submitStep1(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgName,
          storeName,
          city,
          state: stateCode,
          timezone,
        }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Could not create store");
      const json = await res.json();
      setStoreId(json.data.store.id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function submitStep2(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!storeId) {
      setError("Store not set");
      return;
    }
    if (rosterPreview.length === 0) {
      setError("Paste at least one rep");
      return;
    }
    setLoading(true);
    try {
      const defaults = {
        units: Math.max(0, Math.floor(Number(defaultGoalUnits) || 0)),
        gross: Math.max(0, Number(defaultGoalGross) || 0),
      };
      const reps = rosterPreview.map((r) => ({
        name: r.name,
        email: r.email || undefined,
        goal_units: r.goal_units ? Number(r.goal_units) : defaults.units,
        goal_gross: r.goal_gross ? Number(r.goal_gross) : defaults.gross,
      }));
      const res = await fetch(`/api/stores/${storeId}/roster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reps }),
      });
      if (!res.ok) throw new Error((await res.json())?.error || "Could not save roster");
      router.push("/app/manager");
      router.refresh();
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
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "32px 24px",
        }}
      >
        {/* Header */}
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            textDecoration: "none",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#0d0e10",
              color: "#fff",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Ic.zap(16)}
          </div>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 18,
              color: "#0d0e10",
              letterSpacing: -0.4,
            }}
          >
            Pace
          </div>
        </Link>

        {/* Progress */}
        <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
          <div style={{ flex: 1, height: 4, background: step >= 1 ? "#0d0e10" : "#e6e3da", borderRadius: 2 }} />
          <div style={{ flex: 1, height: 4, background: step >= 2 ? "#0d0e10" : "#e6e3da", borderRadius: 2 }} />
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e3da",
            borderRadius: 16,
            padding: "32px",
          }}
        >
          {step === 1 ? (
            <form onSubmit={submitStep1}>
              <SectionHead>Step 1 of 2</SectionHead>
              <div
                style={{
                  fontFamily: "var(--font-archivo)",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: -0.7,
                  marginTop: 6,
                  marginBottom: 6,
                }}
              >
                Claim your store.
              </div>
              <div style={{ fontSize: 13, color: "#6b6862", marginBottom: 24 }}>
                Signed in as <b style={{ color: "#0d0e10" }}>{userEmail}</b>. You&apos;ll be the manager.
              </div>

              <Field label="Dealership group (org)">
                <input
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Greenfield Auto Group"
                  style={inputStyle}
                />
              </Field>
              <Field label="Store name">
                <input
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Greenfield Auto · Boise"
                  style={inputStyle}
                />
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <Field label="City">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Boise"
                    style={inputStyle}
                  />
                </Field>
                <Field label="State">
                  <input
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="ID"
                    style={inputStyle}
                  />
                </Field>
              </div>
              <Field label="Timezone">
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  style={inputStyle}
                >
                  {TIMEZONES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </Field>

              {error && <ErrorBox>{error}</ErrorBox>}

              <button
                type="submit"
                disabled={loading || !orgName || !storeName}
                style={primaryBtn(loading || !orgName || !storeName)}
              >
                {loading ? "Saving…" : "Continue →"}
              </button>
            </form>
          ) : (
            <form onSubmit={submitStep2}>
              <SectionHead>Step 2 of 2</SectionHead>
              <div
                style={{
                  fontFamily: "var(--font-archivo)",
                  fontSize: 28,
                  fontWeight: 800,
                  letterSpacing: -0.7,
                  marginTop: 6,
                  marginBottom: 6,
                }}
              >
                Paste your roster.
              </div>
              <div style={{ fontSize: 13, color: "#6b6862", marginBottom: 20, lineHeight: 1.5 }}>
                One rep per line. Name, email, unit goal, gross goal — separated by comma, tab, or pipe.
                Missing goals use the defaults below.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <Field label="Default unit goal">
                  <input
                    type="number"
                    value={defaultGoalUnits}
                    onChange={(e) => setDefaultGoalUnits(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
                <Field label="Default gross goal ($)">
                  <input
                    type="number"
                    value={defaultGoalGross}
                    onChange={(e) => setDefaultGoalGross(e.target.value)}
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Roster (paste from email, Excel, HR sheet…)">
                <textarea
                  required
                  rows={10}
                  value={rosterText}
                  onChange={(e) => setRosterText(e.target.value)}
                  placeholder={`Marcus Hale, marcus@greenfield.com, 12, 26000\nJessica Tran, jessica@greenfield.com, 10, 22000\nTodd Ramirez, todd@greenfield.com`}
                  style={{
                    ...inputStyle,
                    height: "auto",
                    padding: "12px 14px",
                    fontFamily: "var(--font-jetbrains)",
                    fontSize: 13,
                    resize: "vertical",
                  }}
                />
              </Field>

              {rosterPreview.length > 0 && (
                <div
                  style={{
                    background: "#f7f5ef",
                    border: "1px solid #e6e3da",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 16,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-archivo)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 1.2,
                      color: "#6b6862",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Preview · {rosterPreview.length} reps
                  </div>
                  <div style={{ fontFamily: "var(--font-jetbrains)", fontSize: 12, color: "#0d0e10" }}>
                    {rosterPreview.slice(0, 5).map((r, i) => (
                      <div key={i}>
                        {r.name}
                        {r.email && <span style={{ color: "#6b6862" }}> · {r.email}</span>}
                        {r.goal_units && (
                          <span style={{ color: "#6b6862" }}>
                            {" "}
                            · {r.goal_units} units / ${r.goal_gross || defaultGoalGross}
                          </span>
                        )}
                      </div>
                    ))}
                    {rosterPreview.length > 5 && (
                      <div style={{ color: "#6b6862", marginTop: 4 }}>
                        …and {rosterPreview.length - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && <ErrorBox>{error}</ErrorBox>}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  style={{
                    ...ghostBtnStyle,
                  }}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading || rosterPreview.length === 0}
                  style={{ ...primaryBtn(loading || rosterPreview.length === 0), flex: 1 }}
                >
                  {loading ? "Creating reps…" : `Save ${rosterPreview.length} reps →`}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ marginTop: 16, fontSize: 12, color: "#9a968d", textAlign: "center" }}>
          After setup you can upload yesterday&apos;s sales CSV or forward your DMS email to your store&apos;s ingest address.
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 44,
  padding: "0 12px",
  background: "#f7f5ef",
  border: "1px solid #e6e3da",
  borderRadius: 8,
  fontSize: 14,
  fontFamily: "var(--font-inter-tight)",
  color: "#0d0e10",
  outline: "none",
};

function primaryBtn(disabled: boolean): React.CSSProperties {
  return {
    marginTop: 16,
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

const ghostBtnStyle: React.CSSProperties = {
  marginTop: 16,
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontFamily: "var(--font-archivo)",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 1.2,
          color: "#6b6862",
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ErrorBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 12,
        padding: "10px 12px",
        background: "#fbe9e7",
        color: "#d43f3a",
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}
