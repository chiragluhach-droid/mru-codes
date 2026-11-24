"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  ClassTargetFields,
  classTargetBody,
  classTargetError,
  type ClassTargetValue,
} from "@/components/class-fields";

export interface ExamDetailsValue {
  id?: string;
  title: string;
  instructions: string | null;
  durationMinutes: number;
  startsAt: string;
  endsAt: string;
  showResults: boolean;
  targetDepartment: string | null;
  targetBatch: string | null;
  targetSection: string | null;
  targetSemester: number | null;
}

/** "2026-11-24T10:00" in the browser's time zone, for datetime-local inputs. */
function toLocalInput(value: string | Date) {
  const d = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultWindow() {
  const start = new Date();
  start.setDate(start.getDate() + 1);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start.getTime() + 2 * 60 * 60_000);
  return { start: toLocalInput(start), end: toLocalInput(end) };
}

export function ExamDetailsForm({
  exam,
  onSaved,
  onCancel,
}: {
  /** Existing exam to edit; omit to create a new one */
  exam?: ExamDetailsValue;
  onSaved?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const initialWindow = defaultWindow();
  const [title, setTitle] = useState(exam?.title ?? "");
  const [instructions, setInstructions] = useState(
    exam?.instructions ??
      "- Read every question carefully.\n- Programming answers are graded on hidden test cases; use **Run** to check the samples first.\n- Your work is saved automatically. The exam submits itself when time runs out."
  );
  const [startsAt, setStartsAt] = useState(exam ? toLocalInput(exam.startsAt) : initialWindow.start);
  const [endsAt, setEndsAt] = useState(exam ? toLocalInput(exam.endsAt) : initialWindow.end);
  const [duration, setDuration] = useState(String(exam?.durationMinutes ?? 60));
  const [showResults, setShowResults] = useState(exam?.showResults ?? true);
  const [target, setTarget] = useState<ClassTargetValue>({
    department: exam?.targetDepartment ?? "",
    batch: exam?.targetBatch ?? "",
    section: exam?.targetSection ?? "",
    semester: exam?.targetSemester ? String(exam.targetSemester) : "",
  });
  const [saving, setSaving] = useState(false);

  const windowMinutes = Math.round((new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000);

  const save = async () => {
    const targetError = classTargetError(target);
    if (!title.trim()) return toast.error("Give the exam a title");
    if (targetError) return toast.error(targetError);
    if (!(windowMinutes > 0)) return toast.error("The exam must end after it starts");
    if (Number(duration) > windowMinutes) {
      return toast.error(`The duration is longer than the exam window (${windowMinutes} min)`);
    }

    setSaving(true);
    try {
      const res = await fetch(exam?.id ? `/api/exams/${exam.id}` : "/api/exams", {
        method: exam?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          instructions,
          durationMinutes: Number(duration),
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          showResults,
          ...classTargetBody(target),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save the exam");
      if (exam?.id) {
        toast.success("Exam updated");
        onSaved?.();
        router.refresh();
      } else {
        toast.success("Exam created. Now add questions.");
        router.push(`/teacher/exams/${data.exam.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the exam");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="exam-title">Title</Label>
        <Input
          id="exam-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Mid-Term Practical: Arrays and Pointers"
          maxLength={150}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exam-instructions">Instructions</Label>
        <Textarea
          id="exam-instructions"
          value={instructions ?? ""}
          onChange={(e) => setInstructions(e.target.value)}
          rows={5}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">Shown before students start. Markdown is supported.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="exam-start">Opens at</Label>
          <Input id="exam-start" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exam-end">Closes at</Label>
          <Input id="exam-end" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="exam-duration">Duration (minutes)</Label>
          <Input
            id="exam-duration"
            type="number"
            min={5}
            max={600}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
        </div>
      </div>
      <p className="-mt-3 text-xs text-muted-foreground">
        Students can start any time between opening and closing. Each student gets the full duration, but
        everyone&apos;s exam ends at the closing time.
      </p>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Assign to</p>
          <p className="text-xs text-muted-foreground">
            Only students in this department and batch see the exam. Leave section or semester on &quot;All&quot; to
            include the whole batch.
          </p>
        </div>
        <ClassTargetFields value={target} onChange={setTarget} disabled={saving} idPrefix="exam" />
      </div>

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div>
          <Label htmlFor="exam-show-results">Show results to students</Label>
          <p className="text-xs text-muted-foreground mt-1">
            Students see their score and which test cases passed after they submit.
          </p>
        </div>
        <Switch id="exam-show-results" checked={showResults} onCheckedChange={setShowResults} />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {exam?.id ? "Save changes" : "Create exam"}
        </Button>
      </div>
    </div>
  );
}
