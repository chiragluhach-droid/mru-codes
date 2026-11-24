import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { canEditDeleteAnyQuiz } from "@/lib/admin-teachers";
import { hasClassAccess } from "@/lib/class-targeting";
import { judge, type TestResult } from "@/lib/judge";
import {
  DEADLINE_GRACE_MS,
  attemptDeadline,
  examPhase,
  isExamLanguage,
  scoreMcq,
  scoreTests,
} from "@/lib/exams";

type ProfileLike = {
  id: string;
  email: string;
  role: string;
  department: string | null;
  batch: string | null;
  section: string | null;
  semester: number | null;
};

// ---- Teachers -------------------------------------------------------------

/** The teacher who created an exam, or an admin teacher, may manage it. */
export function canManageExam(profile: { id: string; email: string; role: string }, exam: { createdById: string }) {
  return profile.role === "teacher" && (exam.createdById === profile.id || canEditDeleteAnyQuiz(profile.email));
}

export async function findManageableExam(profile: { id: string; email: string; role: string }, examId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || !canManageExam(profile, exam)) return null;
  return exam;
}

/** Questions can't change once a student has started, or scores would be unfair. */
export async function examHasAttempts(examId: string) {
  return (await prisma.examAttempt.count({ where: { examId } })) > 0;
}

/** Problems that stop an exam from being published, or [] when it's ready. */
export async function publishProblems(examId: string) {
  const questions = await prisma.examQuestion.findMany({
    where: { examId },
    include: { _count: { select: { testCases: true } } },
  });
  const problems: string[] = [];
  if (questions.length === 0) problems.push("Add at least one question");
  for (const q of questions) {
    if (q.type === "programming" && q._count.testCases === 0) {
      problems.push(`"${q.title}" has no test cases`);
    }
  }
  return problems;
}

// ---- Students -------------------------------------------------------------

export type StudentExamAccess =
  | { exam: Prisma.ExamGetPayload<object> }
  | { status: number; error: string };

/** A published exam targeted at this student's class. */
export async function findStudentExam(profile: ProfileLike, examId: string): Promise<StudentExamAccess> {
  if (profile.role !== "student") return { status: 403, error: "Only students can take exams" };
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam || exam.status === "draft" || !hasClassAccess(exam, profile)) {
    return { status: 404, error: "Exam not found" };
  }
  return { exam };
}

/** Starts (or resumes) the student's attempt while the exam is live. */
export async function startAttempt(exam: { id: string; startsAt: Date; endsAt: Date; durationMinutes: number; status: string }, studentId: string) {
  const existing = await prisma.examAttempt.findUnique({
    where: { examId_studentId: { examId: exam.id, studentId } },
  });
  if (existing) return { attempt: existing };
  if (exam.status !== "published" || examPhase(exam) !== "live") {
    return { error: examPhase(exam) === "upcoming" ? "The exam hasn't started yet" : "The exam has ended" };
  }

  const questions = await prisma.examQuestion.findMany({ where: { examId: exam.id }, select: { points: true } });
  const now = new Date();
  try {
    const attempt = await prisma.examAttempt.create({
      data: {
        examId: exam.id,
        studentId,
        startedAt: now,
        deadline: attemptDeadline(now, exam.durationMinutes, exam.endsAt),
        maxScore: questions.reduce((sum, q) => sum + q.points, 0),
      },
    });
    return { attempt };
  } catch {
    // Two tabs pressed Start at once: the unique index kept one attempt.
    const attempt = await prisma.examAttempt.findUniqueOrThrow({
      where: { examId_studentId: { examId: exam.id, studentId } },
    });
    return { attempt };
  }
}

/** Whether the attempt still accepts answers (deadline + network grace). */
export function attemptIsOpen(attempt: { status: string; deadline: Date }, now = new Date()) {
  return attempt.status === "in_progress" && now.getTime() <= attempt.deadline.getTime() + DEADLINE_GRACE_MS;
}

// ---- Grading --------------------------------------------------------------

type QuestionWithTests = Prisma.ExamQuestionGetPayload<{ include: { testCases: true } }>;

/** Runs code against every test of a question and returns score + results. */
export async function gradeCode(question: QuestionWithTests, language: string, code: string) {
  const allowed = Array.isArray(question.languages) ? (question.languages as string[]) : [];
  if (!isExamLanguage(language) || !allowed.includes(language)) {
    throw new Error("That language isn't allowed for this question");
  }
  const tests = [...question.testCases].sort((a, b) => a.position - b.position);
  const results = await judge(
    language,
    code,
    tests.map((t) => ({ id: t.id, input: t.input, expectedOutput: t.expectedOutput })),
    { timeLimitMs: question.timeLimitMs, memoryLimitMb: question.memoryLimitMb }
  );
  return { score: scoreTests(question.points, tests, results), results };
}

