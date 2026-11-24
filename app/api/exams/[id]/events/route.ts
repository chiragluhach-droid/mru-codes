import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { loadOpenAttempt } from "@/lib/exam-student-api";

// POST /api/exams/[id]/events - { type: "tab_switch" } when the student leaves the exam tab
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const loaded = await loadOpenAttempt(id);
  if ("error" in loaded) return loaded.error;
  const body = await request.json().catch(() => null);
  if (body?.type !== "tab_switch") return NextResponse.json({ error: "Unknown event" }, { status: 400 });

  const attempt = await prisma.examAttempt.update({
    where: { id: loaded.attempt.id },
    data: { tabSwitches: { increment: 1 } },
    select: { tabSwitches: true },
  });
  return NextResponse.json({ tabSwitches: attempt.tabSwitches });
}
