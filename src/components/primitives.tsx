// UI primitives — ported verbatim from design_files/components.jsx.
// Values copied exactly per DESIGN_SPEC §3 ("copy values verbatim").

"use client";

import type { ReactNode, CSSProperties } from "react";
import type { Rep } from "@/lib/pace";

// ── PacePill ─────────────────────────────────────────────────
type PaceStatus = "ahead" | "onpace" | "behind";
const PACE_CFG: Record<PaceStatus, { bg: string; fg: string; label: string }> = {
  ahead: { bg: "#e5f5ec", fg: "#17a058", label: "AHEAD" },
  onpace: { bg: "#faefdc", fg: "#d88a1a", label: "ON PACE" },
  behind: { bg: "#fbe9e7", fg: "#d43f3a", label: "BEHIND" },
};
const PILL_SIZES = {
  sm: { font: 10, pad: "3px 7px", gap: 5 },
  md: { font: 11, pad: "5px 10px", gap: 6 },
  lg: { font: 13, pad: "7px 14px", gap: 8 },
} as const;

export function PacePill({
  status,
  delta,
  size = "md",
  style,
}: {
  status: PaceStatus;
  delta?: number;
  size?: keyof typeof PILL_SIZES;
  style?: CSSProperties;
}) {
  const cfg = PACE_CFG[status];
  const s = PILL_SIZES[size];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        background: cfg.bg,
        color: cfg.fg,
        fontFamily: "var(--font-archivo)",
        fontWeight: 700,
        fontSize: s.font,
        letterSpacing: 0.8,
        padding: s.pad,
        borderRadius: 4,
        lineHeight: 1,
        ...style,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: cfg.fg,
          flexShrink: 0,
        }}
      />
      {cfg.label}
      {delta !== undefined && (
        <span style={{ fontVariantNumeric: "tabular-nums", opacity: 0.9 }}>
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}
        </span>
      )}
    </span>
  );
}

// ── ProgressBar ──────────────────────────────────────────────
export function ProgressBar({
  value,
  max = 100,
  height = 8,
  color = "#0d0e10",
  bg = "#e6e3da",
  style,
  label,
}: {
  value: number;
  max?: number;
  height?: number;
  color?: string;
  bg?: string;
  style?: CSSProperties;
  label?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={style}>
      <div
        style={{
          position: "relative",
          height,
          background: bg,
          borderRadius: height / 2,
          overflow: "hidden",
        }}
      >
        <div
          className="bar-fill"
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            background: color,
            borderRadius: height / 2,
          }}
        />
      </div>
      {label && (
        <div
          style={{
            fontFamily: "var(--font-inter-tight)",
            fontSize: 11,
            color: "#6b6862",
            marginTop: 6,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ── Stat ─────────────────────────────────────────────────────
export function Stat({
  n,
  label,
  color = "#0d0e10",
  sub,
  align = "left",
  size = 56,
}: {
  n: ReactNode;
  label: ReactNode;
  color?: string;
  sub?: ReactNode;
  align?: "left" | "center" | "right";
  size?: number;
}) {
  return (
    <div style={{ textAlign: align }}>
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: size,
          lineHeight: 0.95,
          color,
          letterSpacing: -1.5,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontFamily: "var(--font-archivo)",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: 1.5,
          color: "#6b6862",
          marginTop: 6,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-inter-tight)",
            fontSize: 12,
            color: "#9a968d",
            marginTop: 3,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Stepper ──────────────────────────────────────────────────
const stepperBtn: CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 9,
  border: "1px solid #d8d4c7",
  background: "#ffffff",
  color: "#0d0e10",
  fontSize: 20,
  fontWeight: 500,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
};
const stepperBtnPlus: CSSProperties = {
  ...stepperBtn,
  background: "#0d0e10",
  color: "#ffffff",
  border: "none",
};

export function Stepper({
  value,
  onChange,
  label,
  icon,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  label: ReactNode;
  icon: ReactNode;
  min?: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 14px",
        background: "#f7f5ef",
        borderRadius: 10,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 1.2,
            color: "#6b6862",
            textTransform: "uppercase",
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 28,
            fontWeight: 800,
            color: "#0d0e10",
            lineHeight: 1,
            fontVariantNumeric: "tabular-nums",
            marginTop: 2,
          }}
        >
          {value}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={stepperBtn}
          aria-label="decrease"
        >
          −
        </button>
        <button
          onClick={() => onChange(value + 1)}
          style={stepperBtnPlus}
          aria-label="increase"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ── Avatar ───────────────────────────────────────────────────
export function Avatar({ rep, size = 32 }: { rep: Pick<Rep, "color" | "short">; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: rep.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-archivo)",
        fontWeight: 700,
        fontSize: size * 0.38,
        letterSpacing: 0.3,
        flexShrink: 0,
      }}
    >
      {rep.short.slice(0, 2)}
    </div>
  );
}

// ── Confetti ─────────────────────────────────────────────────
export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;
  const colors = ["#17a058", "#02BFAB", "#d43f3a", "#0d0e10", "#6b4fb8"];
  const pieces = Array.from({ length: 80 }, (_, i) => {
    const left = Math.random() * 100;
    const delay = Math.random() * 0.6;
    const duration = 1.6 + Math.random() * 1.2;
    const rotate = (Math.random() - 0.5) * 720;
    const color = colors[i % colors.length];
    const size = 6 + Math.random() * 6;
    return { left, delay, duration, rotate, color, size, i };
  });
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      <style>{`
        @keyframes pace-confetti-fall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(140%) rotate(var(--r, 360deg)); opacity: 1; }
        }
      `}</style>
      {pieces.map((p) => (
        <div
          key={p.i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            background: p.color,
            animation: `pace-confetti-fall ${p.duration}s ${p.delay}s cubic-bezier(.3,.8,.5,1) forwards`,
            ["--r" as string]: `${p.rotate}deg`,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────
export function Toast({ toast }: { toast: { kind: string; msg: string } | null }) {
  if (!toast) return null;
  const bg = toast.kind === "sale" ? "#17a058" : "#0d0e10";
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        background: bg,
        color: "#fff",
        padding: "10px 18px",
        borderRadius: 999,
        fontFamily: "var(--font-archivo)",
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: 0.3,
        boxShadow: "0 8px 24px rgba(0,0,0,.18)",
        zIndex: 200,
        whiteSpace: "nowrap",
      }}
    >
      {toast.msg}
    </div>
  );
}

// ── SectionHead ──────────────────────────────────────────────
export function SectionHead({
  children,
  right,
  style,
}: {
  children: ReactNode;
  right?: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontFamily: "var(--font-archivo)",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: 1.8,
        color: "#6b6862",
        textTransform: "uppercase",
        ...style,
      }}
    >
      <span>{children}</span>
      {right}
    </div>
  );
}

