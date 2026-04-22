"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Ic } from "@/components/primitives";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app/rep";

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Wrong password");
      }
      router.push(next);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Wrong password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-inter-tight)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "#ffffff",
          border: "1px solid #e6e3da",
          borderRadius: 16,
          padding: "36px 32px",
        }}
      >
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 28,
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: "#0d0e10",
              color: "#fff",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {Ic.zap(16)}
          </div>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 18,
              color: "#0d0e10",
              letterSpacing: -0.4,
            }}
          >
            Pace
          </div>
        </Link>
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: -0.6,
            color: "#0d0e10",
          }}
        >
          Sign in.
        </div>
        <div style={{ fontSize: 13, color: "#6b6862", marginTop: 6 }}>
          Enter your access password to continue.
        </div>
        <form onSubmit={submit} style={{ marginTop: 24 }}>
          <label
            style={{
              display: "block",
              fontFamily: "var(--font-archivo)",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1.2,
              color: "#6b6862",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Password
          </label>
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              height: 48,
              padding: "0 14px",
              background: "#f7f5ef",
              border: "1px solid #e6e3da",
              borderRadius: 10,
              fontSize: 15,
              fontFamily: "var(--font-inter-tight)",
              color: "#0d0e10",
              outline: "none",
            }}
          />
          {error && (
            <div
              style={{
                marginTop: 10,
                padding: "10px 12px",
                background: "#fbe9e7",
                color: "#d43f3a",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              marginTop: 16,
              width: "100%",
              height: 52,
              background: loading || !password ? "#9a968d" : "#0d0e10",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontFamily: "var(--font-archivo)",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: 1.2,
              textTransform: "uppercase",
              cursor: loading || !password ? "default" : "pointer",
            }}
          >
            {loading ? "Checking…" : "Sign in →"}
          </button>
        </form>
        <div style={{ marginTop: 20, fontSize: 11, color: "#9a968d", textAlign: "center" }}>
          Phase 2 will use magic-link login tied to your dealership roster.
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
