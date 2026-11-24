import { redirect } from "next/navigation";
import Link from "next/link";
import { CalendarClock, ClipboardCheck, Code2, ListChecks, Plus, Timer, Users } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { canEditDeleteAnyQuiz } from "@/lib/admin-teachers";
import { formatTarget } from "@/lib/departments";
import { formatExamDate } from "@/lib/exams";
import { ExamStatusBadge } from "@/components/exams/exam-badges";

export default async function TeacherExamsPage() {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");

  const isAdmin = canEditDeleteAnyQuiz(profile.email);
  const exams = await prisma.exam.findMany({
    where: isAdmin ? {} : { createdById: profile.id },
    orderBy: { startsAt: "desc" },
    include: {
      createdBy: { select: { fullName: true } },
      questions: { select: { type: true, points: true } },
      _count: { select: { attempts: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Exams
          </h1>
          <p className="text-muted-foreground mt-1">
            Timed exams with programming (C, C++, Java) and multiple-choice questions, graded automatically.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/exams/new">
            <Plus className="h-4 w-4 mr-2" />
            New exam
          </Link>
        </Button>
      </div>

      {exams.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium">No exams yet</p>
            <p className="text-sm text-muted-foreground">Create an exam, add questions, then publish it to a class.</p>
            <Button asChild className="mt-6">
              <Link href="/teacher/exams/new">
                <Plus className="h-4 w-4 mr-2" />
                Create your first exam
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((exam) => {
            const coding = exam.questions.filter((q) => q.type === "programming").length;
            const points = exam.questions.reduce((sum, q) => sum + q.points, 0);
            return (
              <Link key={exam.id} href={`/teacher/exams/${exam.id}`} className="group">
                <Card className="h-full transition-all group-hover:border-primary/40 group-hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold leading-snug group-hover:text-primary">{exam.title}</h2>
                      <ExamStatusBadge exam={exam} />
                    </div>
                    <p className="text-sm text-muted-foreground">{formatTarget(exam)}</p>
                    <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {formatExamDate(exam.startsAt)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Timer className="h-3.5 w-3.5" />
                        {exam.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Code2 className="h-3.5 w-3.5" />
                        {coding} coding · <ListChecks className="h-3.5 w-3.5" /> {exam.questions.length - coding} MCQ
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {exam._count.attempts} attempted · {points} pts
                      </span>
                    </div>
                    {isAdmin && exam.createdById !== profile.id && (
                      <p className="text-xs text-muted-foreground">By {exam.createdBy.fullName}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
