// Magic-link / OAuth callback.
// Handles both flows:
//   PKCE        → /auth/callback?code=XYZ           (modern @supabase/ssr default)
//   OTP (email) → /auth/callback?token_hash=X&type=magiclink|email|recovery
// On failure, redirects to /login?error= with a message (instead of silently
// bouncing to /app/rep which then bounces back to /login looking like "nothing happened").

import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") || "/app/rep";

  const supabase = await createClient();

  try {
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) return bounce(url, `code exchange failed: ${error.message}`);
      return NextResponse.redirect(new URL(next, url.origin));
    }

    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type: type as EmailOtpType,
        token_hash: tokenHash,
      });
      if (error) return bounce(url, `otp verify failed: ${error.message}`);
      return NextResponse.redirect(new URL(next, url.origin));
    }
  } catch (e) {
    return bounce(url, e instanceof Error ? e.message : "callback crashed");
  }

  return bounce(url, "no code or token_hash in callback URL");
}

function bounce(url: URL, reason: string) {
  const login = new URL("/login", url.origin);
  login.searchParams.set("error", reason);
  return NextResponse.redirect(login);
}
