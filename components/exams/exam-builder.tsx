"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarClock,
  Code2,
  ListChecks,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Send,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatTarget } from "@/lib/departments";
import { LANGUAGE_META, formatExamDate } from "@/lib/exams";
import { ExamStatusBadge } from "@/components/exams/exam-badges";
import { ExamDetailsForm, type ExamDetailsValue } from "@/components/exams/exam-details-form";
import { QuestionEditor, type EditableQuestion } from "@/components/exams/question-editor";

export interface BuilderExam extends ExamDetailsValue {
  id: string;
  status: "draft" | "published" | "closed";
  attemptCount: number;
  submittedCount: number;
}

export function ExamBuilder({ exam, questions }: { exam: BuilderExam; questions: EditableQuestion[] }) {
  const router = useRouter();
  const locked = exam.attemptCount > 0;
  const [editingDetails, setEditingDetails] = useState(false);
  const [editor, setEditor] = useState<{ type: "mcq" | "programming"; question: EditableQuestion | null } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  const call = async (key: string, url: string, init: RequestInit, success: string, refresh = true) => {
    setBusy(key);
    try {
      const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      toast.success(success);
      if (refresh) router.refresh();
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const setStatus = (status: BuilderExam["status"], message: string) =>
    call(`status-${status}`, `/api/exams/${exam.id}`, { method: "PATCH", body: JSON.stringify({ status }) }, message);

  const move = (index: number, delta: number) => {
    const order = questions.map((q) => q.id);
    const [id] = order.splice(index, 1);
    order.splice(index + delta, 0, id);
    call("reorder", `/api/exams/${exam.id}/questions`, { method: "PUT", body: JSON.stringify({ order }) }, "Order updated");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{exam.title}</h1>
            <ExamStatusBadge exam={exam} />
          </div>
          <p className="mt-1 text-muted-foreground">{formatTarget(exam)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/teacher/exams/${exam.id}/results`}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Results
              {exam.attemptCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {exam.submittedCount}/{exam.attemptCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setEditingDetails(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit details
          </Button>
          {exam.status === "draft" && (
            <Button onClick={() => setStatus("published", "Exam published. Students can see it now.")} disabled={busy !== null}>
              {busy === "status-published" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Publish
            </Button>
          )}
          {exam.status === "published" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" disabled={busy !== null}>
                  {busy?.startsWith("status") && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Published
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!locked && (
                  <DropdownMenuItem onClick={() => setStatus("draft", "Moved back to draft")}>Unpublish (back to draft)</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setStatus("closed", "Exam closed")}>Close exam now</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {exam.status === "closed" && (
            <Button variant="secondary" onClick={() => setStatus("published", "Exam reopened")} disabled={busy !== null}>
              Reopen
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete exam">
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarClock, label: "Opens", value: formatExamDate(exam.startsAt) },
          { icon: CalendarClock, label: "Closes", value: formatExamDate(exam.endsAt) },
          { icon: Timer, label: "Duration", value: `${exam.durationMinutes} min` },
          { icon: Users, label: "Questions", value: `${questions.length} · ${totalPoints} points` },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="truncate font-medium">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {locked && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p>
            {exam.attemptCount} student{exam.attemptCount > 1 ? "s have" : " has"} started this exam, so questions are
            locked to keep grading fair. You can still change the timing (e.g. extend the closing time) or close the exam.
          </p>
        </div>
      )}

      {/* Questions */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Questions</CardTitle>
            <CardDescription>Students see them in this order and can jump between them.</CardDescription>
          </div>
          {!locked && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add question
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={() => setEditor({ type: "programming", question: null })} className="items-start gap-3 py-2">
                  <Code2 className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Programming</p>
                    <p className="text-xs text-muted-foreground">C, C++ or Java, auto-graded on test cases</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditor({ type: "mcq", question: null })} className="items-start gap-3 py-2">
                  <ListChecks className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <p className="font-medium">Multiple choice</p>
                    <p className="text-xs text-muted-foreground">One or more correct options</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent>
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed py-12 text-center">
              <Code2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 font-medium">No questions yet</p>
              <p className="text-sm text-muted-foreground">Add programming or multiple-choice questions to build the exam.</p>
            </div>
          ) : (
            <ol className="space-y-3">
              {questions.map((q, i) => (
                <li key={q.id} className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/40">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{q.title}</p>
                      {q.type === "programming" ? (
                        <Badge variant="secondary" className="gap-1">
                          <Code2 className="h-3 w-3" /> Code
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <ListChecks className="h-3 w-3" /> MCQ
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {q.points} points
                      {q.type === "programming"
                        ? ` · ${(q.languages ?? []).map((l) => LANGUAGE_META[l].label).join(", ")} · ${q.testCases.length} tests (${q.testCases.filter((t) => t.isSample).length} sample)`
                        : ` · ${q.options?.length ?? 0} options · ${(q.correctOptionIds ?? []).length > 1 ? "multiple answers" : "single answer"}`}
                    </p>
                  </div>
                  {!locked && (
                    <div className="flex shrink-0 items-center">
                      <Button variant="ghost" size="icon" disabled={i === 0 || busy !== null} onClick={() => move(i, -1)} aria-label="Move up">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={i === questions.length - 1 || busy !== null}
                        onClick={() => move(i, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setEditor({ type: q.type, question: q })} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={busy !== null}
                        aria-label="Delete"
                        onClick={() => {
                          if (window.confirm(`Delete "${q.title}"?`)) {
                            call(`delete-${q.id}`, `/api/exams/${exam.id}/questions/${q.id}`, { method: "DELETE" }, "Question deleted");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {exam.instructions && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions shown to students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{exam.instructions}</p>
          </CardContent>
        </Card>
      )}

      <QuestionEditor
        examId={exam.id}
        type={editor?.type ?? "programming"}
        question={editor?.question}
        open={editor !== null}
        onOpenChange={(open) => !open && setEditor(null)}
      />

      <Dialog open={editingDetails} onOpenChange={setEditingDetails}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exam details</DialogTitle>
            <DialogDescription>
              {locked
                ? "Changing the duration or closing time also updates the timers of students who are mid-exam."
                : "Timing, class and visibility of results."}
            </DialogDescription>
          </DialogHeader>
          <ExamDetailsForm exam={exam} onSaved={() => setEditingDetails(false)} onCancel={() => setEditingDetails(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this exam?</DialogTitle>
            <DialogDescription>
              This permanently deletes the exam, its questions
              {exam.attemptCount > 0 ? ` and the answers of ${exam.attemptCount} student${exam.attemptCount > 1 ? "s" : ""}` : ""}.
              It can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy !== null}
              onClick={async () => {
                if (await call("delete", `/api/exams/${exam.id}`, { method: "DELETE" }, "Exam deleted", false)) {
                  router.push("/teacher/exams");
                }
              }}
            >
              {busy === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
