// POST /api/sales — manager "Log sale" button. Creates a single sale row + fires confetti flow.

import { NextResponse } from "next/server";
import { requireUser, UnauthorizedError } from "@/lib/supabase/tenancy";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { user } = await requireUser();
    const admin = createServiceClient();
    const body = (await req.json()) as {
      rep_id?: string;
      gross?: number;
      kind?: "new" | "used";
      vin?: string;
      vehicle?: string;
      source?: string;
      sold_at?: string;
    };

    if (!body.rep_id)
      return NextResponse.json({ error: "rep_id required" }, { status: 400 });

    const { data: rep } = await admin
      .from("reps")
      .select("id, store_id, stores(org_id)")
      .eq("id", body.rep_id)
      .maybeSingle();
    if (!rep)
      return NextResponse.json({ error: "Rep not found" }, { status: 404 });

    const orgId = (rep.stores as unknown as { org_id: string } | null)?.org_id;

    const { data: memberships } = await admin
      .from("memberships")
      .select("role, store_id, org_id")
      .eq("user_id", user.id);
    const canManage = (memberships ?? []).some(
      (m) =>
        m.org_id === orgId &&
        (m.role === "admin" || m.role === "manager") &&
        (m.store_id === null || m.store_id === rep.store_id),
    );
    if (!canManage)
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    const soldAt = body.sold_at ?? new Date().toISOString();
    const soldDate = soldAt.slice(0, 10);

    const { data, error } = await admin
      .from("sales")
      .insert({
        rep_id: rep.id,
        store_id: rep.store_id,
        sold_at: soldAt,
        sold_at_date: soldDate,
        vin: body.vin ?? null,
        vehicle: body.vehicle ?? "Logged sale",
        gross: body.gross ?? 2100,
        kind: body.kind ?? "used",
        source: (body.source ?? "other") as never,
      })
      .select("id, sold_at, gross, kind")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown" }, { status: 500 });
  }
}
