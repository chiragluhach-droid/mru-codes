"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CloudOff,
  Code2,
  Flag,
  Loader2,
  Maximize,
  Play,
  RotateCcw,
  Send,
  Square,
  SquareCheck,
  Timer,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { LANGUAGE_META, VERDICT_LABEL, type ExamLanguage } from "@/lib/exams";
import { CodeEditor } from "@/components/exams/code-editor";
import { Markdown } from "@/components/exams/markdown";

export interface RoomQuestion {
  id: string;
  type: "mcq" | "programming";
  title: string;
  prompt: string;
  points: number;
  options?: Array<{ id: string; text: string }>;
  multiple?: boolean;
  languages?: ExamLanguage[];
  starterCode?: Partial<Record<ExamLanguage, string>>;
  samples?: Array<{ input: string; expectedOutput: string }>;
  timeLimitMs?: number;
  memoryLimitMb?: number;
}

interface Graded {
  passed: number;
  total: number;
  score?: number;
}

export interface RoomAnswer {
  selectedOptionIds?: string[];
  code?: string;
  language?: ExamLanguage;
  graded?: Graded;
}

interface RunResult {
  index: number;
  sample?: boolean;
  passed: boolean;
  verdict: string;
  timeMs: number | null;
  input?: string;
  expectedOutput?: string;
  output?: string;
  error?: string;
}

type ConsoleState =
  | { kind: "idle" }
  | { kind: "busy"; action: "run" | "custom" | "submit" }
  | { kind: "samples"; results: RunResult[] }
  | { kind: "custom"; verdict: string; output: string; error: string; timeMs: number | null }
  | { kind: "submitted"; passed: number; total: number; score?: number; points?: number; results: RunResult[] }
  | { kind: "error"; message: string };

type SaveState = "saved" | "saving" | "unsaved" | "offline";

