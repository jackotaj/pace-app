// Phone frame — wraps the rep experience in a 390x844 iPhone-style shell.
// Full-bleed on actual mobile (≤430px); framed on tablet/desktop.

"use client";

import { useState } from "react";
import { usePaceStore } from "@/lib/store";
import {
  Confetti,
  StatusBar,
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
    <div className="min-h-screen w-full flex items-center justify-center bg-cream py-0 md:py-10">
      <div
        className="relative bg-paper overflow-hidden shadow-none md:shadow-[0_30px_80px_rgba(13,14,16,0.18)] md:rounded-[40px] md:border-[10px] md:border-ink"
        style={{
          width: 390,
          maxWidth: "100%",
          height: "100dvh",
          maxHeight: 844,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <StatusBar />
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
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
        <TabBar tab={tab} onChange={setTab} />
        <LogActivitySheet open={logOpen} onClose={() => setLogOpen(false)} />
        <Confetti active={confetti} />
        <Toast toast={toast} />
      </div>
    </div>
  );
}
