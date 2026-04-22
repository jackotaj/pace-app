// Manager Dashboard (desktop) — ported verbatim from design_files/manager.jsx

"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { usePaceStore } from "@/lib/store";
import { computePace, fmtUSDk, MONTH, type Rep } from "@/lib/pace";
import {
  Avatar,
  Confetti,
  Ic,
  PacePill,
  SectionHead,
  Toast,
} from "@/components/primitives";

type SortKey = "pace" | "sold" | "gross" | "activity";

const primaryBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: "#0d0e10",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  fontFamily: "var(--font-archivo)",
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  cursor: "pointer",
};

const ghostBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  background: "transparent",
  color: "#0d0e10",
  border: "1px solid #d8d4c7",
  borderRadius: 8,
  fontFamily: "var(--font-archivo)",
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: 1,
  textTransform: "uppercase",
  cursor: "pointer",
};

function KpiCard({
  label,
  value,
  sub,
  bar,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  bar?: number;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e6e3da",
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontSize: 9,
          fontWeight: 700,
          color: "#6b6862",
          letterSpacing: 1.4,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: -1,
            color: accent || "#0d0e10",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ fontSize: 11, color: "#6b6862", marginTop: 4 }}>{sub}</div>
      {bar !== undefined && (
        <div
          style={{
            height: 3,
            background: "#e6e3da",
            borderRadius: 2,
            marginTop: 8,
            overflow: "hidden",
          }}
        >
          <div
            className="bar-fill"
            style={{
              height: "100%",
              width: `${Math.min(100, bar * 100)}%`,
              background: "#0d0e10",
            }}
          />
        </div>
      )}
    </div>
  );
}

function DetailStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div style={{ padding: "10px 12px", background: "#f7f5ef", borderRadius: 8 }}>
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontSize: 9,
          fontWeight: 700,
          color: "#6b6862",
          letterSpacing: 1.2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontSize: 20,
          fontWeight: 800,
          color: accent || "#0d0e10",
          letterSpacing: -0.5,
          marginTop: 2,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: "#6b6862", marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

