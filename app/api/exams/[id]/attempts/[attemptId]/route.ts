import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { finalizeAttempt, findManageableExam, regradeAttempt } from "@/lib/exams-server";

type Params = { params: Promise<{ id: string; attemptId: string }> };

async function load(params: Params["params"]) {
  const profile = await getProfile();
  if (!profile) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const { id, attemptId } = await params;
  if (!(await findManageableExam(profile, id))) {
    return { error: NextResponse.json({ error: "Exam not found" }, { status: 404 }) };
  }
  const attempt = await prisma.examAttempt.findFirst({ where: { id: attemptId, examId: id } });
  if (!attempt) return { error: NextResponse.json({ error: "Attempt not found" }, { status: 404 }) };
  return { attempt };
}

// POST /api/exams/[id]/attempts/[attemptId] - { action: "regrade" | "submit" }
export async function POST(request: NextRequest, { params }: Params) {
  const loaded = await load(params);
  if ("error" in loaded) return loaded.error;
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === "regrade") await regradeAttempt(loaded.attempt.id);
    else if (body?.action === "submit") await finalizeAttempt(loaded.attempt.id);
    else return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE /api/exams/[id]/attempts/[attemptId] - discard the attempt so the student can retake
export async function DELETE(_request: NextRequest, { params }: Params) {
  const loaded = await load(params);
  if ("error" in loaded) return loaded.error;
  await prisma.examAttempt.delete({ where: { id: loaded.attempt.id } });
  return NextResponse.json({ ok: true });
}
