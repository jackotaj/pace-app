// Rep home screens — 3 variants (Scoreboard / Funnel / Card Stack)
// Ported verbatim from design_files/rep-home.jsx

"use client";

import { usePaceStore, useStoreCtx, useYourRep } from "@/lib/store";
import {
  buildMonth,
  computePace,
  fmtUSDk,
  rankReps,
  type Rep,
  type ActivityToday,
} from "@/lib/pace";
import {
  Avatar,
  Ic,
  PacePill,
  ProgressBar,
  SectionHead,
} from "@/components/primitives";
import type { RepTab } from "@/components/primitives";

function RepHeader({ rep, month }: { rep: Rep; month: { label: string; day: number; daysTotal: number } }) {
  return (
    <div
      style={{
        padding: "4px 22px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
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
          {month.label} · Day {month.day} of {month.daysTotal}
        </div>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 22,
            fontWeight: 800,
            color: "#0d0e10",
            letterSpacing: -0.6,
            marginTop: 2,
          }}
        >
          Hey, {rep.name.split(" ")[0]}.
        </div>
      </div>
      <Avatar rep={rep} size={40} />
    </div>
  );
}

function FunnelSteps({
  daily,
  actual,
}: {
  daily: { outbound: number; contacts: number; set: number; shown: number };
  actual: ActivityToday;
}) {
  const steps = [
    { key: "outbound", label: "Outbound", need: daily.outbound, done: actual.calls + actual.texts, icon: Ic.phone },
    { key: "contacts", label: "Contacts", need: daily.contacts, done: Math.round((actual.calls + actual.texts) * 0.3), icon: Ic.msg },
    { key: "set", label: "Appts set", need: daily.set, done: actual.set, icon: Ic.cal },
    { key: "shown", label: "Appts shown", need: daily.shown, done: actual.shown, icon: Ic.shake },
    { key: "sold", label: "Sold", need: 1, done: 0, icon: Ic.car },
  ];
  return (
    <>
      {steps.map((s, i) => {
        const pct = Math.min(100, (s.done / Math.max(1, s.need)) * 100);
        const hit = s.done >= s.need;
        const last = i === steps.length - 1;
        return (
          <div key={s.key} style={{ position: "relative", paddingBottom: last ? 8 : 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: hit ? "#17a058" : "#f7f5ef",
                  color: hit ? "#fff" : "#0d0e10",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {hit ? Ic.check(14) : s.icon(14)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                  <span style={{ fontFamily: "var(--font-inter-tight)", fontSize: 13, fontWeight: 600, color: "#0d0e10" }}>{s.label}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-archivo)",
                      fontSize: 13,
                      fontWeight: 700,
                      fontVariantNumeric: "tabular-nums",
                      color: hit ? "#17a058" : "#0d0e10",
                    }}
                  >
                    {s.done}
                    <span style={{ color: "#9a968d", fontWeight: 500 }}>/{s.need}</span>
                  </span>
                </div>
                <div style={{ height: 3, background: "#e6e3da", borderRadius: 2, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      background: hit ? "#17a058" : "#0d0e10",
                      transition: "width .4s",
                    }}
                  />
                </div>
              </div>
            </div>
            {!last && (
              <div style={{ position: "absolute", left: 13, top: 30, bottom: 0, width: 2, background: "#e6e3da" }} />
            )}
          </div>
        );
      })}
    </>
  );
}

function StreakChip({ streak }: { streak: number }) {
  return (
    <div
      style={{
        flex: 1,
        background: "#d6f5f0",
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ color: "#019A8A" }}>{Ic.flame(18)}</div>
      <div>
        <div style={{ fontFamily: "var(--font-archivo)", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: "#019A8A", textTransform: "uppercase" }}>
          Streak
        </div>
        <div style={{ fontFamily: "var(--font-archivo)", fontSize: 16, fontWeight: 800, color: "#0d0e10", lineHeight: 1, marginTop: 2 }}>
          {streak} days
        </div>
      </div>
    </div>
  );
}

