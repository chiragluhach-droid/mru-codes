import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isExamLanguage, scoreMcq } from "@/lib/exams";
import { loadOpenAttempt, loadQuestion } from "@/lib/exam-student-api";

// PUT /api/exams/[id]/answers - autosave one answer
// { questionId, selectedOptionIds } for MCQ, { questionId, code, language } for programming
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadOpenAttempt(id);
  if ("error" in loaded) return loaded.error;

  const body = await request.json().catch(() => null);
  const question = await loadQuestion(id, body?.questionId);
  if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

  let data: Prisma.ExamAnswerUncheckedCreateInput;
  if (question.type === "mcq") {
    const options = Array.isArray(question.options) ? (question.options as Array<{ id: string }>) : [];
    const selected: string[] = Array.isArray(body.selectedOptionIds)
      ? body.selectedOptionIds.filter((x: unknown) => typeof x === "string" && options.some((o) => o.id === x))
      : [];
    data = {
      attemptId: loaded.attempt.id,
      questionId: question.id,
      selectedOptionIds: selected,
      score: scoreMcq(question.points, question.correctOptionIds, selected),
    };
  } else {
    if (typeof body.code !== "string" || body.code.length > 50_000 || !isExamLanguage(body.language)) {
      return NextResponse.json({ error: "Invalid code" }, { status: 400 });
    }
    data = { attemptId: loaded.attempt.id, questionId: question.id, code: body.code, language: body.language };
  }

  const { attemptId, questionId, ...changes } = data;
  await prisma.examAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: data,
    update: changes,
  });
  return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
}
