import prisma from "@/lib/prisma";
import type { User } from "@supabase/supabase-js";

function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function getRoleFromMetadata(meta: Record<string, unknown> | null | undefined) {
  const raw = pickString(meta?.role);
  return raw === "teacher" || raw === "student" ? raw : "student";
}

function getNameFromMetadata(meta: Record<string, unknown> | null | undefined, email?: string | null) {
  return (
    pickString(meta?.full_name) ||
    pickString(meta?.fullName) ||
    (email ? email.split("@")[0] : null) ||
    "User"
  );
}

export async function getOrCreateProfileForSupabaseUser(user: User) {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;

  const email = user.email ?? "";
  const fullName = getNameFromMetadata(meta, user.email);
  const rollNumber = pickString(meta?.roll_number) || pickString(meta?.rollNumber);
  const department = pickString(meta?.department);
  const section = pickString(meta?.section);
  const role = getRoleFromMetadata(meta);

  return prisma.profile.upsert({
    where: { id: user.id },
    // Signup metadata only seeds a new profile. After that the profile row is
    // the source of truth (edited via PATCH /api/profile/me), so only the auth
    // email is kept in sync — re-applying metadata would undo Settings changes.
    update: {
      email,
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