/** What a student may see of graded results: hidden tests show only the verdict. */
export function studentTestResults(question: QuestionWithTests, results: TestResult[]) {
  const byId = new Map(question.testCases.map((t) => [t.id, t]));
  return results.map((r, index) => {
    const test = byId.get(r.testCaseId);
    const sample = test?.isSample ?? false;
    return {
      index: index + 1,
      sample,
      passed: r.passed,
      verdict: r.verdict,
      timeMs: r.timeMs,
      ...(sample && test
        ? { input: test.input, expectedOutput: test.expectedOutput, output: r.stdout, error: r.error }
        : { error: r.verdict === "compile_error" ? r.error : "" }),
    };
  });
}

/**
 * Closes an attempt: grades code changed since its last graded submit, then
 * totals the score. Safe to call more than once.
 */
export async function finalizeAttempt(attemptId: string, { auto = false } = {}) {
  const attempt = await prisma.examAttempt.findUnique({
    where: { id: attemptId },
    include: {
      answers: true,
      exam: { include: { questions: { include: { testCases: true } } } },
    },
  });
  if (!attempt) return null;
  if (attempt.status === "submitted") return attempt;

  const questions = new Map(attempt.exam.questions.map((q) => [q.id, q]));
  for (const answer of attempt.answers) {
    const question = questions.get(answer.questionId);
    if (!question) continue;
    if (question.type === "mcq") {
      const score = scoreMcq(question.points, question.correctOptionIds, answer.selectedOptionIds);
      if (score !== answer.score) await prisma.examAnswer.update({ where: { id: answer.id }, data: { score } });
      continue;
    }
    const stale =
      answer.code?.trim() &&
      answer.language &&
      (answer.code !== answer.gradedCode || answer.language !== answer.gradedLanguage);
    if (!stale) continue;
    try {
      const { score, results } = await gradeCode(question, answer.language!, answer.code!);
      await prisma.examAnswer.update({
        where: { id: answer.id },
        data: {
          score,
          testResults: results as unknown as Prisma.InputJsonValue,
          gradedCode: answer.code,
          gradedLanguage: answer.language,
          gradedAt: new Date(),
        },
      });
    } catch (err) {
      // Keep the last graded score; the teacher can re-grade from results.
      console.error("Exam grading failed", answer.id, err);
    }
  }

  const answers = await prisma.examAnswer.findMany({ where: { attemptId }, select: { score: true } });
  const score = Math.round(answers.reduce((sum, a) => sum + a.score, 0) * 100) / 100;
  // Only the first finalize wins if two requests race.
  await prisma.examAttempt.updateMany({
    where: { id: attemptId, status: "in_progress" },
    data: {
      status: "submitted",
      submittedAt: auto ? attempt.deadline : new Date(),
      autoSubmitted: auto,
      score,
      maxScore: attempt.exam.questions.reduce((sum, q) => sum + q.points, 0),
    },
  });
  return prisma.examAttempt.findUnique({ where: { id: attemptId } });
}

/** Finalizes attempts whose time ran out without the student pressing Finish. */
export async function finalizeExpiredAttempts(where: Prisma.ExamAttemptWhereInput) {
  const expired = await prisma.examAttempt.findMany({
    where: {
      ...where,
      status: "in_progress",
      deadline: { lt: new Date(Date.now() - DEADLINE_GRACE_MS) },
    },
    select: { id: true },
  });
  for (const { id } of expired) await finalizeAttempt(id, { auto: true });
  return expired.length;
}

/** Students the exam is assigned to (its target class). */
export function targetedStudentsWhere(exam: {
  targetDepartment: string | null;
  targetBatch: string | null;
  targetSection: string | null;
  targetSemester: number | null;
}): Prisma.ProfileWhereInput {
  return {
    role: "student",
    ...(exam.targetDepartment ? { department: exam.targetDepartment } : {}),
    ...(exam.targetBatch ? { batch: exam.targetBatch } : {}),
    ...(exam.targetSection ? { section: exam.targetSection } : {}),
    ...(exam.targetSemester ? { semester: exam.targetSemester } : {}),
  };
}