function formatClock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ExamRoom({
  examId,
  title,
  deadline,
  serverNow,
  showResults,
  initialTabSwitches,
  questions,
  answers,
}: {
  examId: string;
  title: string;
  deadline: string;
  serverNow: string;
  showResults: boolean;
  initialTabSwitches: number;
  questions: RoomQuestion[];
  answers: Record<string, RoomAnswer>;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const question = questions[index];

  // Server clock minus browser clock, so a wrong laptop clock can't change the timer.
  const [clockOffset] = useState(() => new Date(serverNow).getTime() - Date.now());
  const deadlineMs = new Date(deadline).getTime();
  const [remaining, setRemaining] = useState(() => deadlineMs - (Date.now() + clockOffset));

  const [selections, setSelections] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, answers[q.id]?.selectedOptionIds ?? []]))
  );
  const [languages, setLanguages] = useState<Record<string, ExamLanguage>>(() =>
    Object.fromEntries(
      questions
        .filter((q) => q.type === "programming")
        .map((q) => {
          const saved = answers[q.id]?.language;
          return [q.id, saved && q.languages?.includes(saved) ? saved : q.languages![0]];
        })
    )
  );
  // Code per question per language, so switching language doesn't lose work.
  const [codes, setCodes] = useState<Record<string, Partial<Record<ExamLanguage, string>>>>(() =>
    Object.fromEntries(
      questions
        .filter((q) => q.type === "programming")
        .map((q) => {
          const a = answers[q.id];
          const map: Partial<Record<ExamLanguage, string>> = { ...q.starterCode };
          if (a?.code && a.language) map[a.language] = a.code;
          return [q.id, map];
        })
    )
  );
  const [graded, setGraded] = useState<Record<string, Graded | undefined>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, answers[q.id]?.graded]))
  );
  const [consoles, setConsoles] = useState<Record<string, ConsoleState>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [consoleTab, setConsoleTab] = useState<"results" | "custom">("results");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [tabSwitches, setTabSwitches] = useState(initialTabSwitches);
  const [awayWarning, setAwayWarning] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const dirty = useRef(new Set<string>());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ended = useRef(false);
  const finishingRef = useRef(false);

  const handleEnded = useCallback(() => {
    if (ended.current) return;
    ended.current = true;
    toast("Time is up. Your exam has been submitted.", { icon: "⏰", duration: 6000 });
    document.exitFullscreen?.().catch(() => {});
    router.replace(`/student/exams/${examId}`);
    router.refresh();
  }, [examId, router]);

  /** POST/PUT JSON to an exam API; handles "time is up" for every call. */
  const api = useCallback(
    async (path: string, method: string, body?: unknown) => {
      const res = await fetch(`/api/exams/${examId}/${path}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        keepalive: method !== "POST" || path === "events",
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.ended) {
        handleEnded();
        throw new Error(data.error);
      }
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    },
    [examId, handleEnded]
  );

  // ---- Saving -------------------------------------------------------------

  const saveCode = useCallback(
    async (questionId: string) => {
      const lang = languages[questionId];
      const code = codes[questionId]?.[lang] ?? "";
      dirty.current.delete(questionId);
      await api("answers", "PUT", { questionId, code, language: lang });
    },
    [api, codes, languages]
  );

  const flushSaves = useCallback(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const pending = [...dirty.current];
    if (pending.length === 0) return;
    setSaveState("saving");
    try {
      await Promise.all(pending.map((id) => saveCode(id)));
      setSaveState("saved");
    } catch {
      pending.forEach((id) => dirty.current.add(id));
      setSaveState("offline");
    }
  }, [saveCode]);

  // Debounced autosave while typing.
  const markDirty = (questionId: string) => {
    dirty.current.add(questionId);
    setSaveState("unsaved");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => void flushSaves(), 1500);
  };

  // Retry saving every few seconds after a network failure.
  useEffect(() => {
    if (saveState !== "offline") return;
    const t = setTimeout(() => void flushSaves(), 5000);
    return () => clearTimeout(t);
  }, [saveState, flushSaves]);

  const selectOption = async (q: RoomQuestion, optionId: string) => {
    const current = selections[q.id] ?? [];
    const next = q.multiple
      ? current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId]
      : [optionId];
    setSelections((prev) => ({ ...prev, [q.id]: next }));
    setSaveState("saving");
    try {
      await api("answers", "PUT", { questionId: q.id, selectedOptionIds: next });
      setSaveState(dirty.current.size ? "unsaved" : "saved");
    } catch {
      setSaveState("offline");
      toast.error("Couldn't save your answer. Check your connection.");
    }
  };

  // ---- Timer, tab switches, leaving ----------------------------------------

  const finish = useCallback(
    async (auto: boolean) => {
      if (finishingRef.current) return;
      finishingRef.current = true;
      setFinishing(true);
      try {
        await flushSaves().catch(() => {});
        await api("finish", "POST", { auto });
        ended.current = true;
        document.exitFullscreen?.().catch(() => {});
        toast.success(auto ? "Time is up. Your exam was submitted." : "Exam submitted");
        router.replace(`/student/exams/${examId}`);
        router.refresh();
      } catch (err) {
        if (!ended.current) {
          finishingRef.current = false;
          setFinishing(false);
          toast.error(err instanceof Error ? err.message : "Couldn't submit. Try again.");
        }
      }
    },
    [api, examId, flushSaves, router]
  );

  useEffect(() => {
    const tick = () => {
      const left = deadlineMs - (Date.now() + clockOffset);
      setRemaining(left);
      if (left <= 0 && !finishingRef.current && !ended.current) void finish(true);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadlineMs, clockOffset, finish]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !ended.current && !finishingRef.current) {
        void flushSaves();
        api("events", "POST", { type: "tab_switch" })
          .then((d) => setTabSwitches(d.tabSwitches))
          .catch(() => setTabSwitches((n) => n + 1));
      } else if (document.visibilityState === "visible" && !ended.current) {
        setAwayWarning(true);
      }
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (ended.current || finishingRef.current) return;
      void flushSaves();
      e.preventDefault();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [api, flushSaves]);

  // ---- Code actions --------------------------------------------------------

  const setConsole = (qid: string, state: ConsoleState) => setConsoles((prev) => ({ ...prev, [qid]: state }));

  const runCode = async (q: RoomQuestion, mode: "run" | "custom" | "submit") => {
    const lang = languages[q.id];
    const code = codes[q.id]?.[lang] ?? "";
    if (!code.trim()) return toast.error("Write some code first");
    setConsole(q.id, { kind: "busy", action: mode });
    setConsoleTab(mode === "custom" ? "custom" : "results");
    dirty.current.delete(q.id);
    try {
      if (mode === "submit") {
        const data = await api("submit-code", "POST", { questionId: q.id, code, language: lang });
        setGraded((prev) => ({ ...prev, [q.id]: { passed: data.passed, total: data.total, score: data.score } }));
        setConsole(q.id, { kind: "submitted", ...data });
        if (data.passed === data.total) toast.success(`All ${data.total} test cases passed`);
      } else {
        const data = await api("run", "POST", {
          questionId: q.id,
          code,
          language: lang,
          ...(mode === "custom" ? { customInput: customInputs[q.id] ?? "" } : {}),
        });
        setConsole(q.id, data.mode === "custom" ? { kind: "custom", ...data } : { kind: "samples", results: data.results });
      }
      setSaveState(dirty.current.size ? "unsaved" : "saved");
    } catch (err) {
      if (!ended.current) setConsole(q.id, { kind: "error", message: err instanceof Error ? err.message : "Failed" });
    }
  };

  // ---- Navigation helpers --------------------------------------------------

  const isAnswered = (q: RoomQuestion) => {
    if (q.type === "mcq") return (selections[q.id] ?? []).length > 0;
    if (graded[q.id]) return true;
    const map = codes[q.id] ?? {};
    return (q.languages ?? []).some((l) => (map[l] ?? "").trim() && map[l] !== q.starterCode?.[l]);
  };
  const answeredCount = questions.filter(isAnswered).length;
  const unanswered = questions.map((q, i) => ({ q, i })).filter(({ q }) => !isAnswered(q));
  const ungradedCode = questions.filter(
    (q) => q.type === "programming" && isAnswered(q) && !graded[q.id]
  ).length;

  const goTo = (i: number) => {
    if (i < 0 || i >= questions.length) return;
    void flushSaves();
    setIndex(i);
    setConsoleTab("results");
  };

  const lowTime = remaining < 5 * 60_000;

  // ---- Render --------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b px-3 sm:px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="text-xs text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
        </div>

        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
          {saveState === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          )}
          {saveState === "saved" && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> All changes saved
            </>
          )}
          {saveState === "unsaved" && "Unsaved changes"}
          {saveState === "offline" && (
            <span className="flex items-center gap-1.5 text-destructive">
              <CloudOff className="h-3.5 w-3.5" /> Not saved, retrying
            </span>
          )}
        </span>

        {tabSwitches > 0 && (
          <Badge variant="outline" className="hidden gap-1 border-amber-500/50 text-amber-600 md:flex" title="Times you left the exam tab">
            <AlertTriangle className="h-3 w-3" /> {tabSwitches}
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          title="Full screen"
          onClick={() => document.documentElement.requestFullscreen?.().catch(() => {})}
        >
          <Maximize className="h-4 w-4" />
        </Button>

        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-sm font-semibold tabular-nums",
            lowTime ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted"
          )}
          aria-live="polite"
        >
          <Timer className="h-4 w-4" />
          {formatClock(remaining)}
        </div>

        <Button onClick={() => setConfirmFinish(true)} disabled={finishing}>
          {finishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Flag className="mr-2 h-4 w-4" />}
          Finish
        </Button>
      </header>

      {/* Mobile question strip */}
      <div className="flex shrink-0 gap-2 overflow-x-auto border-b px-3 py-2 md:hidden">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => goTo(i)}
            className={cn(
              "flex h-8 min-w-8 items-center justify-center rounded-md border px-2 text-sm font-medium",
              i === index && "border-primary bg-primary text-primary-foreground",
              i !== index && isAnswered(q) && "border-emerald-500/50 bg-emerald-500/10"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {awayWarning && (
        <div className="flex shrink-0 items-center gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <p className="flex-1">
            You left the exam tab ({tabSwitches} time{tabSwitches === 1 ? "" : "s"}). This is reported to your teacher.
          </p>
          <Button size="sm" variant="ghost" onClick={() => setAwayWarning(false)}>
            OK
          </Button>
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Question navigator */}
        <nav className="hidden w-60 shrink-0 flex-col border-r md:flex">
          <p className="px-4 pb-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questions</p>
          <ol className="flex-1 space-y-1 overflow-y-auto px-2 pb-4">
            {questions.map((q, i) => {
              const g = graded[q.id];
              return (
                <li key={q.id}>
                  <button
                    onClick={() => goTo(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                      i === index ? "bg-primary/10 text-primary" : "hover:bg-muted"
                    )}
                  >
                    {isAnswered(q) ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {i + 1}. {q.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {q.type === "programming" ? "Code" : "MCQ"} · {q.points} pts
                        {g && ` · ${g.passed}/${g.total} tests`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        {/* Question */}
        <main className="min-w-0 flex-1">
          {question.type === "mcq" ? (
            <div className="h-full overflow-y-auto">
              <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-8">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Question {index + 1} of {questions.length} · {question.points} points
                  </p>
                  <h2 className="mt-1 text-xl font-semibold">{question.title}</h2>
                </div>
                <Markdown className="text-base">{question.prompt}</Markdown>
                {question.multiple && <p className="text-sm font-medium text-primary">Select all that apply.</p>}
                <div className="space-y-3">
                  {question.options!.map((o, oi) => {
                    const selected = (selections[question.id] ?? []).includes(o.id);
                    const Icon = question.multiple ? (selected ? SquareCheck : Square) : selected ? CheckCircle2 : Circle;
                    return (
                      <button
                        key={o.id}
                        onClick={() => selectOption(question, o.id)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-lg border-2 p-4 text-left transition-all",
                          selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/50"
                        )}
                      >
                        <Icon className={cn("h-5 w-5 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
                        <span className="text-sm font-semibold text-muted-foreground">{String.fromCharCode(65 + oi)}</span>
                        <span className="flex-1">{o.text}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => goTo(index - 1)} disabled={index === 0}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                  </Button>
                  <Button variant="outline" onClick={() => goTo(index + 1)} disabled={index === questions.length - 1}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <ProgrammingView
              key={question.id}
              question={question}
              index={index}
              count={questions.length}
              language={languages[question.id]}
              code={codes[question.id]?.[languages[question.id]] ?? ""}
              graded={graded[question.id]}
              showResults={showResults}
              consoleState={consoles[question.id] ?? { kind: "idle" }}
              consoleTab={consoleTab}
              customInput={customInputs[question.id] ?? question.samples?.[0]?.input ?? ""}
              onConsoleTab={setConsoleTab}
              onCustomInput={(v) => setCustomInputs((prev) => ({ ...prev, [question.id]: v }))}
              onLanguage={(lang) => {
                setLanguages((prev) => ({ ...prev, [question.id]: lang }));
                markDirty(question.id);
              }}
              onCode={(value) => {
                setCodes((prev) => ({
                  ...prev,
                  [question.id]: { ...prev[question.id], [languages[question.id]]: value },
                }));
                markDirty(question.id);
              }}
              onReset={() => {
                const lang = languages[question.id];
                setCodes((prev) => ({
                  ...prev,
                  [question.id]: { ...prev[question.id], [lang]: question.starterCode?.[lang] ?? "" },
                }));
                markDirty(question.id);
              }}
              onRun={(mode) => runCode(question, mode)}
              onPrev={() => goTo(index - 1)}
              onNext={() => goTo(index + 1)}
            />
          )}
        </main>
      </div>

      <Dialog open={confirmFinish} onOpenChange={(o) => !finishing && setConfirmFinish(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Finish the exam?</DialogTitle>
            <DialogDescription>You can&apos;t change your answers after you finish.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              You&apos;ve answered <b>{answeredCount}</b> of <b>{questions.length}</b> questions.
            </p>
            {unanswered.length > 0 && (
              <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
                <p className="font-medium">Not answered:</p>
                <ul className="mt-1 list-disc pl-5">
                  {unanswered.map(({ q, i }) => (
                    <li key={q.id}>
                      <button
                        className="underline-offset-2 hover:underline"
                        onClick={() => {
                          setConfirmFinish(false);
                          goTo(i);
                        }}
                      >
                        Q{i + 1}. {q.title}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {ungradedCode > 0 && (
              <p className="text-muted-foreground">
                {ungradedCode} coding answer{ungradedCode > 1 ? "s haven't" : " hasn't"} been submitted for grading yet.
                They&apos;ll be graded automatically when you finish.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmFinish(false)} disabled={finishing}>
              Keep working
            </Button>
            <Button onClick={() => finish(false)} disabled={finishing}>
              {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {finishing ? "Grading and submitting…" : "Finish exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProgrammingView({
  question,
  index,
  count,
  language,
  code,
  graded,
  showResults,
  consoleState,
  consoleTab,
  customInput,
  onConsoleTab,
  onCustomInput,
  onLanguage,
  onCode,
  onReset,
  onRun,
  onPrev,
  onNext,
}: {
  question: RoomQuestion;
  index: number;
  count: number;
  language: ExamLanguage;
  code: string;
  graded?: Graded;
  showResults: boolean;
  consoleState: ConsoleState;
  consoleTab: "results" | "custom";
  customInput: string;
  onConsoleTab: (tab: "results" | "custom") => void;
  onCustomInput: (value: string) => void;
  onLanguage: (lang: ExamLanguage) => void;
  onCode: (value: string) => void;
  onReset: () => void;
  onRun: (mode: "run" | "custom" | "submit") => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const busy = consoleState.kind === "busy";
  const busyAction = consoleState.kind === "busy" ? consoleState.action : null;

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,40%)_minmax(0,60%)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1">
      {/* Problem */}
      <section className="min-h-0 overflow-y-auto border-b lg:border-b-0 lg:border-r">
        <div className="space-y-5 p-4 sm:p-6">
          <div>
            <p className="text-sm text-muted-foreground">
              Question {index + 1} of {count} · {question.points} points
            </p>
            <h2 className="mt-1 text-xl font-semibold">{question.title}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">
                <Code2 className="mr-1 h-3 w-3" />
                {question.languages!.map((l) => LANGUAGE_META[l].label).join(" / ")}
              </Badge>
              <Badge variant="outline">Time limit {(question.timeLimitMs ?? 2000) / 1000}s</Badge>
              <Badge variant="outline">Memory {question.memoryLimitMb ?? 128} MB</Badge>
              {graded && (
                <Badge
                  className={cn(
                    graded.passed === graded.total
                      ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/15"
                      : "bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/15"
                  )}
                >
                  Submitted: {graded.passed}/{graded.total} tests
                  {showResults && graded.score !== undefined && ` · ${graded.score}/${question.points} pts`}
                </Badge>
              )}
            </div>
          </div>
          <Markdown>{question.prompt}</Markdown>
          {question.samples!.map((s, i) => (
            <div key={i} className="space-y-2">
              <p className="text-sm font-semibold">Sample {i + 1}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Input</p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{s.input || " "}</pre>
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Output</p>
                  <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{s.expectedOutput || " "}</pre>
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-between border-t pt-4">
            <Button variant="ghost" size="sm" onClick={onPrev} disabled={index === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Previous
            </Button>
            <Button variant="ghost" size="sm" onClick={onNext} disabled={index === count - 1}>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Editor + console */}
      <section className="flex min-h-0 flex-col">
        <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
          <Select value={language} onValueChange={(v) => onLanguage(v as ExamLanguage)}>
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {question.languages!.map((l) => (
                <SelectItem key={l} value={l}>
                  {LANGUAGE_META[l].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{LANGUAGE_META[language].file}</span>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Reset your code to the starter code?")) onReset();
            }}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reset
          </Button>
        </div>

        <div className="min-h-0 flex-1">
          <CodeEditor language={language} value={code} onChange={onCode} locked />
        </div>

        <div className="flex h-[42%] min-h-[180px] shrink-0 flex-col border-t">
          <div className="flex shrink-0 items-center gap-1 border-b px-2 py-1.5">
            {(["results", "custom"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => onConsoleTab(tab)}
                className={cn(
                  "rounded-md px-3 py-1 text-sm",
                  consoleTab === tab ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "results" ? "Test results" : "Custom input"}
              </button>
            ))}
            <div className="flex-1" />
            {consoleTab === "custom" ? (
              <Button size="sm" variant="secondary" onClick={() => onRun("custom")} disabled={busy}>
                {busyAction === "custom" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
                Run with input
              </Button>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => onRun("run")} disabled={busy}>
                {busyAction === "run" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />}
                Run
              </Button>
            )}
            <Button size="sm" onClick={() => onRun("submit")} disabled={busy} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {busyAction === "submit" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
              Submit
            </Button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 text-sm">
            {consoleTab === "custom" ? (
              <div className="grid h-full gap-3 sm:grid-cols-2">
                <div className="flex flex-col">
                  <p className="mb-1 text-xs text-muted-foreground">Input</p>
                  <Textarea
                    value={customInput}
                    onChange={(e) => onCustomInput(e.target.value)}
                    className="min-h-[80px] flex-1 resize-none font-mono text-xs"
                    placeholder="Type the input for your program"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="mb-1 text-xs text-muted-foreground">Output</p>
                  <pre className="min-h-[80px] flex-1 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-2 font-mono text-xs">
                    {consoleState.kind === "custom"
                      ? `${consoleState.output}${consoleState.error ? `\n${consoleState.error}` : ""}` ||
                        (consoleState.verdict === "accepted" ? "(no output)" : VERDICT_LABEL[consoleState.verdict])
                      : busyAction === "custom"
                        ? "Running…"
                        : "Press “Run with input” to see the output."}
                  </pre>
                  {consoleState.kind === "custom" && (
                    <p className={cn("mt-1 text-xs", consoleState.verdict === "accepted" ? "text-muted-foreground" : "text-destructive")}>
                      {VERDICT_LABEL[consoleState.verdict] === "Passed" ? "Finished" : VERDICT_LABEL[consoleState.verdict]}
                      {consoleState.timeMs != null && ` · ${consoleState.timeMs} ms`}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <ConsoleResults state={consoleState} showResults={showResults} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ConsoleResults({ state, showResults }: { state: ConsoleState; showResults: boolean }) {
  if (state.kind === "idle" || state.kind === "custom") {
    return (
      <p className="text-muted-foreground">
        <b>Run</b> checks your code on the sample tests. <b>Submit</b> grades it on all tests, including hidden ones. You
        can submit as many times as you like; the last submit counts.
      </p>
    );
  }
  if (state.kind === "busy") {
    return (
      <p className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        {state.action === "submit" ? "Grading on all test cases…" : "Running on sample tests…"}
      </p>
    );
  }
  if (state.kind === "error") return <p className="text-destructive">{state.message}</p>;

  const results = state.results;
  const compileError = results.find((r) => r.verdict === "compile_error");
  return (
    <div className="space-y-3">
      {state.kind === "submitted" && (
        <div
          className={cn(
            "rounded-md p-3 font-medium",
            state.passed === state.total ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10"
          )}
        >
          {state.passed} of {state.total} test cases passed
          {showResults && state.score !== undefined && ` · ${state.score} / ${state.points} points`}
        </div>
      )}
      {compileError ? (
        <div>
          <p className="mb-1 font-medium text-destructive">Compilation error</p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-destructive/5 p-3 font-mono text-xs">{compileError.error}</pre>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((r) => (
            <details key={r.index} open={!r.passed && r.input !== undefined} className="rounded-md border">
              <summary className="flex cursor-pointer items-center gap-2 px-3 py-2">
                {r.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-destructive" />}
                <span className="font-medium">
                  {r.sample === false ? `Hidden test ${r.index}` : `Test ${r.index}`}
                </span>
                <span className={r.passed ? "text-muted-foreground" : "text-destructive"}>{VERDICT_LABEL[r.verdict] ?? r.verdict}</span>
                {r.timeMs != null && <span className="ml-auto text-xs text-muted-foreground">{r.timeMs} ms</span>}
              </summary>
              {r.input !== undefined ? (
                <div className="grid gap-2 border-t p-3 sm:grid-cols-3">
                  {[
                    ["Input", r.input],
                    ["Expected", r.expectedOutput],
                    [r.error && !r.passed ? "Error" : "Your output", r.error && !r.passed ? r.error : r.output],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                      <pre className="max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">{value || " "}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="border-t px-3 py-2 text-xs text-muted-foreground">Hidden test: input and expected output aren&apos;t shown.</p>
              )}
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
