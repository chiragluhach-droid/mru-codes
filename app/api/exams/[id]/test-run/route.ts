import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getProfile } from "@/lib/supabase/server";
import { EXAM_LANGUAGES } from "@/lib/exams";
import { findManageableExam } from "@/lib/exams-server";
import { judge } from "@/lib/judge";

type Params = { params: Promise<{ id: string }> };

const schema = z.object({
  language: z.enum(EXAM_LANGUAGES),
  code: z.string().min(1, "Write a solution first").max(50_000),
  timeLimitMs: z.coerce.number().int().min(500).max(10_000).default(2000),
  memoryLimitMb: z.coerce.number().int().min(32).max(512).default(128),
  testCases: z
    .array(z.object({ input: z.string().max(100_000), expectedOutput: z.string().max(100_000) }))
    .min(1, "Add a test case first")
    .max(50),
});

// POST /api/exams/[id]/test-run - teacher checks a reference solution against draft test cases
export async function POST(request: NextRequest, { params }: Params) {
  const profile = await getProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!(await findManageableExam(profile, id))) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }
  const { language, code, testCases, timeLimitMs, memoryLimitMb } = parsed.data;
  try {
    const results = await judge(
      language!,
      code!,
      testCases!.map((t, i) => ({ id: String(i), input: t.input!, expectedOutput: t.expectedOutput! })),
      { timeLimitMs: timeLimitMs!, memoryLimitMb: memoryLimitMb! }
    );
    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Code runner error" }, { status: 502 });
  }
}
