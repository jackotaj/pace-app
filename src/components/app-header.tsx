// Shared header for /app/* — brand left, view-switch center, account menu right.
// Renders on every authenticated page so the user never feels lost between
// manager and rep views.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useStoreCtx } from "@/lib/store";
import { PaceMark } from "@/components/logo";

interface AppHeaderProps {
  // The user's identity (passed from server layout). When null, we don't render
  // the avatar menu (e.g., legacy password-cookie sessions or unauthed demo).
  userEmail?: string | null;
}

export function AppHeader({ userEmail }: AppHeaderProps) {
  const path = usePathname() ?? "";
  const ctx = useStoreCtx();
  const [menuOpen, setMenuOpen] = useState(false);

  // Active view inferred from path — we treat /app/manager* as manager view,
  // /app/rep as rep view, others (claim, onboard) as neither.
  const activeView: "manager" | "rep" | null = path.startsWith("/app/manager")
    ? "manager"
    : path === "/app/rep"
      ? "rep"
      : null;

  // canSwitch comes from the hydrated store ctx (server computed it from memberships).
  const canSwitch = ctx?.canSwitch ?? false;
  const effectiveEmail = userEmail ?? ctx?.userEmail ?? null;
  const initials = effectiveEmail
    ? effectiveEmail.split("@")[0].slice(0, 2).toUpperCase()
    : "··";

  return (
    <header
      className="sticky top-0 z-40 bg-paper border-b border-line"
      style={{ height: 56 }}
    >
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Brand */}
        <Link href={activeView === "manager" ? "/app/manager" : "/app/rep"} className="flex items-center gap-2 no-underline">
          <PaceMark size={26} />
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: -0.5,
              color: "#02BFAB",
              lineHeight: 1,
            }}
          >
            pace
          </div>
          {ctx?.storeName && (
            <span
              className="hidden md:inline ml-3 pl-3 border-l border-line text-mute"
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: 1,
                textTransform: "uppercase",
              }}
            >
              {ctx.storeName}
            </span>
          )}
        </Link>

        {/* View switcher — only when user can legitimately switch */}
        {canSwitch && activeView && (
          <div
            className="flex items-center gap-0 rounded-lg border border-line bg-cream"
            style={{ padding: 3 }}
          >
            <Link
              href="/app/manager"
              className="no-underline"
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: activeView === "manager" ? "#fff" : "transparent",
                color: activeView === "manager" ? "#0d0e10" : "#6b6862",
                boxShadow: activeView === "manager" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                fontFamily: "var(--font-archivo)",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                transition: "all .15s",
              }}
            >
              <span className="hidden sm:inline">Manager</span>
              <span className="sm:hidden">Mgr</span>
            </Link>
            <Link
              href="/app/rep"
              className="no-underline"
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                background: activeView === "rep" ? "#fff" : "transparent",
                color: activeView === "rep" ? "#0d0e10" : "#6b6862",
                boxShadow: activeView === "rep" ? "0 1px 3px rgba(0,0,0,.08)" : "none",
                fontFamily: "var(--font-archivo)",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                transition: "all .15s",
              }}
            >
              My pace
            </Link>
          </div>
        )}

        {/* Account menu */}
        {effectiveEmail ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "4px",
              }}
              aria-label="Account menu"
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: "#0d0e10",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-archivo)",
                  fontWeight: 700,
                  fontSize: 12,
                  letterSpacing: 0.3,
                }}
              >
                {initials}
              </div>
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="absolute right-0 mt-2 z-50 bg-paper border border-line rounded-xl shadow-lg"
                  style={{ width: 240, padding: 4 }}
                >
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #e6e3da" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#0d0e10" }}>
                      {effectiveEmail}
                    </div>
                    {ctx?.storeName && (
                      <div style={{ fontSize: 11, color: "#6b6862", marginTop: 2 }}>
                        {ctx.storeName}
                        {ctx.storeCity && ` · ${ctx.storeCity}, ${ctx.storeState ?? ""}`}
                      </div>
                    )}
                  </div>
                  <form action="/auth/signout" method="POST">
                    <button
                      type="submit"
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        background: "transparent",
                        border: "none",
                        textAlign: "left",
                        fontFamily: "var(--font-inter-tight)",
                        fontSize: 13,
                        color: "#0d0e10",
                        cursor: "pointer",
                        borderRadius: 8,
                      }}
                    >
                      Sign out
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        ) : (
          <div style={{ width: 32 }} />
        )}
      </div>
    </header>
  );
}
