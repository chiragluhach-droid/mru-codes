"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatClass } from "@/lib/departments";

export interface ResultsRow {
  studentId: string;
  fullName: string;
  email: string;
  rollNumber: string | null;
  department: string | null;
  batch: string | null;
  section: string | null;
  semester: number | null;
  attemptId: string | null;
  status: "absent" | "in_progress" | "submitted";
  autoSubmitted: boolean;
  score: number;
  maxScore: number;
  questionScores: Record<string, number | null>;
  tabSwitches: number;
  submittedAt: string | null;
}

export function ResultsTable({
  examId,
  rows,
  questions,
}: {
  examId: string;
  rows: ResultsRow[];
  questions: Array<{ id: string; title: string; points: number }>;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [section, setSection] = useState("all");
  const sections = useMemo(() => [...new Set(rows.map((r) => r.section).filter(Boolean))].sort() as string[], [rows]);

  const visible = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (section !== "all" && r.section !== section) return false;
    const q = query.trim().toLowerCase();
    return !q || [r.fullName, r.email, r.rollNumber ?? ""].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or roll number" className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All students</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_progress">In progress</SelectItem>
            <SelectItem value="absent">Absent</SelectItem>
          </SelectContent>
        </Select>
        {sections.length > 1 && (
          <Select value={section} onValueChange={setSection}>
            <SelectTrigger className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sections</SelectItem>
              {sections.map((s) => (
                <SelectItem key={s} value={s}>
                  Section {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              {questions.map((q, i) => (
                <TableHead key={q.id} className="text-center" title={q.title}>
                  Q{i + 1}
                  <span className="block text-[10px] font-normal text-muted-foreground">/{q.points}</span>
                </TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Tab switches</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={questions.length + 5} className="py-10 text-center text-muted-foreground">
                  No students match.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((r, i) => (
                <TableRow key={r.studentId} className={r.status === "absent" ? "opacity-60" : undefined}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    {r.attemptId ? (
                      <Link href={`/teacher/exams/${examId}/results/${r.attemptId}`} className="font-medium hover:text-primary hover:underline">
                        {r.fullName}
                      </Link>
                    ) : (
                      <span className="font-medium">{r.fullName}</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {r.rollNumber ?? r.email} · {formatClass({ department: r.department, batch: r.batch, section: r.section })}
                    </p>
                  </TableCell>
                  <TableCell>
                    {r.status === "submitted" ? (
                      <Badge variant={r.autoSubmitted ? "outline" : "secondary"}>{r.autoSubmitted ? "Auto-submitted" : "Submitted"}</Badge>
                    ) : r.status === "in_progress" ? (
                      <Badge className="bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-500/15">In progress</Badge>
                    ) : (
                      <Badge variant="outline">Absent</Badge>
                    )}
                  </TableCell>
                  {questions.map((q) => {
                    const s = r.questionScores[q.id];
                    return (
                      <TableCell key={q.id} className="text-center tabular-nums">
                        {s == null ? (
                          <span className="text-muted-foreground">–</span>
                        ) : (
                          <span className={s >= q.points ? "text-emerald-600 font-medium" : s === 0 ? "text-destructive" : undefined}>
                            {s}
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right font-semibold tabular-nums">
                    {r.status === "absent" ? "–" : `${r.score} / ${r.maxScore}`}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.tabSwitches > 0 ? (
                      <span className={`inline-flex items-center gap-1 ${r.tabSwitches >= 3 ? "text-destructive font-medium" : "text-amber-600"}`}>
                        {r.tabSwitches >= 3 && <AlertTriangle className="h-3.5 w-3.5" />}
                        {r.tabSwitches}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
