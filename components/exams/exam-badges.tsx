import { Badge } from "@/components/ui/badge";
import { examPhase } from "@/lib/exams";

/** Draft / Scheduled / Live / Ended / Closed, from status + time window. */
export function ExamStatusBadge({ exam }: { exam: { status: string; startsAt: Date | string; endsAt: Date | string } }) {
  if (exam.status === "draft") return <Badge variant="secondary">Draft</Badge>;
  if (exam.status === "closed") return <Badge variant="outline">Closed</Badge>;
  const phase = examPhase(exam);
  if (phase === "upcoming") {
    return <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15">Scheduled</Badge>;
  }
  if (phase === "live") {
    return (
      <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15">
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Live
      </Badge>
    );
  }
  return <Badge variant="outline">Ended</Badge>;
}
