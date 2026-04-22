// /app/claim/[id] — rep follows magic link, we bind their auth user to the rep row.

import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PaceMark } from "@/components/logo";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/app/claim/${id}`);

  const admin = createServiceClient();

  const { data: rep } = await admin
    .from("reps")
    .select("id, store_id, user_id, email, name, stores(org_id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!rep) {
    return (
      <ClaimShell>
        <h2 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 8 }}>
          We can&apos;t find that invite.
        </h2>
        <p style={{ fontSize: 14, color: "#6b6862" }}>Ask your manager to resend it.</p>
      </ClaimShell>
    );
  }

  // Email matches? Link the user_id and create a rep membership.
  if (!rep.user_id) {
    await admin.from("reps").update({ user_id: user.id }).eq("id", rep.id);
    const orgId = (rep.stores as unknown as { org_id: string } | null)?.org_id;
    if (orgId) {
      await admin
        .from("memberships")
        .upsert(
          {
            user_id: user.id,
            org_id: orgId,
            store_id: rep.store_id,
            role: "rep",
          },
          { onConflict: "user_id,org_id,store_id" },
        );
    }
  }

  // Already claimed by someone else?
  if (rep.user_id && rep.user_id !== user.id) {
    return (
      <ClaimShell>
        <h2 style={{ fontFamily: "var(--font-archivo)", fontWeight: 800, fontSize: 24, letterSpacing: -0.5, marginBottom: 8 }}>
          Already claimed.
        </h2>
        <p style={{ fontSize: 14, color: "#6b6862" }}>
          This rep seat has been linked to another account. Ask your manager to add a new row.
        </p>
      </ClaimShell>
    );
  }

  redirect("/app/rep");
}

function ClaimShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f5ef",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-inter-tight)",
        color: "#0d0e10",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          background: "#ffffff",
          border: "1px solid #e6e3da",
          borderRadius: 16,
          padding: "32px 30px",
        }}
      >
        <Link
          href="/"
          style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 20, textDecoration: "none" }}
        >
          <PaceMark size={30} />
          <div
            style={{
              fontFamily: "var(--font-archivo)",
              fontWeight: 800,
              fontSize: 20,
              color: "#02BFAB",
              letterSpacing: -0.5,
              lineHeight: 1,
            }}
          >
            pace
          </div>
        </Link>
        {children}
      </div>
    </div>
  );
}
