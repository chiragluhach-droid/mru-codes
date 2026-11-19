import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { canEditDeleteAnyQuiz } from "@/lib/admin-teachers";

type ProfileLike = { id: string; email: string; role: string };

/** The teacher who created a module, or an admin teacher, may edit it. */
export function canManageModule(profile: ProfileLike, module: { createdById: string }) {
  return (
    profile.role === "teacher" &&
    (module.createdById === profile.id || canEditDeleteAnyQuiz(profile.email))
  );
}

/** Loads a module the current teacher may edit, or null. */
export async function findManageableModule(profile: ProfileLike, moduleId: string) {
  const learningModule = await prisma.learningModule.findUnique({ where: { id: moduleId } });
  if (!learningModule || !canManageModule(profile, learningModule)) return null;
  return learningModule;
}

const CREDENTIAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I

/** Short, unambiguous public ID for a badge, e.g. "CPH-7KQ2-M9XD". */
function newCredentialId() {
  const bytes = randomBytes(8);
  const chars = Array.from(bytes, (b) => CREDENTIAL_ALPHABET[b % CREDENTIAL_ALPHABET.length]);
  return `CPH-${chars.slice(0, 4).join("")}-${chars.slice(4).join("")}`;
}

/**
 * Awards the module badge once the student has completed every lesson.
 * Returns the badge when it was newly earned by this call, otherwise null.
 */
export async function awardBadgeIfComplete(moduleId: string, studentId: string) {
  const [lessonCount, completedCount, existing] = await Promise.all([
    prisma.moduleLesson.count({ where: { moduleId } }),
    prisma.lessonProgress.count({
      where: { studentId, isCompleted: true, lesson: { moduleId } },
    }),
    prisma.moduleBadge.findUnique({ where: { moduleId_studentId: { moduleId, studentId } } }),
  ]);

  if (existing || lessonCount === 0 || completedCount < lessonCount) return null;

  try {
    return await prisma.moduleBadge.create({
      data: { moduleId, studentId, credentialId: newCredentialId() },
    });
  } catch (error) {
    // A concurrent request may have awarded it first (unique module+student).
    console.error("awardBadgeIfComplete:", error);
    return null;
  }
}
