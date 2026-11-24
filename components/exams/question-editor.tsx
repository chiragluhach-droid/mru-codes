"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  FlaskConical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  DEFAULT_STARTER_CODE,
  EXAM_LANGUAGES,
  LANGUAGE_META,
  VERDICT_LABEL,
  type ExamLanguage,
} from "@/lib/exams";
import { CodeEditor } from "@/components/exams/code-editor";
import { Markdown } from "@/components/exams/markdown";

export interface EditableQuestion {
  id: string;
  type: "mcq" | "programming";
  title: string;
  prompt: string;
  points: number;
  options: Array<{ id: string; text: string }> | null;
  correctOptionIds: string[] | null;
  languages: ExamLanguage[] | null;
  starterCode: Partial<Record<ExamLanguage, string>> | null;
  timeLimitMs: number;
  memoryLimitMb: number;
  testCases: Array<{ input: string; expectedOutput: string; isSample: boolean; weight: number }>;
}

interface TestCaseDraft {
  key: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  weight: string;
}

interface CheckResult {
  passed: boolean;
  verdict: string;
  timeMs: number | null;
  stdout: string;
  error: string;
}

let keySeq = 0;
const newKey = () => `k${Date.now().toString(36)}${(keySeq++).toString(36)}`;

const PROMPT_TEMPLATE = `Write a program that reads two integers and prints their sum.

**Input format**
A single line with two integers \`a\` and \`b\`.

**Output format**
Print \`a + b\`.

**Constraints**
- -10^9 ≤ a, b ≤ 10^9
`;

