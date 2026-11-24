import { z } from "zod";

/** Shared by the exam pages and APIs (safe for the browser). */

export const EXAM_LANGUAGES = ["c", "cpp", "java"] as const;
export type ExamLanguage = (typeof EXAM_LANGUAGES)[number];

export const LANGUAGE_META: Record<ExamLanguage, { label: string; monaco: string; file: string }> = {
  c: { label: "C", monaco: "c", file: "main.c" },
  cpp: { label: "C++", monaco: "cpp", file: "main.cpp" },
  java: { label: "Java", monaco: "java", file: "Main.java" },
};

export const DEFAULT_STARTER_CODE: Record<ExamLanguage, string> = {
  c: `#include <stdio.h>

int main() {
    // Read input with scanf and print the answer with printf

    return 0;
}
`,
  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    // Read input with cin and print the answer with cout

    return 0;
}
`,
  java: `import java.util.*;

// The class must be called Main
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input with sc and print the answer with System.out.println

    }
}
`,
};

export function isExamLanguage(value: unknown): value is ExamLanguage {
  return typeof value === "string" && (EXAM_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Output comparison used for grading: line endings, trailing spaces on each
 * line and trailing blank lines don't matter.
 */
export function normalizeOutput(s: string) {
  return s
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

export const VERDICT_LABEL: Record<string, string> = {
  accepted: "Passed",
  wrong_answer: "Wrong answer",
  compile_error: "Compilation error",
  runtime_error: "Runtime error",
  time_limit: "Time limit exceeded",
  internal_error: "Runner error",
};

// ---- Validation -----------------------------------------------------------

export const examDetailsSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(150),
    instructions: z.string().trim().max(5000).optional().nullable(),
    durationMinutes: z.coerce.number().int().min(5, "At least 5 minutes").max(600, "At most 10 hours"),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    showResults: z.boolean().default(true),
  })
  .refine((d) => d.endsAt > d.startsAt, { message: "The exam must end after it starts", path: ["endsAt"] });

const optionSchema = z.object({
  id: z.string().min(1).max(40),
  text: z.string().trim().min(1, "Options can't be empty").max(1000),
});

const testCaseSchema = z.object({
  input: z.string().max(100_000),
  expectedOutput: z.string().max(100_000),
  isSample: z.boolean().default(false),
  weight: z.coerce.number().int().min(1).max(100).default(1),
});

const baseQuestion = {
  title: z.string().trim().min(1, "Title is required").max(200),
  prompt: z.string().trim().min(1, "Question text is required").max(20_000),
  points: z.coerce.number().int().min(1).max(1000),
};

const mcqObject = z.object({
  type: z.literal("mcq"),
  ...baseQuestion,
  options: z.array(optionSchema).min(2, "Add at least 2 options").max(10),
  correctOptionIds: z.array(z.string()).min(1, "Mark at least one correct option"),
});

export const mcqQuestionSchema = mcqObject.refine((q) => q.correctOptionIds.every((id) => q.options.some((o) => o.id === id)), {
    message: "Correct answer must be one of the options",
    path: ["correctOptionIds"],
  });

export const programmingQuestionSchema = z.object({
  type: z.literal("programming"),
  ...baseQuestion,
  languages: z.array(z.enum(EXAM_LANGUAGES)).min(1, "Allow at least one language"),
  starterCode: z.record(z.string(), z.string().max(20_000)).default({}),
  timeLimitMs: z.coerce.number().int().min(500).max(10_000).default(2000),
  memoryLimitMb: z.coerce.number().int().min(32).max(512).default(128),
  testCases: z.array(testCaseSchema).min(1, "Add at least one test case").max(50),
});

export const examQuestionSchema = z.discriminatedUnion("type", [mcqObject, programmingQuestionSchema]);
export type ExamQuestionInput = z.infer<typeof examQuestionSchema>;

/** Runs the MCQ refinement too (discriminatedUnion needs the plain object). */
export function parseQuestion(body: unknown) {
  const parsed = examQuestionSchema.safeParse(body);
  if (!parsed.success) return parsed;
  if (parsed.data.type === "mcq") return mcqQuestionSchema.safeParse(body);
  return parsed;
}

// ---- Scoring --------------------------------------------------------------

export function sameSelection(a: unknown, b: unknown) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  const set = new Set(b.map(String));
  return a.every((x) => set.has(String(x)));
}

/** MCQ: full points for exactly the correct set of options, otherwise 0. */
export function scoreMcq(points: number, correct: unknown, selected: unknown) {
  return sameSelection(correct, selected) ? points : 0;
}

/** Programming: points in proportion to the weight of passed tests. */
export function scoreTests(
  points: number,
  tests: Array<{ id: string; weight: number }>,
  results: Array<{ testCaseId: string; passed: boolean }>
) {
  const total = tests.reduce((sum, t) => sum + t.weight, 0);
  if (total === 0) return 0;
  const passed = new Set(results.filter((r) => r.passed).map((r) => r.testCaseId));
  const earned = tests.reduce((sum, t) => sum + (passed.has(t.id) ? t.weight : 0), 0);
  return Math.round(((points * earned) / total) * 100) / 100;
}

// ---- Timing ---------------------------------------------------------------

export type ExamPhase = "upcoming" | "live" | "ended";

export function examPhase(exam: { startsAt: Date | string; endsAt: Date | string }, now = new Date()): ExamPhase {
  if (now < new Date(exam.startsAt)) return "upcoming";
  if (now >= new Date(exam.endsAt)) return "ended";
  return "live";
}

/** Each attempt ends at start + duration, or when the exam window closes. */
export function attemptDeadline(startedAt: Date, durationMinutes: number, endsAt: Date) {
  return new Date(Math.min(startedAt.getTime() + durationMinutes * 60_000, endsAt.getTime()));
}

/** Answers saved within this long after the deadline still count (network lag). */
export const DEADLINE_GRACE_MS = 30_000;

/** Max Run/Submit presses per attempt, to protect the shared code runner. */
export const MAX_RUNS_PER_ATTEMPT = 400;

export function formatExamDate(value: Date | string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
}
