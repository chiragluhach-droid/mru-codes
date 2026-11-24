"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PlayCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

export function StartExamButton({ examId, resume }: { examId: string; resume: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const start = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams/${examId}/start`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't start the exam");
      // Full screen helps students focus; browsers only allow it from a click.
      document.documentElement.requestFullscreen?.().catch(() => {});
      router.push(`/student/exams/${examId}/take`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't start the exam");
      setLoading(false);
    }
  };

  return (
    <Button size="lg" onClick={start} disabled={loading} className="w-full sm:w-auto">
      {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PlayCircle className="mr-2 h-5 w-5" />}
      {resume ? "Resume exam" : "Start exam"}
    </Button>
  );
}
