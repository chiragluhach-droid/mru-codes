import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Sends a password-reset email. Done on the server with Supabase's implicit
 * flow so the link carries its own tokens and works on any device; the
 * browser (PKCE) flow only works in the browser that requested it.
 * Always answers the same way whether or not the account exists.
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const body = await request.json();
    email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, flowType: "implicit" },
  });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${new URL(request.url).origin}/reset-password`,
  });

  if (error) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "Too many reset emails were sent. Please wait a few minutes and try again." },
        { status: 429 }
      );
    }
    console.error("forgot-password:", error);
    return NextResponse.json({ error: "Could not send the email. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
