// Helpers for resolving who the caller is, which org/store they manage, and
// enforcing manager-level access at the API boundary.

import { createClient, createServiceClient } from "@/lib/supabase/server";

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
  }
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new UnauthorizedError();
  return { user, supabase };
}

export async function requireManagerOfStore(storeId: string) {
  const { user, supabase } = await requireUser();
  const admin = createServiceClient();

  const { data: store } = await admin
    .from("stores")
    .select("id, org_id, timezone")
    .eq("id", storeId)
    .maybeSingle();

  if (!store) throw new UnauthorizedError();

  const { data: memberships } = await admin
    .from("memberships")
    .select("role, store_id")
    .eq("user_id", user.id)
    .eq("org_id", store.org_id);

  const ok = (memberships ?? []).some(
    (m) =>
      (m.role === "admin" || m.role === "manager") &&
      (m.store_id === null || m.store_id === storeId),
  );
  if (!ok) throw new UnauthorizedError();
  return { user, supabase, admin, store };
}

export async function loadMyMembership() {
  const { user, supabase } = await requireUser();
  const admin = createServiceClient();
  const { data: memberships } = await admin
    .from("memberships")
    .select("id, role, org_id, store_id, orgs(name), stores(name)")
    .eq("user_id", user.id);
  return { user, supabase, memberships: memberships ?? [] };
}
