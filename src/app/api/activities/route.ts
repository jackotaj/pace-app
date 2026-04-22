// POST /api/activities — upsert today's activity row for a rep. Rep or their manager can write.

import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/supabase/tenancy";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { user } = await requireUser();
    const admin = createServiceClient();
    const body = (await req.json()) as {
      rep_id?: string;
      delta?: { calls?: number; texts?: number; set?: number; shown?: number };
    };
    if (!body.rep_id || !body.delta)
      return NextResponse.json({ error: "rep_id and delta required" }, { status: 400 });

    const { data: rep } = await admin
      .from("reps")
      .select("id, store_id, user_id, stores(org_id)")
      .eq("id", body.rep_id)
      .maybeSingle();
    if (!rep) return NextResponse.json({ error: "Rep not found" }, { status: 404 });

    const orgId = (rep.stores as unknown as { org_id: string } | null)?.org_id;
    const isSelf = rep.user_id === user.id;
    let allowed = isSelf;
    if (!allowed) {
      const { data: memberships } = await admin
        .from("memberships")
        .select("role, store_id, org_id")
        .eq("user_id", user.id);
      allowed = (memberships ?? []).some(
        (m) =>
          m.org_id === orgId &&
          (m.role === "admin" || m.role === "manager") &&
          (m.store_id === null || m.store_id === rep.store_id),
      );
    }
    if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await admin
      .from("activities")
      .select("id, calls, texts, appts_set, appts_shown")
      .eq("rep_id", rep.id)
      .eq("activity_date", today)
      .maybeSingle();

    const row = {
      rep_id: rep.id,
      store_id: rep.store_id,
      activity_date: today,
      calls: (existing?.calls ?? 0) + (body.delta.calls ?? 0),
      texts: (existing?.texts ?? 0) + (body.delta.texts ?? 0),
      appts_set: (existing?.appts_set ?? 0) + (body.delta.set ?? 0),
      appts_shown: (existing?.appts_shown ?? 0) + (body.delta.shown ?? 0),
    };

    const { data, error } = await admin
      .from("activities")
      .upsert(row, { onConflict: "rep_id,activity_date" })
      .select("id, calls, texts, appts_set, appts_shown")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
