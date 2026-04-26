import { AppHeader } from "@/components/app-header";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-paper">
      <AppHeader userEmail={user?.email ?? null} />
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  );
}
