import { redirect } from "next/navigation";
import { PhoneFrame } from "@/components/rep/phone-frame";
import { StoreHydrator } from "@/components/store-hydrator";
import { loadMyStoreSnapshot } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_REPS } from "@/lib/pace";

export default async function RepAppPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Legacy password-gate sessions have no Supabase user. Fall back to demo mock data.
  if (!user) {
    return (
      <>
        <StoreHydrator reps={INITIAL_REPS} yourRepId="you" />
        <PhoneFrame />
      </>
    );
  }

  const snapshot = await loadMyStoreSnapshot();
  if (!snapshot) {
    // User logged in but no store yet → send to onboarding (built in Week 2).
    redirect("/app/onboard");
  }

  return (
    <>
      <StoreHydrator reps={snapshot.reps} yourRepId={snapshot.yourRepId} />
      <PhoneFrame />
    </>
  );
}
