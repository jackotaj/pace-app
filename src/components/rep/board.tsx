// Leaderboard tab — ported from rep-other.jsx

"use client";

import { useMemo, useState } from "react";
import { usePaceStore } from "@/lib/store";
import {
  computePace,
  fmtUSDk,
  MONTH,
  rankReps,
  type RankMetric,
} from "@/lib/pace";
import { Avatar } from "@/components/primitives";

export function LeaderboardTab() {
  const reps = usePaceStore((s) => s.reps);
  const [metric, setMetric] = useState<RankMetric>("sold");
  const sorted = useMemo(() => rankReps(reps, metric), [reps, metric]);

  return (
    <>
      <div style={{ padding: "4px 22px 12px" }}>
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
          Leaderboard · {MONTH.label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 26,
            fontWeight: 800,
            color: "#0d0e10",
            letterSpacing: -0.6,
            marginTop: 2,
          }}
        >
          The board.
        </div>
      </div>

      <div style={{ margin: "0 18px 16px", background: "#f7f5ef", padding: 4, borderRadius: 10, display: "flex" }}>
        {(
          [
            { id: "sold", label: "Units" },
            { id: "gross", label: "Gross" },
            { id: "close", label: "Close %" },
          ] as { id: RankMetric; label: string }[]
        ).map((m) => {
          const active = metric === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              style={{
                flex: 1,
                height: 34,
                border: "none",
                cursor: "pointer",
                background: active ? "#ffffff" : "transparent",
                color: active ? "#0d0e10" : "#6b6862",
                borderRadius: 8,
                fontFamily: "var(--font-archivo)",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: 0.6,
                boxShadow: active ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                transition: "all .18s",
              }}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Podium — top 3 */}
      <div style={{ margin: "0 18px 16px", display: "flex", gap: 8, alignItems: "flex-end" }}>
        {sorted.slice(0, 3).map((rep, i) => {
          const order = [1, 0, 2][i];
          const h = [80, 110, 68][i];
          const bg = i === 0 ? "#b8842a" : i === 1 ? "#8a8680" : "#b8621a";
          return (
            <div
              key={rep.id}
              style={{ flex: 1, order, display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              <Avatar rep={rep} size={44} />
              <div
                style={{
                  fontFamily: "var(--font-archivo)",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0d0e10",
                  marginTop: 8,
                  textAlign: "center",
                  letterSpacing: -0.1,
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {rep.name.split(" ")[0]}
              </div>
              <div
                style={{
                  width: "100%",
                  height: h,
                  marginTop: 6,
                  background: bg,
                  color: "#fff",
                  borderTopLeftRadius: 10,
                  borderTopRightRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingTop: 10,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontWeight: 800,
                    fontSize: 24,
                    lineHeight: 1,
                    letterSpacing: -0.8,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    opacity: 0.85,
                    marginTop: 2,
                  }}
                >
                  PLACE
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ margin: "0 18px 18px", background: "#ffffff", border: "1px solid #e6e3da", borderRadius: 14, overflow: "hidden" }}>
        {sorted.map((rep, i) => {
          const p = computePace(rep);
          const isYou = rep.isYou;
          const metricVal =
            metric === "sold"
              ? `${rep.sold} units`
              : metric === "gross"
                ? fmtUSDk(rep.gross)
                : `${Math.round(p.closeRate * 100)}%`;
          return (
            <div
              key={rep.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 14px",
                borderTop: i === 0 ? "none" : "1px solid #e6e3da",
                background: isYou ? "#f4ebd6" : "#ffffff",
                transition: "all .3s",
              }}
            >
              <div
                style={{
                  width: 22,
                  fontFamily: "var(--font-archivo)",
                  fontSize: 13,
                  fontWeight: 800,
                  color: i < 3 ? "#b8842a" : "#9a968d",
                  fontVariantNumeric: "tabular-nums",
                  textAlign: "center",
                }}
              >
                {i + 1}
              </div>
              <Avatar rep={rep} size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-inter-tight)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#0d0e10",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {rep.name}
                  {isYou && (
                    <span
                      style={{
                        background: "#b8842a",
                        color: "#fff",
                        fontFamily: "var(--font-archivo)",
                        fontSize: 8,
                        fontWeight: 700,
                        letterSpacing: 1,
                        padding: "2px 5px",
                        borderRadius: 3,
                      }}
                    >
                      YOU
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 11, color: "#6b6862", marginTop: 2 }}>
                  {rep.sold}/{rep.goalUnits} · {fmtUSDk(rep.gross)} · {rep.streak}d streak
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-archivo)",
                  fontSize: 15,
                  fontWeight: 800,
                  color: "#0d0e10",
                  fontVariantNumeric: "tabular-nums",
                  letterSpacing: -0.3,
                }}
              >
                {metricVal}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
