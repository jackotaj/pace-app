import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { loadMyMembership } from "@/lib/supabase/tenancy";
import { RosterManager } from "@/components/manager/roster-manager";

export default async function RosterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/manager/roster");

  const { memberships } = await loadMyMembership();
  const admin = createServiceClient();

  const managerOrg = memberships.find((m) => m.role === "admin" || m.role === "manager");
  if (!managerOrg) redirect("/app/onboard");

  const { data: stores } = await admin
    .from("stores")
    .select("id, name")
    .eq("org_id", managerOrg.org_id)
    .limit(1);
  const store = stores?.[0];
  if (!store) redirect("/app/onboard");

  const { data: reps } = await admin
    .from("reps")
    .select("id, name, email, short, color, user_id, goal_units, goal_gross, active")
    .eq("store_id", store.id)
    .is("deleted_at", null)
    .order("name", { ascending: true });

  return (
    <RosterManager
      storeId={store.id}
      storeName={store.name}
      reps={
        (reps ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          short: r.short,
          color: r.color,
          claimed: !!r.user_id,
          goal_units: r.goal_units,
          goal_gross: Number(r.goal_gross),
        }))
      }
    />
  );
}
