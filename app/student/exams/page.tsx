import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, CheckCircle2, ClipboardCheck, Code2, PlayCircle, Timer } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { classTargetWhere } from "@/lib/class-targeting";
import { finalizeExpiredAttempts } from "@/lib/exams-server";
import { examPhase, formatExamDate } from "@/lib/exams";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExamStatusBadge } from "@/components/exams/exam-badges";

export default async function StudentExamsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "student") redirect("/teacher/dashboard");

  await finalizeExpiredAttempts({ studentId: profile.id });
  const exams = await prisma.exam.findMany({
    where: { status: { in: ["published", "closed"] }, ...classTargetWhere(profile) },
    orderBy: { startsAt: "desc" },
    include: {
      questions: { select: { type: true, points: true } },
      attempts: { where: { studentId: profile.id }, select: { status: true, score: true, maxScore: true } },
    },
  });

  const groups = [
    { key: "live", title: "Live now", items: exams.filter((e) => e.status === "published" && examPhase(e) === "live") },
    { key: "upcoming", title: "Upcoming", items: exams.filter((e) => e.status === "published" && examPhase(e) === "upcoming") },
    { key: "past", title: "Past exams", items: exams.filter((e) => e.status === "closed" || examPhase(e) === "ended") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <ClipboardCheck className="h-8 w-8 text-primary" />
          Exams
        </h1>
        <p className="text-muted-foreground mt-1">Timed exams from your teachers, with coding and multiple-choice questions.</p>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No exams yet</p>
            <p className="text-sm text-muted-foreground">Exams assigned to your class will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <section key={group.key} className="space-y-3">
              <h2 className="text-lg font-semibold">{group.title}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((exam) => {
                  const attempt = exam.attempts[0];
                  const coding = exam.questions.filter((q) => q.type === "programming").length;
                  return (
                    <Link key={exam.id} href={`/student/exams/${exam.id}`} className="group">
                      <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md">
                        <CardContent className="flex h-full flex-col gap-4 p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold leading-snug group-hover:text-primary">{exam.title}</h3>
                            {attempt?.status === "submitted" ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" /> Submitted
                              </Badge>
                            ) : attempt ? (
                              <Badge className="gap-1 bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15">
                                <PlayCircle className="h-3 w-3" /> In progress
                              </Badge>
                            ) : (
                              <ExamStatusBadge exam={exam} />
                            )}
                          </div>
                          <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
                            <p className="flex items-center gap-2">
                              <CalendarClock className="h-4 w-4" />
                              {formatExamDate(exam.startsAt)} – {formatExamDate(exam.endsAt)}
                            </p>
                            <p className="flex items-center gap-2">
                              <Timer className="h-4 w-4" />
                              {exam.durationMinutes} min · {exam.questions.length} questions
                            </p>
                            <p className="flex items-center gap-2">
                              <Code2 className="h-4 w-4" />
                              {coding} coding · {exam.questions.length - coding} MCQ ·{" "}
                              {exam.questions.reduce((s, q) => s + q.points, 0)} points
                            </p>
                          </div>
                          {attempt?.status === "submitted" && exam.showResults && (
                            <p className="text-sm font-medium">
                              Score: {attempt.score} / {attempt.maxScore}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
