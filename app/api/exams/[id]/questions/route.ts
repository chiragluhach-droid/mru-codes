import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { parseQuestion } from "@/lib/exams";
import { examHasAttempts, findManageableExam } from "@/lib/exams-server";
import { questionColumns, testCaseRows } from "@/lib/exam-questions-server";

type Params = { params: Promise<{ id: string }> };

const LOCKED = "Students have started this exam, so its questions can't change";

// POST /api/exams/[id]/questions - add a question
export async function POST(request: NextRequest, { params }: Params) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exam = await findManageableExam(profile, id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  if (await examHasAttempts(id)) return NextResponse.json({ error: LOCKED }, { status: 409 });

  const parsed = parseQuestion(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid question" }, { status: 400 });
  }

  const last = await prisma.examQuestion.findFirst({
    where: { examId: id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const question = await prisma.examQuestion.create({
    data: {
      examId: id,
      position: (last?.position ?? -1) + 1,
      ...questionColumns(parsed.data),
      testCases: { create: testCaseRows(parsed.data) },
    },
    include: { testCases: { orderBy: { position: "asc" } } },
  });
  return NextResponse.json({ question }, { status: 201 });
}

// PUT /api/exams/[id]/questions - reorder: { order: [questionId, ...] }
export async function PUT(request: NextRequest, { params }: Params) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exam = await findManageableExam(profile, id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  if (await examHasAttempts(id)) return NextResponse.json({ error: LOCKED }, { status: 409 });

  const body = await request.json().catch(() => null);
  const order: unknown = body?.order;
  const existing = await prisma.examQuestion.findMany({ where: { examId: id }, select: { id: true } });
  if (
    !Array.isArray(order) ||
    order.length !== existing.length ||
    !existing.every((q) => order.includes(q.id))
  ) {
    return NextResponse.json({ error: "Order must list every question once" }, { status: 400 });
  }
  await prisma.$transaction(
    (order as string[]).map((questionId, position) =>
      prisma.examQuestion.update({ where: { id: questionId }, data: { position } })
    )
  );
  return NextResponse.json({ ok: true });
}
