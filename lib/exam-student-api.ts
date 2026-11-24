import { NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { attemptIsOpen, finalizeAttempt, findStudentExam } from "@/lib/exams-server";

/**
 * For student exam APIs: the signed-in student's attempt, only while it is
 * still open. Time-up attempts are finalized here.
 */
export async function loadOpenAttempt(examId: string) {
  const profile = await getProfile();
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const access = await findStudentExam(profile, examId);
  if ("error" in access) return { error: NextResponse.json({ error: access.error }, { status: access.status }) };

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId, studentId: profile.id } },
  });
  if (!attempt) return { error: NextResponse.json({ error: "Start the exam first" }, { status: 400 }) };
  if (!attemptIsOpen(attempt)) {
    if (attempt.status === "in_progress") await finalizeAttempt(attempt.id, { auto: true });
    return { error: NextResponse.json({ error: "Time is up, your exam has been submitted", ended: true }, { status: 409 }) };
  }
  return { profile, exam: access.exam, attempt };
}

/** A question of this exam with its test cases. */
export function loadQuestion(examId: string, questionId: unknown) {
  if (typeof questionId !== "string") return null;
  return prisma.examQuestion.findFirst({
    where: { id: questionId, examId },
    include: { testCases: { orderBy: { position: "asc" } } },
  });
}
