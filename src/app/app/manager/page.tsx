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

  return (
    <>
      <StoreHydrator reps={snapshot.reps} yourRepId={snapshot.yourRepId} />
      <ManagerDashboard />
    </>
  );
}
