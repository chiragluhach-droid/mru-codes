import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { MAX_RUNS_PER_ATTEMPT } from "@/lib/exams";
import { gradeCode, studentTestResults } from "@/lib/exams-server";
import { loadOpenAttempt, loadQuestion } from "@/lib/exam-student-api";

// POST /api/exams/[id]/submit-code - grade code against every test (sample + hidden)
// { questionId, code, language }. Can be repeated; the latest submit counts.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadOpenAttempt(id);
  if ("error" in loaded) return loaded.error;

  const body = await request.json().catch(() => null);
  const question = await loadQuestion(id, body?.questionId);
  if (!question || question.type !== "programming") {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  if (typeof body.code !== "string" || !body.code.trim() || body.code.length > 50_000) {
    return NextResponse.json({ error: "Write some code first" }, { status: 400 });
  }

  const counted = await prisma.examAttempt.updateMany({
    where: { id: loaded.attempt.id, runCount: { lt: MAX_RUNS_PER_ATTEMPT } },
    data: { runCount: { increment: 1 } },
  });
  if (counted.count === 0) {
    return NextResponse.json({ error: "You've used all your runs for this exam" }, { status: 429 });
  }

  let graded;
  try {
    graded = await gradeCode(question, body.language, body.code);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Code runner error" }, { status: 502 });
  }

  const results = graded.results as unknown as Prisma.InputJsonValue;
  const values = {
    code: body.code,
    language: body.language,
    score: graded.score,
    testResults: results,
    gradedCode: body.code,
    gradedLanguage: body.language,
    gradedAt: new Date(),
  };
  await prisma.examAnswer.upsert({
    where: { attemptId_questionId: { attemptId: loaded.attempt.id, questionId: question.id } },
    create: { attemptId: loaded.attempt.id, questionId: question.id, ...values },
    update: values,
  });

  const passed = graded.results.filter((r) => r.passed).length;
  return NextResponse.json({
    passed,
    total: graded.results.length,
    // Students see points only if the exam shows results.
    ...(loaded.exam.showResults ? { score: graded.score, points: question.points } : {}),
    results: studentTestResults(question, graded.results),
  });
}
