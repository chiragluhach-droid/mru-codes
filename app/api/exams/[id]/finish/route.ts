import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { finalizeAttempt, findStudentExam } from "@/lib/exams-server";

// POST /api/exams/[id]/finish - submit the exam (also used for the time-up auto submit)
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const access = await findStudentExam(profile, id);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const attempt = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: id, studentId: profile.id } },
  });
  if (!attempt) return NextResponse.json({ error: "You haven't started this exam" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const auto = body?.auto === true || Date.now() > attempt.deadline.getTime();
  const finished = await finalizeAttempt(attempt.id, { auto });
  return NextResponse.json({ ok: true, status: finished?.status });
}
