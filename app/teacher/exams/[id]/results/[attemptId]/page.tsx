import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, CheckCircle2, Circle, XCircle } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { finalizeExpiredAttempts, findManageableExam } from "@/lib/exams-server";
import { formatClass } from "@/lib/departments";
import { LANGUAGE_META, VERDICT_LABEL, formatExamDate, isExamLanguage } from "@/lib/exams";
import type { TestResult } from "@/lib/judge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CodeEditor } from "@/components/exams/code-editor";
import { Markdown } from "@/components/exams/markdown";
import { AttemptActions } from "@/components/exams/attempt-actions";

export default async function AttemptReviewPage({ params }: { params: Promise<{ id: string; attemptId: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");
  const { id, attemptId } = await params;
  if (!(await findManageableExam(profile, id))) notFound();

  await finalizeExpiredAttempts({ id: attemptId });
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, examId: id },
    include: {
      student: true,
      answers: true,
      exam: { include: { questions: { orderBy: { position: "asc" }, include: { testCases: { orderBy: { position: "asc" } } } } } },
    },
  });
  if (!attempt) notFound();
  const answers = new Map(attempt.answers.map((a) => [a.questionId, a]));
  const liveScore = attempt.answers.reduce((s, a) => s + a.score, 0);

  return (
    <div className="space-y-6">
      <Link href={`/teacher/exams/${id}/results`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        All results
      </Link>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{attempt.student.fullName}</h1>
            <p className="text-muted-foreground">
              {attempt.student.rollNumber ?? attempt.student.email} · {formatClass(attempt.student)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>Started {formatExamDate(attempt.startedAt)}</span>
              <span>
                {attempt.submittedAt
                  ? `${attempt.autoSubmitted ? "Auto-submitted" : "Submitted"} ${formatExamDate(attempt.submittedAt)}`
                  : "Still in progress"}
              </span>
              <span>{attempt.runCount} code runs</span>
              <span className={cn("inline-flex items-center gap-1", attempt.tabSwitches >= 3 && "text-destructive font-medium")}>
                {attempt.tabSwitches >= 3 && <AlertTriangle className="h-3.5 w-3.5" />}
                Left the exam tab {attempt.tabSwitches} time{attempt.tabSwitches === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-3xl font-bold tabular-nums">
              {attempt.status === "submitted" ? attempt.score : Math.round(liveScore * 100) / 100}
              <span className="text-lg font-normal text-muted-foreground"> / {attempt.maxScore}</span>
            </p>
            <AttemptActions
              examId={id}
              attemptId={attempt.id}
              inProgress={attempt.status === "in_progress"}
              studentName={attempt.student.fullName}
            />
          </div>
        </CardContent>
      </Card>

      {attempt.exam.questions.map((q, i) => {
        const answer = answers.get(q.id);
        const score = answer?.score ?? 0;
        return (
          <Card key={q.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <CardTitle className="text-base">
                Q{i + 1}. {q.title}
                <Badge variant="outline" className="ml-2 align-middle">
                  {q.type === "mcq" ? "MCQ" : "Programming"}
                </Badge>
              </CardTitle>
              <span
                className={cn(
                  "shrink-0 font-semibold tabular-nums",
                  score >= q.points ? "text-emerald-600" : score === 0 ? "text-destructive" : "text-amber-600"
                )}
              >
                {score} / {q.points}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <details className="rounded-md border bg-muted/30 p-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground">Question text</summary>
                <Markdown className="mt-3">{q.prompt}</Markdown>
              </details>

              {!answer ? (
                <p className="text-sm text-muted-foreground">Not answered.</p>
              ) : q.type === "mcq" ? (
                <ul className="space-y-2">
                  {((q.options as Array<{ id: string; text: string }>) ?? []).map((o) => {
                    const picked = ((answer.selectedOptionIds as string[]) ?? []).includes(o.id);
                    const right = ((q.correctOptionIds as string[]) ?? []).includes(o.id);
                    return (
                      <li
                        key={o.id}
                        className={cn(
                          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
                          right && "border-emerald-500/50 bg-emerald-500/5",
                          picked && !right && "border-destructive/50 bg-destructive/5"
                        )}
                      >
                        {picked ? (
                          right ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Circle className={cn("h-4 w-4", right ? "text-emerald-600" : "text-muted-foreground")} />
                        )}
                        <span className="flex-1">{o.text}</span>
                        {right && <span className="text-xs text-emerald-700 dark:text-emerald-400">Correct</span>}
                        {picked && <span className="text-xs text-muted-foreground">Chosen</span>}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary">
                      {isExamLanguage(answer.language) ? LANGUAGE_META[answer.language].label : answer.language}
                    </Badge>
                    {answer.code !== answer.gradedCode && (
                      <span className="text-xs text-amber-600">Final code differs from the last graded version. Use Re-grade.</span>
                    )}
                  </div>
                  <div className="h-[360px] overflow-hidden rounded-lg border">
                    <CodeEditor
                      language={isExamLanguage(answer.language) ? answer.language : "c"}
                      value={answer.code ?? ""}
                      readOnly
                    />
                  </div>
                  {Array.isArray(answer.testResults) && (
                    <div className="space-y-2">
                      {(answer.testResults as unknown as TestResult[]).map((r, ti) => {
                        const test = q.testCases.find((t) => t.id === r.testCaseId);
                        return (
                          <details key={r.testCaseId} className="rounded-md border text-sm">
                            <summary className="flex cursor-pointer items-center gap-2 px-3 py-2">
                              {r.passed ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              Test {ti + 1}
                              {test?.isSample ? " (sample)" : " (hidden)"}: {VERDICT_LABEL[r.verdict] ?? r.verdict}
                              {r.timeMs != null && <span className="ml-auto text-xs text-muted-foreground">{r.timeMs} ms</span>}
                            </summary>
                            <div className="grid gap-3 border-t p-3 sm:grid-cols-3">
                              {[
                                ["Input", test?.input ?? ""],
                                ["Expected", test?.expectedOutput ?? ""],
                                [r.error ? "Error" : "Output", r.error || r.stdout],
                              ].map(([label, value]) => (
                                <div key={label}>
                                  <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">{value || " "}</pre>
                                </div>
                              ))}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
