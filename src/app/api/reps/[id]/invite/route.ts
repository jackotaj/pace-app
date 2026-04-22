// POST /api/reps/[id]/invite — manager sends a magic-link invite to a rep.
// Auth: caller must manage the rep's store.

import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/supabase/tenancy";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    const { user } = await requireUser();
    const admin = createServiceClient();
    const body = (await req.json().catch(() => ({}))) as { email?: string };

    const { data: rep } = await admin
      .from("reps")
      .select("id, store_id, name, email, stores(org_id)")
      .eq("id", id)
      .maybeSingle();
    if (!rep) return NextResponse.json({ error: "Rep not found" }, { status: 404 });

    const orgId = (rep.stores as unknown as { org_id: string } | null)?.org_id;
    const { data: memberships } = await admin
      .from("memberships")
      .select("role, org_id, store_id")
      .eq("user_id", user.id);
    const allowed = (memberships ?? []).some(
      (m) =>
        m.org_id === orgId &&
        (m.role === "admin" || m.role === "manager") &&
        (m.store_id === null || m.store_id === rep.store_id),
    );
    if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const email = (body.email ?? rep.email)?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    if (rep.email !== email) {
      await admin.from("reps").update({ email }).eq("id", rep.id);
    }

    const origin = new URL(req.url).origin;
    const { error: otpErr } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/app/claim/${rep.id}`)}`,
      },
    });
    if (otpErr) return NextResponse.json({ error: otpErr.message }, { status: 500 });

    // Fire actual send using the signed OTP email — Supabase sends from its configured SMTP.
    // generateLink above returns the action_link but does NOT send. Use signInWithOtp with
    // shouldCreateUser=true via a public client-style call (admin invite email).
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(`/app/claim/${rep.id}`)}`,
      data: { rep_id: rep.id, name: rep.name },
    });
    if (inviteErr && !inviteErr.message.toLowerCase().includes("already")) {
      return NextResponse.json({ error: inviteErr.message }, { status: 500 });
    }

    return NextResponse.json({ data: { sent_to: email } });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
