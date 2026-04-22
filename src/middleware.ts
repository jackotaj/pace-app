// Auth gate for /app/*. Supabase session preferred; falls back to PACE_ACCESS_PASSWORD
// cookie during the transition period for back-compat with the old access flow.

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { response, user } = await updateSession(req);
  const url = req.nextUrl;

  if (!url.pathname.startsWith("/app")) return response;

  // Authenticated via Supabase — let through.
  if (user) return response;

  // Legacy password cookie fallback (still honoured until magic link is universal).
  const expected = process.env.PACE_ACCESS_PASSWORD;
  const legacy = req.cookies.get("pace_access")?.value;
  if (expected && legacy === expected) return response;

  // Not authenticated — bounce to /login.
  const login = url.clone();
  login.pathname = "/login";
  login.searchParams.set("next", url.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    // Run on all paths except static + image assets; that way Supabase session cookies
    // stay fresh on every navigation, not just /app.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
