import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { parseClassTarget } from "@/lib/class-targeting";
import { examDetailsSchema } from "@/lib/exams";

// POST /api/exams - create a draft exam (teacher)
export async function POST(request: NextRequest) {
  const profile = await getProfile();
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const details = examDetailsSchema.safeParse(body);
  if (!details.success) {
    return NextResponse.json({ error: details.error.issues[0]?.message ?? "Invalid exam details" }, { status: 400 });
  }
  const target = parseClassTarget(body);
  if ("error" in target) return NextResponse.json({ error: target.error }, { status: 400 });

  const exam = await prisma.exam.create({
    data: {
      title: details.data.title!,
      instructions: details.data.instructions || null,
      durationMinutes: details.data.durationMinutes!,
      startsAt: details.data.startsAt!,
      endsAt: details.data.endsAt!,
      showResults: details.data.showResults ?? true,
      ...target.target,
      createdById: profile.id,
    },
  });
  return NextResponse.json({ exam }, { status: 201 });
}
