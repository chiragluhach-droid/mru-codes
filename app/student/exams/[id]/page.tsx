import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Code2, ListChecks, Timer, XCircle } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { attemptIsOpen, finalizeExpiredAttempts, findStudentExam } from "@/lib/exams-server";
import { examPhase, formatExamDate } from "@/lib/exams";
import type { TestResult } from "@/lib/judge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/exams/markdown";
import { StartExamButton } from "@/components/exams/start-exam-button";

export default async function StudentExamPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "student") redirect("/teacher/dashboard");
  const { id } = await params;
  const access = await findStudentExam(profile, id);
  if ("error" in access) notFound();
  const exam = access.exam;

  await finalizeExpiredAttempts({ examId: id, studentId: profile.id });
  const [questions, attempt] = await Promise.all([
    prisma.examQuestion.findMany({
      where: { examId: id },
      orderBy: { position: "asc" },
      select: { id: true, title: true, type: true, points: true },
    }),
    prisma.examAttempt.findUnique({
      where: { examId_studentId: { examId: id, studentId: profile.id } },
      include: { answers: true },
    }),
  ]);
  const phase = examPhase(exam);
  const totalPoints = questions.reduce((s, q) => s + q.points, 0);
  const coding = questions.filter((q) => q.type === "programming").length;
  const canStart = exam.status === "published" && phase === "live" && !attempt;
  const canResume = attempt && attemptIsOpen(attempt);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/student/exams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Exams
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: Timer, label: "Duration", value: `${exam.durationMinutes} minutes` },
              { icon: Code2, label: "Questions", value: `${coding} coding · ${questions.length - coding} MCQ` },
              { icon: ListChecks, label: "Total", value: `${totalPoints} points` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 rounded-lg border p-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarClock className="h-4 w-4" />
            Open {formatExamDate(exam.startsAt)} to {formatExamDate(exam.endsAt)}
          </p>

          {attempt?.status === "submitted" ? (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-5">
              <p className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
                {attempt.autoSubmitted ? "Time ran out, so your exam was submitted automatically." : "You've submitted this exam."}
              </p>
              {exam.showResults ? (
                <p className="mt-2 text-3xl font-bold tabular-nums">
                  {attempt.score} <span className="text-lg font-normal text-muted-foreground">/ {attempt.maxScore}</span>
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">Your teacher will share the results.</p>
              )}
            </div>
          ) : canResume ? (
            <div className="space-y-4">
              <p className="rounded-lg border border-sky-500/40 bg-sky-500/5 p-4 text-sm">
                Your exam is in progress. Your answers are saved; the timer kept running while you were away.
              </p>
              <StartExamButton examId={id} resume />
            </div>
          ) : canStart ? (
            <div className="space-y-4">
              {exam.instructions && (
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="mb-2 text-sm font-semibold">Instructions</p>
                  <Markdown>{exam.instructions}</Markdown>
                </div>
              )}
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• The timer starts when you press Start and can&apos;t be paused.</li>
                <li>• Leaving the exam tab is recorded and visible to your teacher.</li>
                <li>• Programming answers: press <b>Run</b> to test on samples, <b>Submit</b> to grade on all tests.</li>
              </ul>
              <StartExamButton examId={id} resume={false} />
            </div>
          ) : phase === "upcoming" && exam.status === "published" ? (
            <p className="rounded-lg border p-4 text-sm">This exam opens on {formatExamDate(exam.startsAt)}. Come back then to start.</p>
          ) : (
            <p className="rounded-lg border p-4 text-sm text-muted-foreground">
              This exam has ended{attempt ? "" : " and you didn't attempt it"}.
            </p>
          )}
        </CardContent>
      </Card>

      {attempt?.status === "submitted" && exam.showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {questions.map((q, i) => {
              const answer = attempt.answers.find((a) => a.questionId === q.id);
              const results = Array.isArray(answer?.testResults) ? (answer!.testResults as unknown as TestResult[]) : null;
              const score = answer?.score ?? 0;
              return (
                <div key={q.id} className="flex items-center gap-3 rounded-lg border p-3">
                  {score >= q.points ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle className={cn("h-5 w-5 shrink-0", score > 0 ? "text-amber-500" : "text-destructive")} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Q{i + 1}. {q.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {!answer
                        ? "Not answered"
                        : q.type === "programming"
                          ? results
                            ? `${results.filter((r) => r.passed).length} of ${results.length} test cases passed`
                            : "Not graded"
                          : score > 0
                            ? "Correct"
                            : "Incorrect"}
                    </p>
                  </div>
                  <Badge variant="outline" className="tabular-nums">
                    {score} / {q.points}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
