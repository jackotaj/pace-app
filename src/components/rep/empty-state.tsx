// Shown when the rep app loads with no roster (edge: manager created store but
// skipped roster, or deleted all reps). Phone-framed so it matches the rep UX.

import Link from "next/link";
import { StatusBar } from "@/components/primitives";
import { PaceMark } from "@/components/logo";

export function EmptyStorePhone({ storeName }: { storeName: string }) {
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
        <div
          style={{
            flex: 1,
            padding: "32px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 18,
          }}
        >
          <PaceMark size={56} />
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: -0.6,
              color: "#0d0e10",
              lineHeight: 1.1,
            }}
          >
            No reps yet.
          </div>
          <div
            style={{
              fontFamily: "var(--font-inter-tight)",
              fontSize: 14,
              color: "#6b6862",
              lineHeight: 1.5,
              maxWidth: 280,
            }}
          >
            <b style={{ color: "#0d0e10" }}>{storeName}</b> doesn&apos;t have any
            active reps. Paste your roster first.
          </div>
          <Link
            href="/app/manager/roster"
            style={{
              marginTop: 8,
              padding: "14px 24px",
              background: "#0d0e10",
              color: "#fff",
              borderRadius: 12,
              fontFamily: "var(--font-archivo)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Add reps →
          </Link>
        </div>
      </div>
    </div>
  );
}
