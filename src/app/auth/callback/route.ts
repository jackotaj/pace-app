// Magic-link callback. Exchanges ?code=… for a session, then redirects to ?next=.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/app/rep";

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  const redirect = new URL(next, url.origin);
  return NextResponse.redirect(redirect);
}