// ── Icons (monoline inline SVG, ported verbatim) ─────────────
type IconFn = (s?: number) => ReactNode;
export const Ic: Record<string, IconFn> = {
  phone: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 2.5h2l1 3L6 6.75c.55 1.3 1.45 2.2 2.75 2.75L10 8.25l3 1v2a1 1 0 0 1-1 1.1 11 11 0 0 1-9.6-9.6 1 1 0 0 1 1.1-1Z" />
    </svg>
  ),
  msg: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 3.5h11v8H6l-3 2.5v-2.5H2.5z" />
    </svg>
  ),
  cal: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
      <path d="M2.5 6.5h11M5 2v3M11 2v3" />
    </svg>
  ),
  shake: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 8l3-3 2 2-3 3zM9 4l3 3-3 3-2-2zM6 7l3 3" />
    </svg>
  ),
  car: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 10.5v-2l1.5-3h8l1.5 3v2M2.5 10.5h11v2h-2v-1h-7v1h-2zM5 8.5h6" />
    </svg>
  ),
  flame: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 1s.5 2-1 4-3 2.5-3 5.5A4 4 0 0 0 8 14.5 4 4 0 0 0 12 10.5c0-2-1-3-2-4 .5 1.5-.5 2-1.5 2 .5-1.5 0-3-.5-7.5z" />
    </svg>
  ),
  trophy: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2.5h6v3a3 3 0 0 1-6 0zM3 3.5h2v2a2 2 0 0 1-2-2zM13 3.5h-2v2a2 2 0 0 0 2-2zM6.5 10v1.5M9.5 10v1.5M4.5 13.5h7" />
    </svg>
  ),
  zap: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <path d="M9 1L3 9h4l-1 6 6-8H8l1-6z" />
    </svg>
  ),
  chevR: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3l5 5-5 5" />
    </svg>
  ),
  chevD: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6l5 5 5-5" />
    </svg>
  ),
  close: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  check: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l3 3 7-7" />
    </svg>
  ),
  arrowU: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 13V3M4 7l4-4 4 4" />
    </svg>
  ),
  arrowD: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v10M4 9l4 4 4-4" />
    </svg>
  ),
  dot: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor">
      <circle cx="8" cy="8" r="3" />
    </svg>
  ),
};

// ── StatusBar (iOS-style, prototype chrome; strip in production) ──
export function StatusBar({ time = "9:41", dark = false }: { time?: string; dark?: boolean }) {
  const fg = dark ? "#fff" : "#0d0e10";
  return (
    <div
      style={{
        height: 44,
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        color: fg,
        fontFamily: "var(--font-archivo)",
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span>{time}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
          <rect x="0" y="6" width="3" height="4" rx="0.5" />
          <rect x="4" y="4" width="3" height="6" rx="0.5" />
          <rect x="8" y="2" width="3" height="8" rx="0.5" />
          <rect x="12" y="0" width="3" height="10" rx="0.5" />
        </svg>
        <svg width="24" height="11" viewBox="0 0 24 11" fill="none" stroke="currentColor" strokeWidth="1">
          <rect x="0.5" y="0.5" width="20" height="10" rx="2.5" />
          <rect x="2" y="2" width="16" height="7" rx="1" fill="currentColor" />
          <rect x="21.5" y="3.5" width="1.5" height="4" rx="0.7" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

// ── TabBar ───────────────────────────────────────────────────
export type RepTab = "home" | "board" | "deals" | "me";
export function TabBar({
  tab,
  onChange,
}: {
  tab: RepTab;
  onChange: (t: RepTab) => void;
}) {
  const tabs: { id: RepTab; label: string; icon: IconFn }[] = [
    { id: "home", label: "Pace", icon: Ic.zap },
    { id: "board", label: "Board", icon: Ic.trophy },
    { id: "deals", label: "Deals", icon: Ic.car },
    { id: "me", label: "Profile", icon: Ic.flame },
  ];
  return (
    <div
      style={{
        height: 68,
        borderTop: "1px solid #e6e3da",
        background: "#ffffff",
        display: "flex",
        paddingBottom: 8,
      }}
    >
      {tabs.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              color: active ? "#0d0e10" : "#9a968d",
              fontFamily: "var(--font-archivo)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              paddingTop: 10,
            }}
          >
            <div style={{ transform: active ? "scale(1.05)" : "scale(1)" }}>{t.icon(22)}</div>
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