export function ManagerDashboard() {
  const reps = usePaceStore((s) => s.reps);
  const addSale = usePaceStore((s) => s.addSale);
  const toast = usePaceStore((s) => s.toast);
  const confetti = usePaceStore((s) => s.confetti);

  const [selectedId, setSelectedId] = useState("you");
  const [sortBy, setSortBy] = useState<SortKey>("pace");

  const withPace = reps.map((r) => ({ ...r, pace: computePace(r) }));
  const sorted = [...withPace].sort((a, b) => {
    if (sortBy === "pace") return a.pace.paceDelta - b.pace.paceDelta;
    if (sortBy === "sold") return b.sold - a.sold;
    if (sortBy === "gross") return b.gross - a.gross;
    if (sortBy === "activity") {
      const order: Record<string, number> = { today: 0, yesterday: 1, "2 days ago": 2 };
      return (order[a.lastActivity] ?? 9) - (order[b.lastActivity] ?? 9);
    }
    return 0;
  });

  const totalSold = reps.reduce((s, r) => s + r.sold, 0);
  const totalGoal = reps.reduce((s, r) => s + r.goalUnits, 0);
  const totalGross = reps.reduce((s, r) => s + r.gross, 0);
  const totalGrossGoal = reps.reduce((s, r) => s + r.goalGross, 0);
  const behindCount = withPace.filter((r) => r.pace.status === "behind").length;
  const aheadCount = withPace.filter((r) => r.pace.status === "ahead").length;
  const coldCount = withPace.filter((r) => r.daysSinceSale >= 4).length;

  const selected = withPace.find((r) => r.id === selectedId) || withPace[0];

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#f7f5ef",
        fontFamily: "var(--font-inter-tight)",
        color: "#0d0e10",
        position: "relative",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 220,
          borderRight: "1px solid #e6e3da",
          background: "#ffffff",
          padding: "22px 18px",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <div
            style={{
              width: 30,
              height: 30,
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
          <div>
            <div style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 15, letterSpacing: -0.3 }}>
              Pace
            </div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 9,
                fontWeight: 600,
                letterSpacing: 1.2,
                color: "#6b6862",
                textTransform: "uppercase",
              }}
            >
              Manager
            </div>
          </div>
        </div>
        {[
          { id: "team", label: "Team", icon: Ic.trophy, href: "/app/manager", active: true },
          { id: "roster", label: "Roster", icon: Ic.flame, href: "/app/manager/roster", active: false },
          { id: "ingest", label: "Ingest sales", icon: Ic.arrowU, href: "/app/manager/ingest", active: false },
          { id: "coach", label: "Coach", icon: Ic.msg, href: "#", active: false },
          { id: "deals", label: "Deals", icon: Ic.car, href: "#", active: false },
          { id: "setup", label: "Settings", icon: Ic.cal, href: "#", active: false },
        ].map((item) => (
          <Link
            key={item.id}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 10px",
              borderRadius: 8,
              background: item.active ? "#f7f5ef" : "transparent",
              color: item.active ? "#0d0e10" : "#6b6862",
              fontSize: 13,
              fontWeight: 500,
              marginBottom: 2,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            {item.icon(15)} {item.label}
          </Link>
        ))}
        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <div style={{ padding: "10px 10px", background: "#f7f5ef", borderRadius: 8 }}>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 9,
                fontWeight: 700,
                color: "#6b6862",
                letterSpacing: 1.2,
              }}
            >
              STORE
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>Greenfield Auto</div>
            <div style={{ fontSize: 11, color: "#6b6862", marginTop: 1 }}>Boise, ID · 8 reps</div>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto", padding: "22px 28px 40px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 22,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1.8,
                color: "#6b6862",
                textTransform: "uppercase",
              }}
            >
              {MONTH.label} · Day {MONTH.day} · {MONTH.daysRemaining} days left
            </div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: -0.7,
                marginTop: 2,
              }}
            >
              Team pace
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={ghostBtn}>{Ic.arrowD(13)} Export</button>
            <button style={primaryBtn}>Set April goals</button>
          </div>
        </div>

        {/* KPI cards */}
        <div
          className="grid grid-cols-2 md:grid-cols-4"
          style={{ gap: 14, marginBottom: 22 }}
        >
          <KpiCard
            label="Units · team"
            value={`${totalSold}`}
            sub={`/${totalGoal} goal · ${Math.round((totalSold / totalGoal) * 100)}%`}
            bar={totalSold / totalGoal}
          />
          <KpiCard
            label="Gross · team"
            value={fmtUSDk(totalGross)}
            sub={`of ${fmtUSDk(totalGrossGoal)}`}
            bar={totalGross / totalGrossGoal}
          />
          <KpiCard
            label="Behind pace"
            value={behindCount}
            sub={`${aheadCount} ahead · ${reps.length - behindCount - aheadCount} on pace`}
            accent="#d43f3a"
          />
          <KpiCard
            label="Cold reps"
            value={coldCount}
            sub="4+ days since last sale"
            accent="#d88a1a"
          />
        </div>

        {/* 2-column */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr]" style={{ gap: 18 }}>
          {/* Team table */}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e6e3da",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderBottom: "1px solid #e6e3da",
              }}
            >
              <SectionHead>Roster · sort by</SectionHead>
              <div style={{ display: "flex", gap: 2 }}>
                {(
                  [
                    { id: "pace", label: "Pace" },
                    { id: "sold", label: "Units" },
                    { id: "gross", label: "Gross" },
                    { id: "activity", label: "Activity" },
                  ] as { id: SortKey; label: string }[]
                ).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSortBy(s.id)}
                    style={{
                      padding: "4px 10px",
                      border: "none",
                      background: sortBy === s.id ? "#0d0e10" : "transparent",
                      color: sortBy === s.id ? "#fff" : "#6b6862",
                      fontFamily: "var(--font-archivo)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.8,
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 28px",
                padding: "10px 16px",
                borderBottom: "1px solid #e6e3da",
                background: "#f7f5ef",
                gap: 8,
              }}
            >
              {["Rep", "Pace", "Units", "Gross", "Last act.", ""].map((h) => (
                <div
                  key={h || "chev"}
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 9,
                    fontWeight: 700,
                    color: "#6b6862",
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                  }}
                >
                  {h}
                </div>
              ))}
            </div>
            {sorted.map((r) => {
              const isSel = r.id === selectedId;
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 28px",
                    padding: "12px 16px",
                    borderBottom: "1px solid #e6e3da",
                    gap: 8,
                    cursor: "pointer",
                    alignItems: "center",
                    background: isSel ? "#f7f5ef" : "transparent",
                    transition: "background .15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Avatar rep={r} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {r.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#6b6862", marginTop: 1 }}>
                        {r.daysSinceSale === 0 ? "Sold today" : `${r.daysSinceSale}d since sale`} · {r.streak}d streak
                      </div>
                    </div>
                  </div>
                  <div>
                    <PacePill status={r.pace.status} delta={r.pace.paceDelta} size="sm" />
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-archivo)",
                      fontSize: 14,
                      fontWeight: 800,
                      fontVariantNumeric: "tabular-nums",
                      letterSpacing: -0.3,
                    }}
                  >
                    {r.sold}
                    <span style={{ color: "#9a968d", fontWeight: 500 }}>/{r.goalUnits}</span>
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-archivo)",
                      fontSize: 13,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {fmtUSDk(r.gross)}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: r.lastActivity === "today" ? "#0d0e10" : "#d43f3a",
                      fontWeight: r.lastActivity === "today" ? 400 : 600,
                    }}
                  >
                    {r.lastActivity}
                  </div>
                  <div style={{ color: "#9a968d" }}>{Ic.chevR(14)}</div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          <DetailPanel
            selected={selected}
            onLogSale={async () => {
              // Optimistic local update (fires confetti + toast via store).
              addSale(selected.id, 2200, "used");
              // Persist to DB.
              try {
                await fetch("/api/sales", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ rep_id: selected.id, gross: 2200, kind: "used" }),
                });
              } catch {
                /* optimistic — ignore network failure in mock mode */
              }
            }}
          />
        </div>
      </div>

      <Confetti active={confetti} />
      <Toast toast={toast} />
    </div>
  );
}

