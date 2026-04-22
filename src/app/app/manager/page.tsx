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

  // Reps hitting /app/manager should just go to their rep home.
  if (snapshot.yourRole === "rep") redirect("/app/rep");

  const ctx = {
    storeId: snapshot.storeId,
    storeName: snapshot.storeName,
    storeTimezone: snapshot.storeTimezone,
    storeCity: snapshot.storeCity,
    storeState: snapshot.storeState,
    yourRole: snapshot.yourRole,
    repCount: snapshot.repCount,
  };

  return (
    <>
      <StoreHydrator reps={snapshot.reps} yourRepId={snapshot.yourRepId} ctx={ctx} />
      <ManagerDashboard />
    </>
  );
}
