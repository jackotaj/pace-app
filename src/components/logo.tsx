// Pace brand: gauge mark + wordmark. Teal #02BFAB on transparent.
// All marks scale to given size (height). Mark only is ~square (1:1).

import type { CSSProperties } from "react";

export const PACE_TEAL = "#02BFAB";
export const PACE_TEAL_DARK = "#019A8A";

export function PaceMark({
  size = 24,
  color = PACE_TEAL,
  style,
  title = "Pace",
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
  title?: string;
}) {
  // Speedometer/gauge: outer arc open at bottom, needle from hub pointing NE,
  // hub dot at bottom-center. Matches the provided wordmark mark.
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth="6"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Gauge arc (open at bottom, ~260°) */}
      <path d="M 8 48 A 24 24 0 1 1 56 48" />
      {/* Needle from hub (32,48) to ~ top-right */}
      <line x1="32" y1="48" x2="50" y2="22" />
      {/* Hub */}
      <circle cx="32" cy="48" r="4" fill={color} stroke="none" />
    </svg>
  );
}

export function PaceLogo({
  height = 28,
  color = PACE_TEAL,
  style,
}: {
  height?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: height * 0.32,
        ...style,
      }}
    >
      <PaceMark size={height} color={color} />
      <span
        style={{
          fontFamily: "var(--font-archivo)",
          fontWeight: 800,
          fontSize: height * 0.88,
          color,
          letterSpacing: -height * 0.02,
          lineHeight: 1,
        }}
      >
        pace
      </span>
    </span>
  );
}
