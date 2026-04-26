// Profile tab — ported from rep-other.jsx

"use client";

import { usePaceStore, useStoreCtx, useYourRep } from "@/lib/store";
import { Avatar, Ic, SectionHead } from "@/components/primitives";

const ALL_BADGES = [
  { id: "first-sale", label: "First Sale", icon: Ic.car, desc: "Got on the board" },
  { id: "three-deal", label: "3-Deal Day", icon: Ic.zap, desc: "Closed 3 in one day" },
  { id: "perfect-week", label: "Perfect Week", icon: Ic.check, desc: "Hit targets 5/5 days" },
  { id: "comeback", label: "Comeback Kid", icon: Ic.arrowU, desc: "Behind → ahead" },
  { id: "hot-streak", label: "Hot Streak 10+", icon: Ic.flame, desc: "10+ day streak" },
  { id: "top-gross", label: "Gross King", icon: Ic.trophy, desc: "#1 in gross" },
];

export function ProfileTab() {
  const yourRep = useYourRep();
  const reps = usePaceStore((s) => s.reps);
  const setYou = usePaceStore((s) => s.setYou);
  const ctx = useStoreCtx();
  // Demo switcher is strictly for the unauthed mock-data view. Once a real user
  // loaded a real store snapshot (ctx !== null), we hide it so reps can't
  // impersonate each other.
  const showDemoSwitcher = !ctx;
  if (!yourRep) return null;

  return (
    <>
      <div style={{ paddingBottom: 12, display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar rep={yourRep} size={56} />
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 20,
              fontWeight: 800,
              color: "#0d0e10",
              letterSpacing: -0.5,
            }}
          >
            {yourRep.name}
          </div>
          <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 12, color: "#6b6862", marginTop: 1 }}>
            Sales · Greenfield Auto · Member since Jan 2024
          </div>
        </div>
      </div>

      <div
        style={{
          marginBottom: 14,
          padding: "18px 18px",
          background: "#0d0e10",
          color: "#fff",
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div style={{ color: "#02BFAB" }}>{Ic.flame(34)}</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.4,
              color: "rgba(255,255,255,.5)",
              textTransform: "uppercase",
            }}
          >
            Activity streak
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 44,
                fontWeight: 800,
                letterSpacing: -1.2,
                lineHeight: 0.9,
              }}
            >
              {yourRep.streak}
            </span>
            <span style={{ fontFamily: "var(--font-archivo)", fontSize: 13, color: "rgba(255,255,255,.5)" }}>days</span>
          </div>
          <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 11, color: "rgba(255,255,255,.7)", marginTop: 4 }}>
            Don&apos;t break the chain.
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <SectionHead style={{ marginBottom: 10 }}>
          Badges · {yourRep.badges.length}/{ALL_BADGES.length}
        </SectionHead>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {ALL_BADGES.map((b) => {
            const earned = yourRep.badges.includes(b.id);
            return (
              <div
                key={b.id}
                style={{
                  background: earned ? "#d6f5f0" : "#f7f5ef",
                  border: `1px solid ${earned ? "#02BFAB40" : "#e6e3da"}`,
                  borderRadius: 12,
                  padding: "12px 10px",
                  textAlign: "center",
                  opacity: earned ? 1 : 0.5,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    margin: "0 auto 6px",
                    background: earned ? "#02BFAB" : "#d8d4c7",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {b.icon(16)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#0d0e10",
                    lineHeight: 1.2,
                    letterSpacing: 0.2,
                  }}
                >
                  {b.label}
                </div>
                <div style={{ fontFamily: "var(--font-inter-tight)", fontSize: 9, color: "#6b6862", marginTop: 2, lineHeight: 1.3 }}>
                  {b.desc}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demo rep switcher — only shown in unauthed demo mode. */}
      {showDemoSwitcher && (
      <div style={{ marginBottom: 18, padding: "14px 14px", background: "#f7f5ef", borderRadius: 12 }}>
        <SectionHead style={{ marginBottom: 10 }}>Demo · switch rep</SectionHead>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {reps.map((r) => (
            <button
              key={r.id}
              onClick={() => setYou(r.id)}
              style={{
                padding: "6px 10px",
                borderRadius: 8,
                border: `1px solid ${r.id === yourRep.id ? "#0d0e10" : "#d8d4c7"}`,
                background: r.id === yourRep.id ? "#0d0e10" : "#ffffff",
                color: r.id === yourRep.id ? "#fff" : "#0d0e10",
                fontFamily: "var(--font-archivo)",
                fontWeight: 600,
                fontSize: 11,
                cursor: "pointer",
              }}
            >
              {r.name.split(" ")[0]}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Sign out — always available for real users */}
      {!showDemoSwitcher && (
        <div style={{ marginBottom: 18 }} className="lg:max-w-[420px]">
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "transparent",
                color: "#6b6862",
                border: "1px solid #e6e3da",
                borderRadius: 10,
                fontFamily: "var(--font-archivo)",
                fontWeight: 600,
                fontSize: 12,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </>
  );
}
