import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { parseClassTarget } from "@/lib/class-targeting";
import { attemptDeadline, examDetailsSchema } from "@/lib/exams";
import { findManageableExam, publishProblems } from "@/lib/exams-server";

type Params = { params: Promise<{ id: string }> };

// PATCH /api/exams/[id] - update details and target class, or { status } to publish/close
export async function PATCH(request: NextRequest, { params }: Params) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exam = await findManageableExam(profile, id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  if (body.status !== undefined) {
    const status = body.status;
    if (status !== "draft" && status !== "published" && status !== "closed") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    if (status === "published") {
      const problems = await publishProblems(id);
      if (problems.length) return NextResponse.json({ error: problems.join(". ") }, { status: 400 });
    }
    if (status === "draft" && (await prisma.examAttempt.count({ where: { examId: id } })) > 0) {
      return NextResponse.json({ error: "Students have already started this exam" }, { status: 400 });
    }
    const updated = await prisma.exam.update({ where: { id }, data: { status } });
    return NextResponse.json({ exam: updated });
  }

  const details = examDetailsSchema.safeParse(body);
  if (!details.success) {
    return NextResponse.json({ error: details.error.issues[0]?.message ?? "Invalid exam details" }, { status: 400 });
  }
  const target = parseClassTarget(body);
  if ("error" in target) return NextResponse.json({ error: target.error }, { status: 400 });

  const updated = await prisma.exam.update({
    where: { id },
    data: {
      title: details.data.title!,
      instructions: details.data.instructions || null,
      durationMinutes: details.data.durationMinutes!,
      startsAt: details.data.startsAt!,
      endsAt: details.data.endsAt!,
      showResults: details.data.showResults ?? true,
      ...target.target,
    },
  });

  // Changing the duration or end time also moves deadlines of students mid-exam.
  const running = await prisma.examAttempt.findMany({
    where: { examId: id, status: "in_progress" },
    select: { id: true, startedAt: true, deadline: true },
  });
  for (const attempt of running) {
    const deadline = attemptDeadline(attempt.startedAt, updated.durationMinutes, updated.endsAt);
    if (deadline.getTime() !== attempt.deadline.getTime()) {
      await prisma.examAttempt.update({ where: { id: attempt.id }, data: { deadline } });
    }
  }
  return NextResponse.json({ exam: updated });
}

// DELETE /api/exams/[id] - delete the exam with its questions and attempts
export async function DELETE(_request: NextRequest, { params }: Params) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const exam = await findManageableExam(profile, id);
  if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  await prisma.exam.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
