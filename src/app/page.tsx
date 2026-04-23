// Landing page — ported from design_files/extra.jsx (LandingPage)
// Rebranded "Daily Drive" → "Pace"
"use client";

import Link from "next/link";
import { Ic } from "@/components/primitives";
import { PaceMark } from "@/components/logo";

const link: React.CSSProperties = {
  color: "#0d0e10",
  textDecoration: "none",
  cursor: "pointer",
};

export default function LandingPage() {
  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "var(--font-inter-tight)",
        color: "#0d0e10",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          position: "sticky",
          top: 0,
          background: "rgba(255,255,255,.92)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e6e3da",
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}
          >
            <PaceMark size={30} />
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontWeight: 800,
                fontSize: 22,
                color: "#02BFAB",
                letterSpacing: -0.6,
                lineHeight: 1,
              }}
            >
              pace
            </div>
          </Link>
          <div className="hidden md:flex" style={{ gap: 28, fontSize: 13, color: "#6b6862" }}>
            <a style={link} href="#how">How it works</a>
            <a style={link} href="#pricing">Pricing</a>
            <a style={link} href="#math">The math</a>
            <a style={link} href="#results">Pilot results</a>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/login"
              style={{
                padding: "8px 14px",
                background: "transparent",
                border: "1px solid #d8d4c7",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                color: "#0d0e10",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
            <a
              href="#cta"
              style={{
                padding: "8px 16px",
                background: "#0d0e10",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontFamily: "var(--font-archivo)",
                fontWeight: 700,
                fontSize: 11,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Book demo
            </a>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div
        className="md:grid-cols-[1.1fr_1fr] grid grid-cols-1"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "72px 32px 40px",
          gap: 60,
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-block",
              padding: "5px 12px",
              background: "#f7f5ef",
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 600,
              color: "#6b6862",
              letterSpacing: 0.4,
              marginBottom: 18,
            }}
          >
            ● For sales managers at dealerships
          </div>
          <div
            className="text-5xl md:!text-7xl"
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              letterSpacing: -2.2,
              lineHeight: 0.95,
            }}
          >
            Your reps hit
            <br />
            their number.
            <br />
            Without you
            <br />
            nagging.
          </div>
          <div
            style={{
              fontSize: 17,
              color: "#6b6862",
              marginTop: 22,
              lineHeight: 1.5,
              maxWidth: 500,
            }}
          >
            Pace turns monthly sales goals into a daily activity plan every rep can see, own, and hit. Back-solved from closing ratios. Gamified for the floor. Live before Saturday.
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
            <a
              href="#cta"
              style={{
                padding: "14px 22px",
                background: "#0d0e10",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontFamily: "var(--font-archivo)",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: 1,
                textTransform: "uppercase",
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              Book 20-min demo →
            </a>
            <Link
              href="/app/rep"
              style={{
                padding: "14px 22px",
                background: "transparent",
                color: "#0d0e10",
                border: "1px solid #d8d4c7",
                borderRadius: 10,
                fontFamily: "var(--font-archivo)",
                fontWeight: 600,
                fontSize: 13,
                letterSpacing: 0.5,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              See the app ↗
            </Link>
          </div>
          <div
            style={{
              marginTop: 22,
              display: "flex",
              gap: 22,
              fontSize: 12,
              color: "#6b6862",
              flexWrap: "wrap",
            }}
          >
            <div>◆ 5-minute setup</div>
            <div>◆ Works with VinSolutions, DealerSocket, Elead</div>
          </div>
        </div>

        {/* Visual — mock rep home */}
        <div
          style={{
            background: "#0d0e10",
            borderRadius: 22,
            padding: "40px 36px",
            color: "#fff",
            position: "relative",
            boxShadow: "0 30px 60px rgba(13,14,16,.25)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 10,
              letterSpacing: 2,
              color: "rgba(255,255,255,.5)",
              fontWeight: 700,
            }}
          >
            TODD · APR 21 · BEHIND 1.8
          </div>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 128,
              fontWeight: 800,
              letterSpacing: -5,
              lineHeight: 0.9,
              marginTop: 10,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            7<span style={{ color: "rgba(255,255,255,.3)" }}>/12</span>
          </div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.65)", marginTop: 8 }}>
            UNITS THIS MONTH
          </div>
          <div
            style={{
              marginTop: 30,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,.1)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 10,
                letterSpacing: 2,
                color: "rgba(255,255,255,.5)",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              TODAY YOU NEED
            </div>
            {[
              { l: "Outbound", v: 47, done: 18 },
              { l: "Contacts", v: 14, done: 5 },
              { l: "Appts set", v: 2, done: 2 },
            ].map((r) => (
              <div
                key={r.l}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  padding: "7px 0",
                  borderBottom: "1px solid rgba(255,255,255,.08)",
                }}
              >
                <div style={{ fontSize: 13 }}>{r.l}</div>
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 22,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                    letterSpacing: -0.3,
                  }}
                >
                  <span style={{ color: r.done >= r.v ? "#17a058" : "#fff" }}>{r.done}</span>
                  <span
                    style={{
                      color: "rgba(255,255,255,.4)",
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    {" "}
                    / {r.v}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social proof strip */}
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "40px 32px",
          borderTop: "1px solid #e6e3da",
          borderBottom: "1px solid #e6e3da",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            color: "#6b6862",
            fontFamily: "var(--font-archivo)",
            fontWeight: 700,
            textTransform: "uppercase",
            textAlign: "center",
          }}
        >
          Piloting with
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 18,
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          {["Greenfield Auto", "Varsity Motors", "Ridgeline Ford", "Mesa Chevrolet", "Cedar Ave Kia"].map((n) => (
            <div
              key={n}
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 17,
                fontWeight: 700,
                color: "#9a968d",
                letterSpacing: -0.3,
              }}
            >
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Problem */}
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          padding: "100px 32px 60px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-archivo)",
            fontSize: 11,
            letterSpacing: 2,
            color: "#d43f3a",
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          The problem
        </div>
        <div
          className="text-3xl md:!text-5xl"
          style={{
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            letterSpacing: -1.6,
            marginTop: 10,
            lineHeight: 1.05,
          }}
        >
          On the 20th, you find out they&apos;re short.
        </div>
        <div
          style={{
            fontSize: 16,
            color: "#6b6862",
            marginTop: 16,
            maxWidth: 720,
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.55,
          }}
        >
          Your CRM has the sold count. Your gut knows who&apos;s coasting. But nobody knows — including the rep — exactly how many calls they need to make <i>today</i> to hit this month&apos;s number. By the time it&apos;s obvious, the month is over.
        </div>
      </div>

      {/* Three-step */}
      <div id="how" style={{ background: "#f7f5ef", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 11,
              letterSpacing: 2,
              color: "#6b6862",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            How it works
          </div>
          <div
            className="text-3xl md:!text-5xl"
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              letterSpacing: -1.2,
              marginTop: 8,
              lineHeight: 1,
            }}
          >
            The grind, made explicit.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24, marginTop: 40 }}>
            {[
              { n: "01", t: "Set the goal", b: "Units and gross per rep. Copy last month or import from your CRM. 90 seconds." },
              { n: "02", t: "Back-solve the math", b: "League-average ratios tell us how many calls, texts, and appts each rep needs per day to get there. Tune per rep as data arrives." },
              { n: "03", t: "Ship it to the floor", b: "Reps see their targets on their phone. Manager sees the whole team. Goal, gross, pace, leaderboard — one glance." },
            ].map((s) => (
              <div
                key={s.n}
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: "28px 24px",
                  border: "1px solid #e6e3da",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 42,
                    fontWeight: 800,
                    color: "#d8d4c7",
                    letterSpacing: -1.2,
                  }}
                >
                  {s.n}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 22,
                    fontWeight: 800,
                    marginTop: 4,
                    letterSpacing: -0.5,
                  }}
                >
                  {s.t}
                </div>
                <div style={{ fontSize: 14, color: "#6b6862", marginTop: 8, lineHeight: 1.55 }}>
                  {s.b}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Math callout */}
      <div id="math" style={{ maxWidth: 1180, margin: "0 auto", padding: "100px 32px" }}>
        <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 60, alignItems: "center" }}>
          <div>
            <div
              style={{
                fontFamily: "var(--font-archivo)",
                fontSize: 11,
                letterSpacing: 2,
                color: "#6b6862",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              The engine
            </div>
            <div
              className="text-3xl md:!text-[44px]"
              style={{
                fontFamily: "var(--font-archivo)",
                fontWeight: 800,
                letterSpacing: -1.4,
                marginTop: 10,
                lineHeight: 1,
              }}
            >
              Every sale is 47 outbound attempts.
            </div>
            <div style={{ fontSize: 15, color: "#6b6862", marginTop: 16, lineHeight: 1.55 }}>
              Close rate 20%. Show rate 65%. Set rate 15%. Contact rate 30%. We back-solve those four ratios into a daily activity floor for every rep on your floor — then tune them as the numbers come in. No more guessing.
            </div>
            <ul
              style={{
                marginTop: 18,
                padding: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {[
                "Per-rep conversion tuning after 30 appts",
                "Goal adjusts for days-in-month + PTO",
                "Gross goal independent from unit goal",
              ].map((p) => (
                <li
                  key={p}
                  style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: 3, background: "#0d0e10" }} />
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div
            style={{
              background: "#0d0e10",
              color: "#fff",
              borderRadius: 18,
              padding: "30px 32px",
              fontFamily: "var(--font-jetbrains)",
            }}
          >
            {[
              { l: "47", sub: "outbound attempts", color: "#fff", hl: false },
              { l: "14", sub: "live contacts · 30%", color: "#fff", hl: false },
              { l: "2", sub: "appts set · 15%", color: "#fff", hl: false },
              { l: "1.3", sub: "shown · 65%", color: "#fff", hl: false },
              { l: "1", sub: "SALE · 20%", color: "#02BFAB", hl: true },
            ].map((r, i, a) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "10px 0",
                  borderBottom: i < a.length - 1 ? "1px solid rgba(255,255,255,.1)" : "none",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 32,
                    fontWeight: 800,
                    color: r.color,
                    letterSpacing: -0.8,
                    width: 70,
                    textAlign: "right",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {r.l}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: r.hl ? "#02BFAB" : "rgba(255,255,255,.7)",
                    letterSpacing: r.hl ? 2 : 0,
                    fontWeight: r.hl ? 700 : 400,
                    textTransform: r.hl ? "uppercase" : "none",
                  }}
                >
                  {r.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outcome stats */}
      <div id="results" style={{ background: "#0d0e10", color: "#fff", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 11,
              letterSpacing: 2,
              color: "rgba(255,255,255,.55)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            Pilot results · 90 days · 3 stores
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: 24, marginTop: 28 }}>
            {[
              { n: "+18%", l: "units per rep", sub: "vs. same-store prior period" },
              { n: "+$127", l: "gross per deal", sub: "on Curb-sourced leads" },
              { n: "91%", l: "daily log rate", sub: "reps logging 5+ days/week" },
              { n: "3.2d", l: "avg time to behind-flag", sub: "down from 14d" },
            ].map((s) => (
              <div key={s.l}>
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 48,
                    fontWeight: 800,
                    letterSpacing: -2,
                    color: "#02BFAB",
                    lineHeight: 1,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 14, color: "#fff", fontWeight: 600, marginTop: 10 }}>
                  {s.l}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 4 }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div
        style={{
          maxWidth: 880,
          margin: "0 auto",
          padding: "100px 32px",
          textAlign: "center",
        }}
      >
        <div
          className="text-2xl md:!text-[34px]"
          style={{
            fontFamily: "var(--font-archivo)",
            fontWeight: 700,
            letterSpacing: -0.8,
            lineHeight: 1.25,
          }}
        >
          &ldquo;My GSM used to spend every Tuesday yelling at the board. Now reps know their number before he walks in. First month, we did 18% more units.&rdquo;
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 13,
            color: "#6b6862",
            fontFamily: "var(--font-archivo)",
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          Dana Reyes · GSM · Greenfield Auto
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" style={{ background: "#f7f5ef", padding: "80px 32px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 11,
              letterSpacing: 2,
              color: "#6b6862",
              fontWeight: 700,
              textTransform: "uppercase",
              textAlign: "center",
            }}
          >
            Pricing
          </div>
          <div
            className="text-3xl md:!text-5xl"
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              letterSpacing: -1.2,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Per rep. Per month.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 18, marginTop: 42 }}>
            {[
              {
                n: "Starter",
                p: "$29",
                d: "/rep/mo",
                feat: ["Rep + manager app", "Goal + pace math", "Leaderboards", "Up to 10 reps"],
                highlight: false,
              },
              {
                n: "Pro",
                p: "$49",
                d: "/rep/mo",
                feat: [
                  "Everything in Starter",
                  "Streaks + badges",
                  "Spiffs + 1v1 battles",
                  "Power Hour",
                  "Unlimited reps",
                ],
                highlight: true,
              },
              {
                n: "Enterprise",
                p: "—",
                d: "Talk to us",
                feat: [
                  "Multi-store rollup",
                  "Direct CRM integrations",
                  "Curb Direct attribution",
                  "Dedicated onboarding",
                ],
                highlight: false,
              },
            ].map((t) => (
              <div
                key={t.n}
                style={{
                  background: t.highlight ? "#0d0e10" : "#ffffff",
                  color: t.highlight ? "#fff" : "#0d0e10",
                  border: t.highlight ? "none" : "1px solid #e6e3da",
                  borderRadius: 16,
                  padding: "28px 26px",
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-archivo)",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: -0.2,
                  }}
                >
                  {t.n}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 10 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-archivo)",
                      fontSize: 52,
                      fontWeight: 800,
                      letterSpacing: -1.8,
                      lineHeight: 1,
                    }}
                  >
                    {t.p}
                  </div>
                  <div style={{ fontSize: 12, color: t.highlight ? "rgba(255,255,255,.6)" : "#6b6862" }}>
                    {t.d}
                  </div>
                </div>
                <ul
                  style={{
                    marginTop: 18,
                    padding: 0,
                    listStyle: "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {t.feat.map((f) => (
                    <li
                      key={f}
                      style={{
                        fontSize: 13,
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        color: t.highlight ? "rgba(255,255,255,.85)" : "#0d0e10",
                      }}
                    >
                      <span style={{ color: t.highlight ? "#02BFAB" : "#17a058", fontWeight: 700 }}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  style={{
                    marginTop: 24,
                    width: "100%",
                    padding: "12px",
                    background: t.highlight ? "#02BFAB" : "#0d0e10",
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    fontFamily: "var(--font-archivo)",
                    fontWeight: 700,
                    fontSize: 12,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  {t.n === "Enterprise" ? "Contact sales →" : "Start pilot →"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div
        id="cta"
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "100px 32px 80px",
          textAlign: "center",
        }}
      >
        <div
          className="text-4xl md:!text-[54px]"
          style={{
            fontFamily: "var(--font-archivo)",
            fontWeight: 800,
            letterSpacing: -1.8,
            lineHeight: 1,
          }}
        >
          Your May starts in 9 days.
        </div>
        <div style={{ fontSize: 16, color: "#6b6862", marginTop: 16 }}>
          Set goals Monday. Train reps Wednesday. Live by Friday.
        </div>
        <a
          href="mailto:todd@pace.app?subject=Book%20a%20Pace%20demo"
          style={{
            marginTop: 32,
            padding: "16px 28px",
            background: "#0d0e10",
            color: "#fff",
            border: "none",
            borderRadius: 12,
            fontFamily: "var(--font-archivo)",
            fontWeight: 700,
            fontSize: 14,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            cursor: "pointer",
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          Book a demo →
        </a>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #e6e3da", padding: "32px" }}>
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "#6b6862",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>Pace · © 2026 · Boise, ID</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <a style={link}>Privacy</a>
            <a style={link}>Terms</a>
            <a style={link}>Security</a>
            <a style={link}>By the team behind Curb</a>
          </div>
        </div>
      </div>
    </div>
  );
}
