// Deals tab — ported from rep-other.jsx

"use client";

import { useMemo } from "react";
import { useYourRep } from "@/lib/store";
import { fmtUSDk, MONTH } from "@/lib/pace";
import { Ic } from "@/components/primitives";

const VEHICLES = [
  { y: 2023, m: "Honda CR-V", kind: "used" as const, g: 2100 },
  { y: 2024, m: "Toyota RAV4", kind: "new" as const, g: 2850 },
  { y: 2022, m: "Ford F-150", kind: "used" as const, g: 3200 },
  { y: 2024, m: "Nissan Sentra", kind: "new" as const, g: 1800 },
  { y: 2021, m: "Jeep Wrangler", kind: "used" as const, g: 2400 },
  { y: 2023, m: "Chevy Equinox", kind: "used" as const, g: 1950 },
  { y: 2024, m: "Kia Sorento", kind: "new" as const, g: 2600 },
];

export function DealsTab() {
  const yourRep = useYourRep();
  const deals = useMemo(() => {
    const out: { y: number; m: string; kind: "new" | "used"; g: number; day: number; id: number }[] = [];
    for (let i = 0; i < yourRep.sold; i++) {
      const v = VEHICLES[i % VEHICLES.length];
      out.push({ ...v, day: MONTH.day - Math.floor(i * 2.4), id: i });
    }
    return out;
  }, [yourRep.sold]);

  return (
    <>
      <div style={{ paddingBottom: 14 }}>
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
          Your deals · {MONTH.label}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 48,
              fontWeight: 800,
              color: "#0d0e10",
              letterSpacing: -1.5,
              lineHeight: 0.9,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {yourRep.sold}
          </div>
          <div style={{ fontFamily: "var(--font-archivo)", fontSize: 14, color: "#6b6862", fontWeight: 600 }}>
            {yourRep.newSold} new · {yourRep.usedSold} used
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 18, background: "#ffffff", border: "1px solid #e6e3da", borderRadius: 14 }}>
        {deals.map((d, i) => (
          <div
            key={d.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderTop: i === 0 ? "none" : "1px solid #e6e3da",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                background: d.kind === "new" ? "#e5f5ec" : "#f7f5ef",
                color: d.kind === "new" ? "#17a058" : "#0d0e10",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {Ic.car(16)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 13, fontWeight: 600, color: "#0d0e10" }}>
                {d.y} {d.m}
              </div>
              <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 11, color: "#6b6862", marginTop: 1 }}>
                {d.kind === "new" ? "New" : "Pre-owned"} · Apr {d.day}
              </div>
            </div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 14,
                fontWeight: 800,
                color: "#17a058",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              +{fmtUSDk(d.g)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
