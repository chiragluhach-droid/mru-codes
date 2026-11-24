import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { attemptIsOpen, finalizeAttempt, findStudentExam } from "@/lib/exams-server";
import { DEFAULT_STARTER_CODE, isExamLanguage, type ExamLanguage } from "@/lib/exams";
import type { TestResult } from "@/lib/judge";
import { ExamRoom, type RoomAnswer, type RoomQuestion } from "@/components/exams/exam-room";

export default async function TakeExamPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "student") redirect("/teacher/dashboard");
  const { id } = await params;
  const access = await findStudentExam(profile, id);
  if ("error" in access) notFound();

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: profile.id } },
    include: { answers: true },
  });
  if (!attempt) redirect(`/student/exams/${id}`);
  if (!attemptIsOpen(attempt)) {
    if (attempt.status === "in_progress") await finalizeAttempt(attempt.id, { auto: true });
    redirect(`/student/exams/${id}`);
  }

  const questions = await prisma.examQuestion.findMany({
    where: { examId: id },
    orderBy: { position: "asc" },
    include: { testCases: { where: { isSample: true }, orderBy: { position: "asc" } } },
  });

  // Only what a student may see: no correct options, no hidden tests.
  const roomQuestions: RoomQuestion[] = questions.map((q) => {
    const base = { id: q.id, type: q.type, title: q.title, prompt: q.prompt, points: q.points };
    if (q.type === "mcq") {
      return {
        ...base,
        options: (q.options as Array<{ id: string; text: string }>) ?? [],
        multiple: Array.isArray(q.correctOptionIds) && q.correctOptionIds.length > 1,
      };
    }
    const languages = ((q.languages as string[]) ?? []).filter(isExamLanguage) as ExamLanguage[];
    const starter = (q.starterCode as Partial<Record<ExamLanguage, string>>) ?? {};
    return {
      ...base,
      languages,
      starterCode: Object.fromEntries(languages.map((l) => [l, starter[l] ?? DEFAULT_STARTER_CODE[l]])),
      samples: q.testCases.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
      timeLimitMs: q.timeLimitMs,
      memoryLimitMb: q.memoryLimitMb,
    };
  });

  const answers: Record<string, RoomAnswer> = {};
  for (const a of attempt.answers) {
    const results = Array.isArray(a.testResults) ? (a.testResults as unknown as TestResult[]) : null;
    answers[a.questionId] = {
      selectedOptionIds: Array.isArray(a.selectedOptionIds) ? (a.selectedOptionIds as string[]) : undefined,
      code: a.code ?? undefined,
      language: isExamLanguage(a.language) ? a.language : undefined,
      graded: results
        ? {
            passed: results.filter((r) => r.passed).length,
            total: results.length,
            ...(access.exam.showResults ? { score: a.score } : {}),
          }
        : undefined,
    };
  }

  return (
    <ExamRoom
      examId={id}
      title={access.exam.title}
      deadline={attempt.deadline.toISOString()}
      serverNow={new Date().toISOString()}
      showResults={access.exam.showResults}
      initialTabSwitches={attempt.tabSwitches}
      questions={roomQuestions}
      answers={answers}
    />
  );
}
