import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { findManageableExam } from "@/lib/exams-server";
import { ExamBuilder } from "@/components/exams/exam-builder";
import type { EditableQuestion } from "@/components/exams/question-editor";

export default async function TeacherExamPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");

  const { id } = await params;
  const exam = await findManageableExam(profile, id);
  if (!exam) notFound();

  const [questions, attemptCount, submittedCount] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: id },
      orderBy: { position: "asc" },
      include: { testCases: { orderBy: { position: "asc" } } },
    }),
    prisma.examAttempt.count({ where: { examId: id } }),
    prisma.examAttempt.count({ where: { examId: id, status: "submitted" } }),
  ]);

  const editable: EditableQuestion[] = questions.map((q) => ({
    id: q.id,
    type: q.type,
    title: q.title,
    prompt: q.prompt,
    points: q.points,
    options: (q.options as EditableQuestion["options"]) ?? null,
    correctOptionIds: (q.correctOptionIds as string[] | null) ?? null,
    languages: (q.languages as EditableQuestion["languages"]) ?? null,
    starterCode: (q.starterCode as EditableQuestion["starterCode"]) ?? null,
    timeLimitMs: q.timeLimitMs,
    memoryLimitMb: q.memoryLimitMb,
    testCases: q.testCases.map((t) => ({
      input: t.input,
      expectedOutput: t.expectedOutput,
      isSample: t.isSample,
      weight: t.weight,
    })),
  }));

  return (
    <div className="space-y-6">
      <Link href="/teacher/exams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Exams
      </Link>
      <ExamBuilder
        exam={{
          id: exam.id,
          title: exam.title,
          instructions: exam.instructions,
          durationMinutes: exam.durationMinutes,
          startsAt: exam.startsAt.toISOString(),
          endsAt: exam.endsAt.toISOString(),
          showResults: exam.showResults,
          status: exam.status,
          targetDepartment: exam.targetDepartment,
          targetBatch: exam.targetBatch,
          targetSection: exam.targetSection,
          targetSemester: exam.targetSemester,
          attemptCount,
          submittedCount,
        }}
        questions={editable}
      />
    </div>
  );
}
