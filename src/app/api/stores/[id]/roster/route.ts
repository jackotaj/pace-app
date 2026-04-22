// POST /api/stores/[id]/roster — bulk add/update reps for a store.
// Accepts [{ name, email, goal_units, goal_gross, short?, color?, focus? }].

import { NextResponse } from "next/server";
import { requireManagerOfStore, UnauthorizedError } from "@/lib/supabase/tenancy";

interface RosterEntry {
  name: string;
  email?: string;
  goal_units?: number;
  goal_gross?: number;
  short?: string;
  color?: string;
  focus?: "new" | "used" | "both";
}

const PALETTE = [
  "#2b6cb0", "#6b4fb8", "#0d0e10", "#b8842a", "#17a058",
  "#d43f3a", "#3a8a7a", "#c25c8f", "#5e8a3a", "#b26b17",
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "??";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { admin, store } = await requireManagerOfStore(id);
    const body = (await req.json()) as { reps?: RosterEntry[] };

    if (!body.reps || !Array.isArray(body.reps) || body.reps.length === 0) {
      return NextResponse.json({ error: "reps[] required" }, { status: 400 });
    }

    const rows = body.reps
      .filter((r) => r.name?.trim())
      .map((r, i) => ({
        store_id: store.id,
        name: r.name.trim(),
        email: r.email?.trim().toLowerCase() || null,
        short: (r.short?.slice(0, 2) || initials(r.name)).toUpperCase(),
        color: r.color ?? PALETTE[i % PALETTE.length],
        goal_units: Math.max(0, Math.floor(Number(r.goal_units ?? 0))),
        goal_gross: Math.max(0, Number(r.goal_gross ?? 0)),
        focus: r.focus ?? null,
        active: true,
      }));

    // Upsert by (store_id, email). Reps without email can't be dedup'd — inserted fresh.
    const withEmail = rows.filter((r) => r.email);
    const withoutEmail = rows.filter((r) => !r.email);

    const results = [];
    if (withEmail.length > 0) {
      const { data, error } = await admin
        .from("reps")
        .upsert(withEmail, { onConflict: "store_id,email" })
        .select("id, name, email");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      results.push(...(data ?? []));
    }
    if (withoutEmail.length > 0) {
      const { data, error } = await admin
        .from("reps")
        .insert(withoutEmail)
        .select("id, name, email");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      results.push(...(data ?? []));
    }

    return NextResponse.json({ data: { reps: results, count: results.length } });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
