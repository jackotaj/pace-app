import { ManagerDashboard } from "@/components/manager/dashboard";
import { StoreHydrator } from "@/components/store-hydrator";
import { loadMyStoreSnapshot } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_REPS } from "@/lib/pace";
import { redirect } from "next/navigation";

export default async function ManagerAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <StoreHydrator reps={INITIAL_REPS} yourRepId="you" />
        <ManagerDashboard />
      </>
    );
  }

  const snapshot = await loadMyStoreSnapshot();
  if (!snapshot) redirect("/app/onboard");

  // Pure reps (no manager role) hitting /app/manager get sent to their pace.
  // Cross-role users (canSwitch=true) stay — they're allowed to view both.
  if (snapshot.yourRole === "rep" && !snapshot.canSwitch) redirect("/app/rep");

  const ctx = {
    storeId: snapshot.storeId,
    storeName: snapshot.storeName,
    storeTimezone: snapshot.storeTimezone,
    storeCity: snapshot.storeCity,
    storeState: snapshot.storeState,
    yourRole: snapshot.yourRole,
    repCount: snapshot.repCount,
    canSwitch: snapshot.canSwitch,
    userEmail: snapshot.userEmail,
  };

  return (
    <>
      <StoreHydrator reps={snapshot.reps} yourRepId={snapshot.yourRepId} ctx={ctx} />
      <ManagerDashboard />
    </>
  );
}
