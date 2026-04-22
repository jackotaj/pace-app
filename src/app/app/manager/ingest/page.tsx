import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMyMembership } from "@/lib/supabase/tenancy";
import { IngestFlow } from "@/components/manager/ingest-flow";

export default async function IngestPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/app/manager/ingest");

  const { memberships } = await loadMyMembership();
  const managerMembership = memberships.find(
    (m) => m.role === "admin" || m.role === "manager",
  );
  if (!managerMembership) redirect("/app/onboard");

  // Find the first store under this org. Phase 2: store picker.
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name, ingest_slug")
    .limit(1);
  const store = stores?.[0];
  if (!store) redirect("/app/onboard");

  return (
    <IngestFlow storeId={store.id} storeName={store.name} ingestSlug={store.ingest_slug ?? ""} />
  );
}
