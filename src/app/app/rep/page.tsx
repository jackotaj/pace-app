import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/rep/phone-frame";
import { StoreHydrator } from "@/components/store-hydrator";
import { loadMyStoreSnapshot } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_REPS } from "@/lib/pace";
import { EmptyStorePhone } from "@/components/rep/empty-state";

export default async function RepAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Legacy password-gate sessions have no Supabase user. Show the demo with mock data.
  if (!user) {
    return (
      <>
        <StoreHydrator reps={INITIAL_REPS} yourRepId="you" />
        <PhoneFrame />
      </>
    );
  }

  const snapshot = await loadMyStoreSnapshot();
  if (!snapshot) redirect("/app/onboard");

  // Manager hit /app/rep but has no rep seat → send them to the manager dashboard.
  if (!snapshot.yourRepId && snapshot.yourRole !== "rep") {
    redirect("/app/manager");
  }

  // Rep has a seat but store has 0 reps visible (shouldn't happen if yourRepId set; safety).
  if (snapshot.reps.length === 0) {
    return <EmptyStorePhone storeName={snapshot.storeName} />;
  }

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
      <PhoneFrame />
    </>
  );
}
