import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  // Also clear legacy access cookie.
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete("pace_access");
  return res;
}