function RankChip({ onClick }: { onClick?: () => void }) {
  const reps = usePaceStore((s) => s.reps);
  const sorted = rankReps(reps, "sold");
  const idx = sorted.findIndex((r) => r.isYou) + 1;
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        background: "#f7f5ef",
        borderRadius: 12,
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ color: "#0d0e10" }}>{Ic.trophy(18)}</div>
      <div>
        <div style={{ fontFamily: "var(--font-archivo)", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: "#6b6862", textTransform: "uppercase" }}>
          Rank
        </div>
        <div style={{ fontFamily: "var(--font-archivo)", fontSize: 16, fontWeight: 800, color: "#0d0e10", lineHeight: 1, marginTop: 2 }}>
          #{idx} of {reps.length}
        </div>
      </div>
    </button>
  );
}

// ── VARIANT A — Scoreboard (primary) ──────────────────────────
export function RepHomeScoreboard({
  onLogActivity,
  onSwitchTab,
}: {
  onLogActivity: () => void;
  onSwitchTab?: (t: RepTab) => void;
}) {
  const yourRep = useYourRep();
  const ctx = useStoreCtx();
  const addSale = usePaceStore((s) => s.addSale);
  if (!yourRep) return null;
  const month = buildMonth(new Date(), ctx?.storeTimezone);
  const p = computePace(yourRep, month);
  const a = yourRep.activityToday;
  const isDemo = !ctx; // when server provides no ctx, we're in the unauthed demo mode

  return (
    <>
      <RepHeader rep={yourRep} month={month} />

      {/* HERO — dark pace card */}
      <div
        style={{
          margin: "0 18px",
          background: "#0d0e10",
          borderRadius: 20,
          padding: "22px 22px 20px",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{ fontFamily: "var(--font-archivo)", fontSize: 10, fontWeight: 700, letterSpacing: 1.8, color: "rgba(255,255,255,.5)" }}>
            PACE
          </span>
          <PacePill status={p.status} delta={p.paceDelta} size="sm" />
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
          <span
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 90,
              fontWeight: 800,
              lineHeight: 0.88,
              letterSpacing: -3,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {yourRep.sold}
          </span>
          <span
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 34,
              fontWeight: 500,
              color: "rgba(255,255,255,.4)",
              letterSpacing: -1,
            }}
          >
            /{yourRep.goalUnits}
          </span>
        </div>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 1.4,
            color: "rgba(255,255,255,.6)",
            textTransform: "uppercase",
            marginBottom: 18,
          }}
        >
          Units sold · {p.unitsToGo} to go
        </div>

        <ProgressBar value={yourRep.sold} max={yourRep.goalUnits} height={6} color="#fff" bg="rgba(255,255,255,.15)" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 18,
            paddingTop: 16,
            borderTop: "1px solid rgba(255,255,255,.12)",
          }}
        >
          <div>
            <div style={{ fontFamily: "var(--font-archivo)", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: "rgba(255,255,255,.5)" }}>
              GROSS
            </div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: -0.6,
                fontVariantNumeric: "tabular-nums",
                marginTop: 2,
              }}
            >
              {fmtUSDk(yourRep.gross)}{" "}
              <span style={{ color: "rgba(255,255,255,.4)", fontSize: 16, fontWeight: 500 }}>/ {fmtUSDk(yourRep.goalGross)}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-archivo)", fontSize: 10, fontWeight: 700, letterSpacing: 1.4, color: "rgba(255,255,255,.5)" }}>
              DAYS LEFT
            </div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: -0.6,
                fontVariantNumeric: "tabular-nums",
                marginTop: 2,
              }}
            >
              {p.daysLeft}
            </div>
          </div>
        </div>
      </div>

      {/* TODAY YOU NEED — funnel */}
      <div
        style={{
          margin: "18px 18px 0",
          background: "#ffffff",
          border: "1px solid #e6e3da",
          borderRadius: 20,
          padding: "18px 18px 10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <SectionHead>Today you need</SectionHead>
          <span
            style={{
              fontFamily: "var(--font-jetbrains)",
              fontSize: 10,
              color: "#9a968d",
              letterSpacing: -0.2,
            }}
          >
            back-solved · {month.daysRemaining}d left
          </span>
        </div>
        <FunnelSteps daily={p.daily} actual={a} />
      </div>

      <button
        onClick={onLogActivity}
        style={{
          margin: "16px 18px 0",
          width: "calc(100% - 36px)",
          height: 56,
          background: "#0d0e10",
          color: "#fff",
          border: "none",
          borderRadius: 16,
          fontFamily: "var(--font-archivo)",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {Ic.zap(16)} Log activity
      </button>

      <div style={{ display: "flex", gap: 10, margin: "12px 18px 24px" }}>
        <StreakChip streak={yourRep.streak} />
        <RankChip onClick={() => onSwitchTab?.("board")} />
      </div>

      {/* Demo trigger — only in unauthed demo mode (no real store ctx present). */}
      {isDemo && (
      <button
        onClick={() => addSale(yourRep.id, 2400, "used")}
        style={{
          margin: "0 18px 24px",
          width: "calc(100% - 36px)",
          height: 42,
          background: "transparent",
          color: "#6b6862",
          border: "1px dashed #d8d4c7",
          borderRadius: 12,
          fontFamily: "var(--font-archivo)",
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Demo: log a sale
      </button>
      )}
    </>
  );
}

// ── VARIANT B — Funnel-first ─────────────────────────────────
function FunnelViz({
  daily,
  actual,
}: {
  daily: { outbound: number; contacts: number; set: number; shown: number };
  actual: ActivityToday;
}) {
  const total = daily.outbound;
  const rows = [
    { label: "OUTBOUND", need: daily.outbound, done: actual.calls + actual.texts, color: "#0d0e10" },
    { label: "CONTACTS", need: daily.contacts, done: Math.round((actual.calls + actual.texts) * 0.3), color: "#0d0e10" },
    { label: "APPTS SET", need: daily.set, done: actual.set, color: "#0d0e10" },
    { label: "APPTS SHOWN", need: daily.shown, done: actual.shown, color: "#0d0e10" },
    { label: "SOLD", need: 1, done: 0, color: "#17a058" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {rows.map((r) => {
        const w = Math.max(18, (r.need / total) * 100);
        const donePct = Math.min(100, (r.done / Math.max(1, r.need)) * 100);
        return (
          <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 72,
                fontFamily: "var(--font-archivo)",
                fontSize: 9,
                fontWeight: 700,
                color: "#6b6862",
                letterSpacing: 1.2,
              }}
            >
              {r.label}
            </div>
            <div style={{ flex: 1, position: "relative" }}>
              <div
                style={{
                  width: `${w}%`,
                  height: 28,
                  background: "#f7f5ef",
                  borderRadius: 6,
                  position: "relative",
                  overflow: "hidden",
                  border: "1px solid #e6e3da",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${donePct}%`,
                    background: r.color,
                    opacity: 0.9,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    padding: "0 10px",
                    fontFamily: "var(--font-archivo)",
                    fontWeight: 800,
                    fontSize: 13,
                    color: donePct > 40 ? "#fff" : "#0d0e10",
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: -0.3,
                  }}
                >
                  {r.done}
                  <span style={{ opacity: 0.55, fontWeight: 500 }}>/{r.need}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function RepHomeFunnel({
  onLogActivity,
  onSwitchTab,
}: {
  onLogActivity: () => void;
  onSwitchTab?: (t: RepTab) => void;
}) {
  const yourRep = useYourRep();
  const ctx = useStoreCtx();
  if (!yourRep) return null;
  const month = buildMonth(new Date(), ctx?.storeTimezone);
  const p = computePace(yourRep, month);
  const a = yourRep.activityToday;

  return (
    <>
      <RepHeader rep={yourRep} month={month} />

      <div
        style={{
          margin: "0 18px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          background: "#fbe9e7",
          borderRadius: 12,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: 4, background: "#d43f3a" }} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 13,
              fontWeight: 700,
              color: "#d43f3a",
              letterSpacing: -0.2,
            }}
          >
            Behind by {Math.abs(p.paceDelta).toFixed(1)} units
          </div>
          <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 11, color: "#6b6862", marginTop: 1 }}>
            {yourRep.sold} sold · {p.unitsToGo} to go · {p.daysLeft} days
          </div>
        </div>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 11,
            fontWeight: 700,
            color: "#d43f3a",
            letterSpacing: 1.2,
          }}
        >
          {p.goalPct}%
        </div>
      </div>

      <div
        style={{
          margin: "0 18px",
          background: "#ffffff",
          border: "1px solid #e6e3da",
          borderRadius: 20,
          padding: "20px 18px 16px",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
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
              The math, back-solved
            </div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 20,
                fontWeight: 800,
                color: "#0d0e10",
                letterSpacing: -0.6,
                marginTop: 3,
              }}
            >
              Your day, one unit.
            </div>
          </div>
        </div>
        <FunnelViz daily={p.daily} actual={a} />
      </div>

      <div style={{ margin: "14px 18px 0", background: "#f7f5ef", borderRadius: 16, padding: "12px 14px" }}>
        <div
          style={{
            fontFamily: "var(--font-jetbrains)",
            fontSize: 11,
            color: "#6b6862",
            lineHeight: 1.6,
          }}
        >
          <div>{p.daily.outbound} outbound → {p.daily.contacts} contacts</div>
          <div>{p.daily.contacts} contacts → {p.daily.set} appts set</div>
          <div>{p.daily.set} set → {p.daily.shown} appts shown</div>
          <div style={{ color: "#0d0e10", fontWeight: 700 }}>
            {p.daily.shown} shown → <span style={{ color: "#17a058" }}>1 sale</span>
          </div>
        </div>
      </div>

      <button
        onClick={onLogActivity}
        style={{
          margin: "16px 18px 0",
          width: "calc(100% - 36px)",
          height: 56,
          background: "#0d0e10",
          color: "#fff",
          border: "none",
          borderRadius: 16,
          fontFamily: "var(--font-archivo)",
          fontWeight: 700,
          fontSize: 15,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        {Ic.zap(16)} Log activity
      </button>

      <div style={{ display: "flex", gap: 10, margin: "12px 18px 24px" }}>
        <StreakChip streak={yourRep.streak} />
        <RankChip onClick={() => onSwitchTab?.("board")} />
      </div>
    </>
  );
}

// ── VARIANT C — Card Stack ───────────────────────────────────
function ChecklistRow({
  icon,
  label,
  need,
  done,
  last,
}: {
  icon: (s?: number) => React.ReactNode;
  label: string;
  need: number;
  done: number;
  last?: boolean;
}) {
  const pct = Math.min(100, (done / Math.max(1, need)) * 100);
  const hit = done >= need;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
        borderBottom: last ? "none" : "1px solid #e6e3da",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          flexShrink: 0,
          background: hit ? "#17a058" : "#f7f5ef",
          color: hit ? "#fff" : "#0d0e10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {hit ? Ic.check(15) : icon(15)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontFamily: "var(--font-inter-tight)", fontSize: 13, fontWeight: 600, color: "#0d0e10" }}>{label}</span>
          <span
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 13,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              color: hit ? "#17a058" : "#0d0e10",
            }}
          >
            {done}
            <span style={{ color: "#9a968d", fontWeight: 500 }}>/{need}</span>
          </span>
        </div>
        <div style={{ height: 3, background: "#e6e3da", borderRadius: 2 }}>
          <div
            style={{
              height: "100%",
              width: `${pct}%`,
              background: hit ? "#17a058" : "#0d0e10",
              borderRadius: 2,
              transition: "width .4s",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function RepHomeCardStack({
  onLogActivity,
  onSwitchTab,
}: {
  onLogActivity: () => void;
  onSwitchTab?: (t: RepTab) => void;
}) {
  const yourRep = useYourRep();
  const ctx = useStoreCtx();
  if (!yourRep) return null;
  const month = buildMonth(new Date(), ctx?.storeTimezone);
  const p = computePace(yourRep, month);
  const a = yourRep.activityToday;

  return (
    <>
      <RepHeader rep={yourRep} month={month} />

      <div style={{ padding: "0 18px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div style={{ background: "#0d0e10", color: "#fff", borderRadius: 16, padding: "16px 16px 14px" }}>
          <div style={{ fontFamily: "var(--font-archivo)", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: "rgba(255,255,255,.5)" }}>UNITS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <span style={{ fontFamily: "var(--font-archivo)", fontSize: 52, fontWeight: 800, lineHeight: 0.9, letterSpacing: -1.8, fontVariantNumeric: "tabular-nums" }}>
              {yourRep.sold}
            </span>
            <span style={{ fontFamily: "var(--font-archivo)", fontSize: 20, color: "rgba(255,255,255,.35)", fontWeight: 500 }}>/{yourRep.goalUnits}</span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,.15)", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
            <div style={{ width: `${p.goalPct}%`, height: "100%", background: "#fff" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-archivo)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,.6)", letterSpacing: 0.5 }}>
            <span>{p.goalPct}%</span>
            <span>{p.unitsToGo} to go</span>
          </div>
        </div>
        <div style={{ background: "#f7f5ef", borderRadius: 16, padding: "16px 16px 14px" }}>
          <div style={{ fontFamily: "var(--font-archivo)", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: "#6b6862" }}>GROSS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
            <span style={{ fontFamily: "var(--font-archivo)", fontSize: 34, fontWeight: 800, lineHeight: 0.9, letterSpacing: -1.2, color: "#0d0e10" }}>
              {fmtUSDk(yourRep.gross)}
            </span>
          </div>
          <div style={{ fontFamily: "var(--font-archivo)", fontSize: 11, color: "#6b6862", marginTop: 2 }}>of {fmtUSDk(yourRep.goalGross)}</div>
          <div style={{ height: 4, background: "#e6e3da", borderRadius: 2, marginTop: 12, overflow: "hidden" }}>
            <div style={{ width: `${p.grossPct}%`, height: "100%", background: "#0d0e10" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-archivo)", fontSize: 10, fontWeight: 600, color: "#6b6862", letterSpacing: 0.5 }}>
            <span>{p.grossPct}%</span>
            <span>{fmtUSDk(p.grossToGo)} to go</span>
          </div>
        </div>
      </div>

      <div style={{ margin: "12px 18px 0", padding: "14px 16px", background: "#fbe9e7", borderRadius: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 12,
            background: "#d43f3a",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-archivo)",
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: -1,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          −{Math.abs(p.paceDelta).toFixed(1)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "var(--font-archivo)", fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: "#d43f3a", textTransform: "uppercase" }}>
            Pace
          </div>
          <div style={{ fontFamily: "var(--font-archivo)", fontSize: 16, fontWeight: 800, color: "#0d0e10", letterSpacing: -0.3, marginTop: 2 }}>
            Behind by {Math.abs(p.paceDelta).toFixed(1)} units
          </div>
          <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 11, color: "#6b6862", marginTop: 2 }}>
            Need +{p.dailyUnitsNeeded.toFixed(2)}/day · {p.daysLeft} days left
          </div>
        </div>
      </div>

      <div style={{ margin: "12px 18px 0", background: "#ffffff", border: "1px solid #e6e3da", borderRadius: 16, padding: "14px 16px" }}>
        <SectionHead style={{ marginBottom: 10 }}>Today · do these</SectionHead>
        <ChecklistRow icon={Ic.phone} label="Outbound attempts" need={p.daily.outbound} done={a.calls + a.texts} />
        <ChecklistRow icon={Ic.msg} label="Live contacts" need={p.daily.contacts} done={Math.round((a.calls + a.texts) * 0.3)} />
        <ChecklistRow icon={Ic.cal} label="Appointments set" need={p.daily.set} done={a.set} />
        <ChecklistRow icon={Ic.shake} label="Appointments shown" need={p.daily.shown} done={a.shown} last />
      </div>

      <button
        onClick={onLogActivity}
        style={{
          margin: "12px 18px 0",
          width: "calc(100% - 36px)",
          height: 52,
          background: "#0d0e10",
          color: "#fff",
          border: "none",
          borderRadius: 14,
          fontFamily: "var(--font-archivo)",
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: 1.2,
          textTransform: "uppercase",
          cursor: "pointer",
        }}
      >
        Log activity
      </button>

      <div style={{ display: "flex", gap: 10, margin: "10px 18px 24px" }}>
        <StreakChip streak={yourRep.streak} />
        <RankChip onClick={() => onSwitchTab?.("board")} />
      </div>
    </>
  );
}
