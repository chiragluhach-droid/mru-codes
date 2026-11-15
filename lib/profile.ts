import prisma from "@/lib/prisma";
import type { User } from "@supabase/supabase-js";
import { facultyName, roleForEmail } from "@/lib/faculty";
import { normalizeBatchSection } from "@/lib/departments";
import { isAllowedStudentEmail } from "@/lib/student-allowlist";

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getNameFromMetadata(meta: Record<string, unknown> | null | undefined, email?: string | null) {
  return (
    pickString(meta?.full_name) ||
    pickString(meta?.fullName) ||
    (email ? email.split("@")[0] : null) ||
    "User"
  );
}

/**
 * Returns the user's profile, creating it on first login. Returns null when a
 * new student is not on the 2026-batch list: they cannot get an account, even
 * if they created an auth user by calling Supabase directly. Students who
 * already have a profile keep it.
 */
export async function getOrCreateProfileForSupabaseUser(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const email = user.email ?? "";
  const fullName = facultyName(email) || getNameFromMetadata(meta, user.email);
  const rollNumber = pickString(meta?.roll_number) || pickString(meta?.rollNumber);
  const department = pickString(meta?.department);
  const section = pickString(meta?.section) ? normalizeBatchSection(pickString(meta?.section)) : null;
  // The role is never taken from signup metadata: only emails on the faculty
  // list are teachers (see lib/faculty.ts).
  const role = roleForEmail(email);

  if (role === "student" && !isAllowedStudentEmail(email)) {
    const existing = await prisma.profile.findUnique({ where: { id: user.id } });
    if (!existing) return null;
  }

  return prisma.profile.upsert({
    where: { id: user.id },
    // Signup metadata only seeds a new profile. After that the profile row is
    // the source of truth (edited via PATCH /api/profile/me), so only the auth
    // email (and the allowlist-derived role) is kept in sync — re-applying
    // metadata would undo Settings changes.
    update: {
      email,
      role,
    },
    create: {
      id: user.id,
      email,
      fullName,
      rollNumber,
      department,
      section,
      role,
    },
  });
}


