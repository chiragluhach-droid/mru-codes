import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { facultyName, isTeacherEmail, normalizeEmail } from "@/lib/faculty";

/**
 * First-time (or forgotten) password setup for faculty. There is no teacher
 * signup, so this creates the auth account on demand for emails on the faculty
 * list and then emails a password-set link to that inbox. Only the owner of the
 * faculty mailbox can finish the flow.
 */
export async function POST(request: Request) {
  let email = "";
  try {
    const body = await request.json();
    email = normalizeEmail(typeof body?.email === "string" ? body.email : "");
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!isTeacherEmail(email)) {
    return NextResponse.json(
      { error: "This email is not on the faculty list. Contact the admin to get access." },
      { status: 403 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey || !anonKey) {
    console.error("faculty-setup: Supabase env vars are not set");
    return NextResponse.json({ error: "Server is not configured" }, { status: 500 });
  }

  const authOptions = { auth: { persistSession: false, autoRefreshToken: false } };

  // Create the account if it doesn't exist yet. Already-registered is fine.
  const admin = createClient(url, serviceKey, authOptions);
  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: facultyName(email) ?? email.split("@")[0], role: "teacher" },
  });
  if (createError && createError.code !== "email_exists") {
    console.error("faculty-setup: createUser failed", createError);
    return NextResponse.json({ error: "Could not set up the account" }, { status: 500 });
  }

  // reset-password handles the implicit-flow tokens in the URL hash.
  const anon = createClient(url, anonKey, authOptions);
  const origin = new URL(request.url).origin;
  const { error: resetError } = await anon.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
  if (resetError) {
    console.error("faculty-setup: resetPasswordForEmail failed", resetError);
    const status = resetError.status === 429 ? 429 : 500;
    return NextResponse.json(
      {
        error:
          status === 429
            ? "Too many emails sent. Please wait a few minutes and try again."
            : "Could not send the email. Please try again.",
      },
      { status }
    );
  }

  return NextResponse.json({ ok: true });
}
