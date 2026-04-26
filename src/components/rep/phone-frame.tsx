// Rep app shell — TRULY responsive.
// <640px  : single column, max-w-full, bottom tab bar (mobile-native)
// 640–1023: single column, max-w-[640px] centered (tablet-readable)
// ≥1024px : 220px left rail + max-w-[1180px] content. Bottom tab hidden.
//
// (No fake phone frame anywhere.)

"use client";

import { useState } from "react";
import { usePaceStore } from "@/lib/store";
import {
  Confetti,
  Ic,
  TabBar,
  Toast,
  type RepTab,
} from "@/components/primitives";
import { RepHomeScoreboard } from "./home";
import { LeaderboardTab } from "./board";
import { DealsTab } from "./deals";
import { ProfileTab } from "./profile";
import { LogActivitySheet } from "./log-sheet";

export function PhoneFrame() {
  const [tab, setTab] = useState<RepTab>("home");
  const [logOpen, setLogOpen] = useState(false);
  const toast = usePaceStore((s) => s.toast);
  const confetti = usePaceStore((s) => s.confetti);

  return (
    <div className="min-h-[calc(100dvh-56px)] w-full bg-paper relative">
      <div className="lg:flex lg:items-stretch w-full">
        {/* Left rail nav — visible only ≥lg */}
        <RepRailNav tab={tab} onChange={setTab} />

        {/* Main content */}
        <div
          className="flex-1 min-w-0 mx-auto w-full"
          style={{
            paddingBottom: 84, // bottom-tab clearance on mobile
          }}
        >
          <div className="mx-auto max-w-[1180px] w-full px-4 md:px-6 lg:px-10 py-4 md:py-6 lg:py-8">
            {tab === "home" && (
              <RepHomeScoreboard
                onLogActivity={() => setLogOpen(true)}
                onSwitchTab={setTab}
              />
            )}
            {tab === "board" && <LeaderboardTab />}
            {tab === "deals" && <DealsTab />}
            {tab === "me" && <ProfileTab />}
          </div>
        </div>
      </div>

      {/* Bottom tab bar — visible only <lg */}
      <div
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-line z-30"
      >
        <TabBar tab={tab} onChange={setTab} />
      </div>

      <LogActivitySheet open={logOpen} onClose={() => setLogOpen(false)} />
      <Confetti active={confetti} />
      <Toast toast={toast} />
    </div>
  );
}

function RepRailNav({
  tab,
  onChange,
}: {
  tab: RepTab;
  onChange: (t: RepTab) => void;
}) {
  const items: { id: RepTab; label: string; icon: (s?: number) => React.ReactNode }[] = [
    { id: "home", label: "Pace", icon: Ic.zap },
    { id: "board", label: "Leaderboard", icon: Ic.trophy },
    { id: "deals", label: "Deals", icon: Ic.car },
    { id: "me", label: "Profile", icon: Ic.flame },
  ];
  return (
    <nav
      className="hidden lg:flex flex-col flex-shrink-0"
      style={{
        width: 220,
        borderRight: "1px solid #e6e3da",
        background: "#ffffff",
        padding: "20px 16px",
        minHeight: "calc(100dvh - 56px)",
      }}
    >
      {items.map((item) => {
        const active = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 12px",
              borderRadius: 8,
              border: "none",
              background: active ? "#f7f5ef" : "transparent",
              color: active ? "#0d0e10" : "#6b6862",
              fontFamily: "var(--font-inter-tight)",
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 2,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span style={{ display: "inline-flex", color: active ? "#0d0e10" : "#9a968d" }}>
              {item.icon(16)}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
