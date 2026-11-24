import type { Prisma } from "@prisma/client";
import type { ExamQuestionInput } from "@/lib/exams";

/** Column values for a validated question (test cases are written separately). */
export function questionColumns(q: ExamQuestionInput) {
  if (q.type === "mcq") {
    return {
      type: "mcq" as const,
      title: q.title!,
      prompt: q.prompt!,
      points: q.points!,
      options: q.options as unknown as Prisma.InputJsonValue,
      correctOptionIds: q.correctOptionIds as unknown as Prisma.InputJsonValue,
      languages: undefined,
      starterCode: undefined,
    };
  }
  // Keep starter code only for allowed languages.
  const starter: Record<string, string> = {};
  for (const lang of q.languages!) {
    const code = q.starterCode?.[lang];
    if (typeof code === "string" && code.trim()) starter[lang] = code;
  }
  return {
    type: "programming" as const,
    title: q.title!,
    prompt: q.prompt!,
    points: q.points!,
    options: undefined,
    correctOptionIds: undefined,
    languages: q.languages as unknown as Prisma.InputJsonValue,
    starterCode: starter as Prisma.InputJsonValue,
    timeLimitMs: q.timeLimitMs ?? 2000,
    memoryLimitMb: q.memoryLimitMb ?? 128,
  };
}

export function testCaseRows(q: ExamQuestionInput) {
  if (q.type !== "programming") return [];
  return q.testCases!.map((t, position) => ({
    position,
    input: t.input ?? "",
    expectedOutput: t.expectedOutput ?? "",
    isSample: t.isSample ?? false,
    weight: t.weight ?? 1,
  }));
}
