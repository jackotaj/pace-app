// Manager roster: view reps, set emails, send invites.

"use client";

import { useState } from "react";
import Link from "next/link";
import { Avatar, SectionHead } from "@/components/primitives";
import { fmtUSDk } from "@/lib/pace";

interface RosterRep {
  id: string;
  name: string;
  email: string | null;
  short: string | null;
  color: string;
  claimed: boolean;
  goal_units: number;
  goal_gross: number;
}

export function RosterManager({
  storeName,
  reps: initialReps,
}: {
  storeId: string;
  storeName: string;
  reps: RosterRep[];
}) {
  const [reps, setReps] = useState(initialReps);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function invite(rep: RosterRep, emailOverride?: string) {
    setInvitingId(rep.id);
    setError(null);
    try {
      const res = await fetch(`/api/reps/${rep.id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailOverride ? { email: emailOverride } : {}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Invite failed");
      setInvitedIds((s) => new Set(s).add(rep.id));
      if (emailOverride) {
        setReps((rs) => rs.map((r) => (r.id === rep.id ? { ...r, email: emailOverride } : r)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setInvitingId(null);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        fontFamily: "var(--font-inter-tight)",
        color: "#0d0e10",
      }}
    >
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <Link
            href="/app/manager"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", color: "#6b6862", fontSize: 13 }}
          >
            ← Back to dashboard
          </Link>
          <div style={{ fontSize: 12, color: "#6b6862" }}>{storeName}</div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e6e3da",
            borderRadius: 16,
            padding: "28px",
          }}
        >
          <SectionHead>Roster</SectionHead>
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontSize: 26,
              fontWeight: 800,
              letterSpacing: -0.6,
              marginTop: 6,
              marginBottom: 4,
            }}
          >
            {reps.length} reps · {reps.filter((r) => r.claimed).length} active.
          </div>
          <div style={{ fontSize: 13, color: "#6b6862", marginBottom: 20 }}>
            Invite a rep by email. They tap the link, their app is loaded with their name.
          </div>

          {error && (
            <div
              style={{
                marginBottom: 14,
                background: "#fbe9e7",
                color: "#d43f3a",
                borderRadius: 10,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ border: "1px solid #e6e3da", borderRadius: 12, overflow: "hidden" }}>
            {reps.map((r, i) => (
              <RosterRow
                key={r.id}
                rep={r}
                border={i > 0}
                inviting={invitingId === r.id}
                invited={invitedIds.has(r.id)}
                onInvite={(email) => invite(r, email)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RosterRow({
  rep,
  border,
  inviting,
  invited,
  onInvite,
}: {
  rep: RosterRep;
  border: boolean;
  inviting: boolean;
  invited: boolean;
  onInvite: (email?: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(rep.email ?? "");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "40px 2fr 2fr 1.5fr auto",
        padding: "14px 16px",
        borderTop: border ? "1px solid #e6e3da" : undefined,
        gap: 12,
        alignItems: "center",
      }}
    >
      <Avatar rep={{ color: rep.color, short: rep.short ?? rep.name.slice(0, 2).toUpperCase() }} size={36} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{rep.name}</div>
        <div style={{ fontSize: 11, color: "#6b6862", marginTop: 1 }}>
          {rep.goal_units} units / {fmtUSDk(rep.goal_gross)} goal
        </div>
      </div>
      {editing || !rep.email ? (
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="rep@dealership.com"
          type="email"
          style={{
            height: 36,
            padding: "0 10px",
            background: "#f7f5ef",
            border: "1px solid #e6e3da",
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "var(--font-inter-tight)",
            color: "#0d0e10",
            outline: "none",
          }}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          style={{ fontSize: 13, color: "#6b6862", cursor: "pointer" }}
        >
          {rep.email}
        </div>
      )}
      <div>
        {rep.claimed ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "4px 8px",
              background: "#e5f5ec",
              color: "#17a058",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: "var(--font-archivo)",
            }}
          >
            ● Active
          </span>
        ) : invited ? (
          <span
            style={{
              display: "inline-flex",
              padding: "4px 8px",
              background: "#d6f5f0",
              color: "#019A8A",
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.8,
              textTransform: "uppercase",
              fontFamily: "var(--font-archivo)",
            }}
          >
            ✓ Invite sent
          </span>
        ) : (
          <span style={{ fontSize: 11, color: "#9a968d" }}>Not invited</span>
        )}
      </div>
      <button
        disabled={inviting || (!email && !rep.email)}
        onClick={() => onInvite(editing ? email : undefined)}
        style={{
          padding: "8px 14px",
          background: inviting || (!email && !rep.email) ? "#d8d4c7" : "#0d0e10",
          color: inviting || (!email && !rep.email) ? "#6b6862" : "#fff",
          border: "none",
          borderRadius: 8,
          fontFamily: "var(--font-archivo)",
          fontWeight: 700,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
          cursor: inviting || (!email && !rep.email) ? "default" : "pointer",
        }}
      >
        {inviting ? "Sending…" : rep.claimed ? "Re-invite" : "Invite"}
      </button>
    </div>
  );
}
