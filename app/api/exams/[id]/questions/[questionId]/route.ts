import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { parseQuestion } from "@/lib/exams";
import { examHasAttempts, findManageableExam } from "@/lib/exams-server";
import { questionColumns, testCaseRows } from "@/lib/exam-questions-server";

type Params = { params: Promise<{ id: string; questionId: string }> };

const LOCKED = "Students have started this exam, so its questions can't change";

async function load(request: NextRequest, params: Params["params"]) {
  const profile = await getProfile();
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id, questionId } = await params;
  const exam = await findManageableExam(profile, id);
  if (!exam) return { error: NextResponse.json({ error: "Exam not found" }, { status: 404 }) };
  const question = await prisma.examQuestion.findFirst({ where: { id: questionId, examId: id } });
  if (!question) return { error: NextResponse.json({ error: "Question not found" }, { status: 404 }) };
  if (await examHasAttempts(id)) return { error: NextResponse.json({ error: LOCKED }, { status: 409 }) };
  return { question };
}

// PATCH /api/exams/[id]/questions/[questionId] - replace a question and its test cases
export async function PATCH(request: NextRequest, { params }: Params) {
  const loaded = await load(request, params);
  if ("error" in loaded) return loaded.error;

  const parsed = parseQuestion(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid question" }, { status: 400 });
  }
  const columns = questionColumns(parsed.data);
  const question = await prisma.$transaction(async (tx) => {
    await tx.examTestCase.deleteMany({ where: { questionId: loaded.question.id } });
    return tx.examQuestion.update({
      where: { id: loaded.question.id },
      data: {
        ...columns,
        testCases: { create: testCaseRows(parsed.data) },
      },
      include: { testCases: { orderBy: { position: "asc" } } },
    });
  });
  return NextResponse.json({ question });
}

// DELETE /api/exams/[id]/questions/[questionId]
export async function DELETE(request: NextRequest, { params }: Params) {
  const loaded = await load(request, params);
  if ("error" in loaded) return loaded.error;
  await prisma.examQuestion.delete({ where: { id: loaded.question.id } });
  return NextResponse.json({ ok: true });
}
