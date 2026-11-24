import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { MAX_RUNS_PER_ATTEMPT, isExamLanguage } from "@/lib/exams";
import { execute, judge } from "@/lib/judge";
import { loadOpenAttempt, loadQuestion } from "@/lib/exam-student-api";

// POST /api/exams/[id]/run - run code on the sample tests, or on custom input
// { questionId, code, language, customInput? }. Not graded.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadOpenAttempt(id);
  if ("error" in loaded) return loaded.error;

  const body = await request.json().catch(() => null);
  const question = await loadQuestion(id, body?.questionId);
  if (!question || question.type !== "programming") {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }
  const allowed = Array.isArray(question.languages) ? (question.languages as string[]) : [];
  if (typeof body.code !== "string" || !body.code.trim() || body.code.length > 50_000) {
    return NextResponse.json({ error: "Write some code first" }, { status: 400 });
  }
  if (!isExamLanguage(body.language) || !allowed.includes(body.language)) {
    return NextResponse.json({ error: "That language isn't allowed for this question" }, { status: 400 });
  }

  const counted = await prisma.examAttempt.updateMany({
    where: { id: loaded.attempt.id, runCount: { lt: MAX_RUNS_PER_ATTEMPT } },
    data: { runCount: { increment: 1 } },
  });
  if (counted.count === 0) {
    return NextResponse.json({ error: "You've used all your runs for this exam" }, { status: 429 });
  }
  // Running also saves the code, so nothing is lost if the tab closes.
  await prisma.examAnswer.upsert({
    where: { attemptId_questionId: { attemptId: loaded.attempt.id, questionId: question.id } },
    create: { attemptId: loaded.attempt.id, questionId: question.id, code: body.code, language: body.language },
    update: { code: body.code, language: body.language },
  });

  const limits = { timeLimitMs: question.timeLimitMs, memoryLimitMb: question.memoryLimitMb };
  try {
    if (typeof body.customInput === "string") {
      const r = await execute(body.language, body.code, body.customInput.slice(0, 100_000), limits);
      return NextResponse.json({
        mode: "custom",
        verdict: r.verdict,
        output: r.stdout.slice(0, 20_000),
        error: (r.verdict === "compile_error" ? r.compileOutput : r.stderr || (r.verdict === "accepted" ? "" : r.message)).slice(0, 5000),
        timeMs: r.timeMs,
      });
    }

    const samples = question.testCases.filter((t) => t.isSample);
    if (samples.length === 0) {
      return NextResponse.json({ error: "This question has no sample tests. Use custom input." }, { status: 400 });
    }
    const results = await judge(
      body.language,
      body.code,
      samples.map((t) => ({ id: t.id, input: t.input, expectedOutput: t.expectedOutput })),
      limits
    );
    return NextResponse.json({
      mode: "samples",
      results: results.map((r, i) => ({
        index: i + 1,
        passed: r.passed,
        verdict: r.verdict,
        timeMs: r.timeMs,
        input: samples[i].input,
        expectedOutput: samples[i].expectedOutput,
        output: r.stdout,
        error: r.error,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Code runner error" }, { status: 502 });
  }
}
