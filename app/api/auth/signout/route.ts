import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where pages send a request that has no usable profile. A signed-in user here
 * has an auth account but no profile (a new student not on the 2026-batch
 * list), so sign them out and explain on the login page. Redirecting straight
 * to /login would loop, because the middleware sends signed-in users away from it.
 */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL("/login", request.url);
  if (user) {
    await supabase.auth.signOut();
    url.pathname = "/login/student";
    url.searchParams.set("error", "not-allowed");
  }

  return NextResponse.redirect(url);
}
