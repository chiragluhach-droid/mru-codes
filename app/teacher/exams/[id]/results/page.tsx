import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { examResults, findManageableExam } from "@/lib/exams-server";
import { formatTarget } from "@/lib/departments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExamStatusBadge } from "@/components/exams/exam-badges";
import { ResultsTable } from "@/components/exams/results-table";

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");
  const { id } = await params;
  if (!(await findManageableExam(profile, id))) notFound();

  const { exam, questions, rows, maxScore } = await examResults(id);
  const submitted = rows.filter((r) => r.status === "submitted");
  const average = submitted.length ? submitted.reduce((s, r) => s + r.score, 0) / submitted.length : 0;
  const highest = submitted.reduce((m, r) => Math.max(m, r.score), 0);

  const stats = [
    { label: "Submitted", value: `${submitted.length}` },
    { label: "In progress", value: `${rows.filter((r) => r.status === "in_progress").length}` },
    { label: "Absent", value: `${rows.filter((r) => r.status === "absent").length}` },
    { label: "Average", value: submitted.length ? `${Math.round(average * 10) / 10} / ${maxScore}` : "–" },
    { label: "Highest", value: submitted.length ? `${highest} / ${maxScore}` : "–" },
  ];

  return (
    <div className="space-y-6">
      <Link href={`/teacher/exams/${id}`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Back to exam
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{exam.title}: results</h1>
            <ExamStatusBadge exam={exam} />
          </div>
          <p className="mt-1 text-muted-foreground">{formatTarget(exam)}</p>
        </div>
        <Button asChild>
          <a href={`/api/exams/${id}/export`}>
            <Download className="mr-2 h-4 w-4" />
            Download marks (Excel)
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <ResultsTable
        examId={id}
        questions={questions}
        rows={rows.map((r) => ({ ...r, submittedAt: r.submittedAt?.toISOString() ?? null }))}
      />
    </div>
  );
}
