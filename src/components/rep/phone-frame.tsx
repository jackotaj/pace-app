// Rep app shell. Mobile-first responsive: full-width on phones, centered column
// capped at a readable width on desktop. No fake iPhone frame.

"use client";

import { useState } from "react";
import { usePaceStore } from "@/lib/store";
import {
  Confetti,
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
    <div className="min-h-[100dvh] w-full bg-paper flex justify-center">
      <div
        className="relative bg-paper w-full max-w-[520px] flex flex-col"
        style={{ minHeight: "100dvh" }}
      >
        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          style={{ paddingTop: 16, paddingBottom: 84 }}
        >
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

        {/* Bottom nav — fixed to the container so it stays visible while scrolling */}
        <div
          className="sticky bottom-0 bg-paper border-t border-line"
          style={{
            position: "sticky",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <TabBar tab={tab} onChange={setTab} />
        </div>

        <LogActivitySheet open={logOpen} onClose={() => setLogOpen(false)} />
        <Confetti active={confetti} />
        <Toast toast={toast} />
      </div>
    </div>
  );
}
