// Gate /app/* behind a shared password cookie.
// Phase 2 will replace this with Supabase magic-link auth.

import { NextResponse, type NextRequest } from "next/server";

const COOKIE_NAME = "pace_access";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (!url.pathname.startsWith("/app")) return NextResponse.next();

  const expected = process.env.PACE_ACCESS_PASSWORD;
  // If no password is configured, allow through (dev mode).
  if (!expected) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie === expected) return NextResponse.next();

  const login = url.clone();
  login.pathname = "/login";
  login.searchParams.set("next", url.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/app/:path*"],
};