export function QuestionEditor({
  examId,
  type,
  question,
  open,
  onOpenChange,
}: {
  examId: string;
  type: "mcq" | "programming";
  /** Existing question to edit; omit to add a new one */
  question?: EditableQuestion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isProgramming = type === "programming";

  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [preview, setPreview] = useState(false);
  const [points, setPoints] = useState("10");
  const [options, setOptions] = useState<Array<{ id: string; text: string }>>([]);
  const [correct, setCorrect] = useState<string[]>([]);
  const [languages, setLanguages] = useState<ExamLanguage[]>(["c"]);
  const [starter, setStarter] = useState<Record<ExamLanguage, string>>({ ...DEFAULT_STARTER_CODE });
  const [starterLang, setStarterLang] = useState<ExamLanguage>("c");
  const [timeLimitMs, setTimeLimitMs] = useState("2000");
  const [memoryLimitMb, setMemoryLimitMb] = useState("128");
  const [tests, setTests] = useState<TestCaseDraft[]>([]);
  const [solutionLang, setSolutionLang] = useState<ExamLanguage>("c");
  const [solution, setSolution] = useState(DEFAULT_STARTER_CODE.c);
  const [checking, setChecking] = useState(false);
  const [checkResults, setCheckResults] = useState<CheckResult[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("question");

  // Reset the form each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setTab("question");
    setPreview(false);
    setCheckResults(null);
    setTitle(question?.title ?? "");
    setPrompt(question?.prompt ?? (isProgramming ? PROMPT_TEMPLATE : ""));
    setPoints(String(question?.points ?? (isProgramming ? 10 : 2)));
    const opts = question?.options?.length
      ? question.options
      : [
          { id: newKey(), text: "" },
          { id: newKey(), text: "" },
          { id: newKey(), text: "" },
          { id: newKey(), text: "" },
        ];
    setOptions(opts);
    setCorrect(question?.correctOptionIds ?? []);
    const langs = question?.languages?.length ? question.languages : (["c"] as ExamLanguage[]);
    setLanguages(langs);
    setStarter({ ...DEFAULT_STARTER_CODE, ...(question?.starterCode ?? {}) });
    setStarterLang(langs[0]);
    setSolutionLang(langs[0]);
    setSolution(DEFAULT_STARTER_CODE[langs[0]]);
    setTimeLimitMs(String(question?.timeLimitMs ?? 2000));
    setMemoryLimitMb(String(question?.memoryLimitMb ?? 128));
    setTests(
      question?.testCases?.length
        ? question.testCases.map((t) => ({ ...t, key: newKey(), weight: String(t.weight) }))
        : [
            { key: newKey(), input: "2 3", expectedOutput: "5", isSample: true, weight: "1" },
            { key: newKey(), input: "", expectedOutput: "", isSample: false, weight: "1" },
          ]
    );
  }, [open, question, isProgramming]);

  const toggleLanguage = (lang: ExamLanguage) => {
    setLanguages((prev) => {
      const next = prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang];
      const ordered = EXAM_LANGUAGES.filter((l) => next.includes(l));
      if (ordered.length && !ordered.includes(starterLang)) setStarterLang(ordered[0]);
      return ordered;
    });
  };

  const updateTest = (key: string, patch: Partial<TestCaseDraft>) =>
    setTests((prev) => prev.map((t) => (t.key === key ? { ...t, ...patch } : t)));

  const runCheck = async () => {
    if (tests.length === 0) return toast.error("Add a test case first");
    setChecking(true);
    setCheckResults(null);
    try {
      const res = await fetch(`/api/exams/${examId}/test-run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: solutionLang,
          code: solution,
          timeLimitMs: Number(timeLimitMs),
          memoryLimitMb: Number(memoryLimitMb),
          testCases: tests.map((t) => ({ input: t.input, expectedOutput: t.expectedOutput })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't run the solution");
      setCheckResults(data.results);
      const failed = (data.results as CheckResult[]).filter((r) => !r.passed).length;
      if (failed === 0) toast.success("Your solution passes every test case");
      else toast.error(`${failed} test case${failed > 1 ? "s" : ""} failed. Check the expected outputs.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't run the solution");
    } finally {
      setChecking(false);
    }
  };

  // Fill empty expected outputs with what the reference solution printed.
  const useSolutionOutputs = () => {
    if (!checkResults) return;
    setTests((prev) =>
      prev.map((t, i) => {
        const r = checkResults[i];
        return r && (r.verdict === "accepted" || r.verdict === "wrong_answer") ? { ...t, expectedOutput: r.stdout } : t;
      })
    );
    setCheckResults(null);
    toast.success("Expected outputs updated from your solution");
  };

  const save = async () => {
    const payload = isProgramming
      ? {
          type: "programming",
          title,
          prompt,
          points: Number(points),
          languages,
          starterCode: Object.fromEntries(languages.map((l) => [l, starter[l]])),
          timeLimitMs: Number(timeLimitMs),
          memoryLimitMb: Number(memoryLimitMb),
          testCases: tests.map((t) => ({
            input: t.input,
            expectedOutput: t.expectedOutput,
            isSample: t.isSample,
            weight: Number(t.weight) || 1,
          })),
        }
      : {
          type: "mcq",
          title,
          prompt,
          points: Number(points),
          options: options.map((o) => ({ id: o.id, text: o.text })),
          correctOptionIds: correct.filter((id) => options.some((o) => o.id === id)),
        };

    if (isProgramming && tests.some((t) => !t.expectedOutput.trim())) {
      setTab("tests");
      return toast.error("Every test case needs an expected output");
    }
    if (isProgramming && !tests.some((t) => t.isSample)) {
      toast("Tip: mark at least one test as a sample so students can check their output format.", { icon: "💡" });
    }

    setSaving(true);
    try {
      const res = await fetch(
        question ? `/api/exams/${examId}/questions/${question.id}` : `/api/exams/${examId}/questions`,
        {
          method: question ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save the question");
      toast.success(question ? "Question updated" : "Question added");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the question");
    } finally {
      setSaving(false);
    }
  };

  const questionFields = (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
        <div className="space-y-2">
          <Label htmlFor="q-title">Title</Label>
          <Input
            id="q-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isProgramming ? "e.g. Reverse an array" : "e.g. Size of int"}
            maxLength={200}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="q-points">Points</Label>
          <Input id="q-points" type="number" min={1} max={1000} value={points} onChange={(e) => setPoints(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="q-prompt">{isProgramming ? "Problem statement" : "Question"}</Label>
          <Button type="button" variant="ghost" size="sm" onClick={() => setPreview((p) => !p)}>
            {preview ? <Pencil className="mr-1.5 h-3.5 w-3.5" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
            {preview ? "Edit" : "Preview"}
          </Button>
        </div>
        {preview ? (
          <div className="min-h-[180px] rounded-md border p-4">
            <Markdown>{prompt || "_Nothing to preview_"}</Markdown>
          </div>
        ) : (
          <Textarea
            id="q-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={isProgramming ? 12 : 5}
            className="font-mono text-sm"
            placeholder="Markdown is supported, including `code` and fenced code blocks."
          />
        )}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {question ? "Edit" : "Add"} {isProgramming ? "programming" : "multiple-choice"} question
          </DialogTitle>
          <DialogDescription>
            {isProgramming
              ? "Students write code in C, C++ or Java. It's graded automatically on your test cases."
              : "Students pick an answer. Mark more than one option correct for a multiple-answer question."}
          </DialogDescription>
        </DialogHeader>

        {!isProgramming ? (
          <div className="space-y-6">
            {questionFields}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Options</Label>
                <span className="text-xs text-muted-foreground">Click the circle to mark the correct answer</span>
              </div>
              {options.map((option, i) => {
                const isCorrect = correct.includes(option.id);
                return (
                  <div key={option.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label={isCorrect ? "Correct answer" : "Mark as correct"}
                      onClick={() =>
                        setCorrect((prev) =>
                          prev.includes(option.id) ? prev.filter((id) => id !== option.id) : [...prev, option.id]
                        )
                      }
                      className={cn(
                        "shrink-0 rounded-full transition-colors",
                        isCorrect ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                    </button>
                    <span className="w-5 text-sm font-medium text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                    <Input
                      value={option.text}
                      onChange={(e) =>
                        setOptions((prev) => prev.map((o) => (o.id === option.id ? { ...o, text: e.target.value } : o)))
                      }
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      className={cn(isCorrect && "border-emerald-500/60")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={options.length <= 2}
                      onClick={() => {
                        setOptions((prev) => prev.filter((o) => o.id !== option.id));
                        setCorrect((prev) => prev.filter((id) => id !== option.id));
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={options.length >= 10}
                onClick={() => setOptions((prev) => [...prev, { id: newKey(), text: "" }])}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add option
              </Button>
              {correct.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Multiple-answer question: students must select all {correct.length} correct options to get the points.
                </p>
              )}
            </div>
          </div>
        ) : (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="question">Question</TabsTrigger>
              <TabsTrigger value="tests">Test cases ({tests.length})</TabsTrigger>
              <TabsTrigger value="starter">Starter code</TabsTrigger>
              <TabsTrigger value="check">Check solution</TabsTrigger>
            </TabsList>

            <TabsContent value="question" className="space-y-6 pt-4">
              {questionFields}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Languages allowed</Label>
                  <div className="flex flex-wrap gap-2">
                    {EXAM_LANGUAGES.map((lang) => {
                      const on = languages.includes(lang);
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => toggleLanguage(lang)}
                          className={cn(
                            "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
                            on ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                          )}
                        >
                          {LANGUAGE_META[lang].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-time">Time limit (ms)</Label>
                  <Input id="q-time" type="number" min={500} max={10000} step={500} value={timeLimitMs} onChange={(e) => setTimeLimitMs(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Per test. Java gets double.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="q-memory">Memory limit (MB)</Label>
                  <Input id="q-memory" type="number" min={32} max={512} value={memoryLimitMb} onChange={(e) => setMemoryLimitMb(e.target.value)} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tests" className="space-y-4 pt-4">
              <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                <strong className="text-foreground">Sample</strong> tests are shown to students and used by Run.{" "}
                <strong className="text-foreground">Hidden</strong> tests are only used for grading. Points are split by
                weight. Outputs are compared ignoring trailing spaces and blank lines.
              </div>
              {tests.map((test, i) => (
                <div key={test.key} className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">Test {i + 1}</span>
                      {test.isSample ? (
                        <Badge variant="secondary">
                          <Eye className="mr-1 h-3 w-3" /> Sample
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <EyeOff className="mr-1 h-3 w-3" /> Hidden
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <Switch checked={test.isSample} onCheckedChange={(v) => updateTest(test.key, { isSample: v })} />
                        Sample
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        Weight
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={test.weight}
                          onChange={(e) => updateTest(test.key, { weight: e.target.value })}
                          className="h-8 w-16"
                        />
                      </label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={tests.length <= 1}
                        onClick={() => setTests((prev) => prev.filter((t) => t.key !== test.key))}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Input (stdin)</Label>
                      <Textarea
                        value={test.input}
                        onChange={(e) => updateTest(test.key, { input: e.target.value })}
                        rows={3}
                        className="font-mono text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Expected output</Label>
                      <Textarea
                        value={test.expectedOutput}
                        onChange={(e) => updateTest(test.key, { expectedOutput: e.target.value })}
                        rows={3}
                        className="font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={tests.length >= 50}
                onClick={() =>
                  setTests((prev) => [...prev, { key: newKey(), input: "", expectedOutput: "", isSample: false, weight: "1" }])
                }
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Add test case
              </Button>
            </TabsContent>

            <TabsContent value="starter" className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                The code students start with. Java solutions must use a public class named <code>Main</code>.
              </p>
              <div className="flex gap-2">
                {languages.map((lang) => (
                  <Button
                    key={lang}
                    type="button"
                    size="sm"
                    variant={starterLang === lang ? "default" : "outline"}
                    onClick={() => setStarterLang(lang)}
                  >
                    {LANGUAGE_META[lang].label}
                  </Button>
                ))}
              </div>
              <div className="h-[340px] overflow-hidden rounded-lg border">
                <CodeEditor
                  language={starterLang}
                  value={starter[starterLang]}
                  onChange={(v) => setStarter((prev) => ({ ...prev, [starterLang]: v }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="check" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Paste your own solution to make sure the test cases are right before students see them. It isn&apos;t
                saved or shown to students.
              </p>
              <div className="flex items-center gap-3">
                <Select
                  value={solutionLang}
                  onValueChange={(v) => {
                    setSolutionLang(v as ExamLanguage);
                    setSolution(DEFAULT_STARTER_CODE[v as ExamLanguage]);
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>
                        {LANGUAGE_META[l].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={runCheck} disabled={checking}>
                  {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FlaskConical className="mr-2 h-4 w-4" />}
                  Run all {tests.length} tests
                </Button>
              </div>
              <div className="h-[300px] overflow-hidden rounded-lg border">
                <CodeEditor language={solutionLang} value={solution} onChange={setSolution} />
              </div>
              {checkResults && (
                <div className="space-y-2">
                  {checkResults.map((r, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-md border p-3 text-sm">
                      {r.passed ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          Test {i + 1}: {VERDICT_LABEL[r.verdict] ?? r.verdict}
                          {r.timeMs != null && <span className="ml-2 text-xs text-muted-foreground">{r.timeMs} ms</span>}
                        </p>
                        {!r.passed && (r.stdout || r.error) && (
                          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 font-mono text-xs">
                            {r.error || `Output:\n${r.stdout}`}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                  {checkResults.some((r) => r.verdict === "wrong_answer") && (
                    <Button type="button" variant="outline" size="sm" onClick={useSolutionOutputs}>
                      Use my solution&apos;s output as the expected output
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {question ? "Save question" : "Add question"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
