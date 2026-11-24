import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import { findStudentExam, startAttempt } from "@/lib/exams-server";

// POST /api/exams/[id]/start - start (or resume) the student's attempt
export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const access = await findStudentExam(profile, id);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });

  const started = await startAttempt(access.exam, profile.id);
  if ("error" in started) return NextResponse.json({ error: started.error }, { status: 400 });
  return NextResponse.json({ attempt: started.attempt });
}