function DetailPanel({
  selected,
  onLogSale,
}: {
  selected: Rep & { pace: ReturnType<typeof computePace> };
  onLogSale: () => void;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e6e3da",
        borderRadius: 14,
        padding: "16px 18px",
        alignSelf: "start",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          paddingBottom: 14,
          borderBottom: "1px solid #e6e3da",
        }}
      >
        <Avatar rep={selected} size={48} />
        <div style={{ flex: 1 }}>
          <div
            style={{ fontFamily: "var(--font-archivo)", fontSize: 16, fontWeight: 800, letterSpacing: -0.3 }}
          >
            {selected.name}
          </div>
          <div style={{ fontSize: 11, color: "#6b6862", marginTop: 1 }}>
            Last active {selected.lastActivity} · {selected.streak}d streak
          </div>
        </div>
        <PacePill status={selected.pace.status} delta={selected.pace.paceDelta} size="sm" />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <DetailStat label="Sold" value={`${selected.sold}`} sub={`of ${selected.goalUnits}`} />
        <DetailStat label="Gross" value={fmtUSDk(selected.gross)} sub={`of ${fmtUSDk(selected.goalGross)}`} />
        <DetailStat
          label="Close rate"
          value={`${Math.round(selected.pace.closeRate * 100)}%`}
          sub="MTD"
        />
        <DetailStat
          label="Days since sale"
          value={selected.daysSinceSale}
          sub={selected.daysSinceSale >= 3 ? "Cold" : "Warm"}
          accent={selected.daysSinceSale >= 3 ? "#d43f3a" : "#17a058"}
        />
      </div>

      <SectionHead style={{ marginBottom: 10 }}>Today&apos;s targets · required</SectionHead>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 8,
          marginBottom: 14,
        }}
      >
        {[
          {
            k: "outbound",
            v: selected.pace.daily.outbound,
            done: selected.activityToday.calls + selected.activityToday.texts,
            l: "OUTBOUND",
          },
          {
            k: "contacts",
            v: selected.pace.daily.contacts,
            done: Math.round((selected.activityToday.calls + selected.activityToday.texts) * 0.3),
            l: "CONTACTS",
          },
          { k: "set", v: selected.pace.daily.set, done: selected.activityToday.set, l: "SET" },
          { k: "shown", v: selected.pace.daily.shown, done: selected.activityToday.shown, l: "SHOWN" },
        ].map((t) => {
          const hit = t.done >= t.v;
          return (
            <div
              key={t.k}
              style={{
                padding: "10px 8px",
                borderRadius: 8,
                background: hit ? "#e5f5ec" : "#f7f5ef",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-archivo)",
                  fontSize: 9,
                  fontWeight: 700,
                  color: hit ? "#17a058" : "#6b6862",
                  letterSpacing: 1.2,
                }}
              >
                {t.l}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-archivo)",
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#0d0e10",
                  marginTop: 2,
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: -0.4,
                }}
              >
                {t.done}
                <span style={{ color: "#9a968d", fontWeight: 500, fontSize: 13 }}>/{t.v}</span>
              </div>
            </div>
          );
        })}
      </div>

      <SectionHead style={{ marginBottom: 8 }}>Coaching prompt</SectionHead>
      <div
        style={{
          padding: "12px 12px",
          background: "#f7f5ef",
          borderRadius: 10,
          fontSize: 12,
          lineHeight: 1.5,
          color: "#0d0e10",
        }}
      >
        {selected.pace.status === "behind" ? (
          <>
            <b>{selected.name.split(" ")[0]}</b> is{" "}
            <b style={{ color: "#d43f3a" }}>
              {Math.abs(selected.pace.paceDelta).toFixed(1)} units behind
            </b>
            . Back-solve says <b>{selected.pace.daily.outbound} outbound / day</b> to recover. Focus: unblock appointments set — ratio is the leakiest step.
          </>
        ) : selected.pace.status === "ahead" ? (
          <>
            <b>{selected.name.split(" ")[0]}</b> is{" "}
            <b style={{ color: "#17a058" }}>+{selected.pace.paceDelta.toFixed(1)}</b> ahead. Push for stretch goal — 1 extra unit at current gross = +{fmtUSDk(selected.gross / Math.max(1, selected.sold))}.
          </>
        ) : (
          <>
            <b>{selected.name.split(" ")[0]}</b> is <b>on pace</b>. Maintain activity floor; don&apos;t let the streak break.
          </>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button style={{ ...ghostBtn, flex: 1, justifyContent: "center" }}>Send text</button>
        <button onClick={onLogSale} style={{ ...primaryBtn, flex: 1, justifyContent: "center" }}>
          Log sale
        </button>
      </div>
    </div>
  );
}
