"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, RotateCcw, Send } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export function AttemptActions({
  examId,
  attemptId,
  inProgress,
  studentName,
}: {
  examId: string;
  attemptId: string;
  inProgress: boolean;
  studentName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, init: RequestInit, success: string, then?: () => void) => {
    setBusy(key);
    try {
      const res = await fetch(`/api/exams/${examId}/attempts/${attemptId}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(success);
      if (then) then();
      else router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        disabled={busy !== null}
        onClick={() => run("regrade", { method: "POST", body: JSON.stringify({ action: "regrade" }) }, "Re-graded with the current test cases")}
      >
        {busy === "regrade" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
        Re-grade
      </Button>
      {inProgress && (
        <Button
          variant="outline"
          disabled={busy !== null}
          onClick={() => {
            if (window.confirm(`Submit ${studentName}'s exam now? They won't be able to continue.`)) {
              run("submit", { method: "POST", body: JSON.stringify({ action: "submit" }) }, "Exam submitted");
            }
          }}
        >
          {busy === "submit" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Submit now
        </Button>
      )}
      <Button
        variant="outline"
        className="text-destructive hover:text-destructive"
        disabled={busy !== null}
        onClick={() => {
          if (window.confirm(`Delete ${studentName}'s attempt so they can take the exam again? Their answers will be lost.`)) {
            run("retake", { method: "DELETE" }, "Attempt deleted. The student can start again.", () =>
              router.push(`/teacher/exams/${examId}/results`)
            );
          }
        }}
      >
        {busy === "retake" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
        Allow retake
      </Button>
    </div>
  );
}
