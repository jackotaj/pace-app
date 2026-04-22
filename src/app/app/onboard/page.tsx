// Manager onboarding — 3 steps: claim store → paste roster → first CSV upload (optional).

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMyMembership } from "@/lib/supabase/tenancy";
import { OnboardFlow } from "@/components/manager/onboard-flow";

export default async function OnboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If not logged in with Supabase, redirect to login.
  if (!user) redirect("/login?next=/app/onboard");

  // If already has a store, send to manager dashboard.
  const { memberships } = await loadMyMembership();
  const existingStore = memberships.find((m) => m.store_id);
  if (existingStore?.store_id) redirect("/app/manager");

  return <OnboardFlow userEmail={user.email ?? ""} />;
}