export interface ExamResultRow {
  studentId: string;
  fullName: string;
  email: string;
  rollNumber: string | null;
  department: string | null;
  batch: string | null;
  section: string | null;
  semester: number | null;
  attemptId: string | null;
  status: "absent" | "in_progress" | "submitted";
  autoSubmitted: boolean;
  score: number;
  maxScore: number;
  /** questionId -> score (null when not answered) */
  questionScores: Record<string, number | null>;
  tabSwitches: number;
  startedAt: Date | null;
  submittedAt: Date | null;
}

/**
 * One row per targeted student (absent ones included) plus anyone else who
 * attempted, best score first. Finalizes attempts whose time ran out.
 */
export async function examResults(examId: string) {
  await finalizeExpiredAttempts({ examId });
  const exam = await prisma.exam.findUniqueOrThrow({
    where: { id: examId },
    include: { questions: { orderBy: { position: "asc" }, select: { id: true, title: true, type: true, points: true } } },
  });
  const maxScore = exam.questions.reduce((sum, q) => sum + q.points, 0);
  const studentSelect = {
    id: true, fullName: true, email: true, rollNumber: true,
    department: true, batch: true, section: true, semester: true,
  } as const;

  const [attempts, targeted] = await Promise.all([
    prisma.examAttempt.findMany({
      where: { examId },
      include: { student: { select: studentSelect }, answers: { select: { questionId: true, score: true } } },
    }),
    prisma.profile.findMany({ where: targetedStudentsWhere(exam), select: studentSelect }),
  ]);

  const rows: ExamResultRow[] = attempts.map((a) => {
    const scores: Record<string, number | null> = {};
    for (const q of exam.questions) scores[q.id] = null;
    for (const ans of a.answers) scores[ans.questionId] = ans.score;
    return {
      studentId: a.student.id,
      fullName: a.student.fullName,
      email: a.student.email,
      rollNumber: a.student.rollNumber,
      department: a.student.department,
      batch: a.student.batch,
      section: a.student.section,
      semester: a.student.semester,
      attemptId: a.id,
      status: a.status,
      autoSubmitted: a.autoSubmitted,
      score: a.status === "submitted" ? a.score : Object.values(scores).reduce<number>((s, v) => s + (v ?? 0), 0),
      maxScore,
      questionScores: scores,
      tabSwitches: a.tabSwitches,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
    };
  });
  const attempted = new Set(attempts.map((a) => a.studentId));
  for (const s of targeted) {
    if (attempted.has(s.id)) continue;
    rows.push({
      studentId: s.id, fullName: s.fullName, email: s.email, rollNumber: s.rollNumber,
      department: s.department, batch: s.batch, section: s.section, semester: s.semester,
      attemptId: null, status: "absent", autoSubmitted: false, score: 0, maxScore,
      questionScores: Object.fromEntries(exam.questions.map((q) => [q.id, null])),
      tabSwitches: 0, startedAt: null, submittedAt: null,
    });
  }

  const order = { submitted: 0, in_progress: 1, absent: 2 };
  rows.sort(
    (a, b) =>
      order[a.status] - order[b.status] ||
      b.score - a.score ||
      (a.rollNumber ?? a.fullName).localeCompare(b.rollNumber ?? b.fullName)
  );
  return { exam, questions: exam.questions, rows, maxScore };
}

/** Re-runs every code answer of an attempt (e.g. after fixing a test case). */
export async function regradeAttempt(attemptId: string) {
  const attempt = await prisma.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    include: { answers: true, exam: { include: { questions: { include: { testCases: true } } } } },
  });
  const questions = new Map(attempt.exam.questions.map((q) => [q.id, q]));
  for (const answer of attempt.answers) {
    const question = questions.get(answer.questionId);
    if (!question) continue;
    if (question.type === "mcq") {
      const score = scoreMcq(question.points, question.correctOptionIds, answer.selectedOptionIds);
      await prisma.examAnswer.update({ where: { id: answer.id }, data: { score } });
    } else if (answer.code?.trim() && answer.language) {
      const { score, results } = await gradeCode(question, answer.language, answer.code);
      await prisma.examAnswer.update({
        where: { id: answer.id },
        data: {
          score,
          testResults: results as unknown as Prisma.InputJsonValue,
          gradedCode: answer.code,
          gradedLanguage: answer.language,
          gradedAt: new Date(),
        },
      });
    }
  }
  if (attempt.status === "submitted") {
    const answers = await prisma.examAnswer.findMany({ where: { attemptId }, select: { score: true } });
    await prisma.examAttempt.update({
      where: { id: attemptId },
      data: {
        score: Math.round(answers.reduce((s, a) => s + a.score, 0) * 100) / 100,
        maxScore: attempt.exam.questions.reduce((s, q) => s + q.points, 0),
      },
    });
  }
}
