// POST /api/stores — create a new org + store in one call, make caller the admin/manager.
// This is the "claim your dealership" step in onboarding.

import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireUser, UnauthorizedError } from "@/lib/supabase/tenancy";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function POST(req: Request) {
  try {
    const { user } = await requireUser();
    const body = (await req.json()) as {
      orgName?: string;
      storeName?: string;
      city?: string;
      state?: string;
      timezone?: string;
    };

    if (!body.orgName || !body.storeName) {
      return NextResponse.json(
        { error: "orgName and storeName are required" },
        { status: 400 },
      );
    }

    const admin = createServiceClient();

    // Insert org
    const { data: org, error: orgErr } = await admin
      .from("orgs")
      .insert({ name: body.orgName, slug: slugify(body.orgName) + "-" + Date.now().toString(36) })
      .select("id")
      .single();
    if (orgErr || !org) {
      return NextResponse.json({ error: orgErr?.message ?? "Could not create org" }, { status: 500 });
    }

    // Insert store
    const ingestSlug = slugify(body.storeName) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: store, error: storeErr } = await admin
      .from("stores")
      .insert({
        org_id: org.id,
        name: body.storeName,
        city: body.city ?? null,
        state: body.state ?? null,
        timezone: body.timezone ?? "America/New_York",
        ingest_slug: ingestSlug,
      })
      .select("id, name, ingest_slug, timezone")
      .single();
    if (storeErr || !store) {
      return NextResponse.json({ error: storeErr?.message ?? "Could not create store" }, { status: 500 });
    }

    // Give caller admin role for the org
    const { error: memErr } = await admin.from("memberships").insert({
      user_id: user.id,
      org_id: org.id,
      store_id: null,
      role: "admin",
    });
    if (memErr) {
      return NextResponse.json({ error: memErr.message }, { status: 500 });
    }

    return NextResponse.json({ data: { org_id: org.id, store } });
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
