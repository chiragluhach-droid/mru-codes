/**
 * Code judging for exams, backed by Judge0 (https://judge0.com).
 *
 * Configure with:
 *   JUDGE0_URL            Judge0 base URL. Defaults to the free public instance
 *                         (https://ce.judge0.com), which is fine for trying
 *                         things out; use a self-hosted server or a paid key for
 *                         real exams.
 *   JUDGE0_AUTH_TOKEN     X-Auth-Token for a self-hosted server (optional)
 *   JUDGE0_RAPIDAPI_KEY   key when JUDGE0_URL is the RapidAPI endpoint (optional)
 *
 * Server-only: it reads secrets from the environment.
 */
import { normalizeOutput, type ExamLanguage } from "@/lib/exams";

const DEFAULT_URL = "https://ce.judge0.com";

export type Verdict =
  | "accepted"
  | "wrong_answer"
  | "compile_error"
  | "runtime_error"
  | "time_limit"
  | "internal_error";

export interface ExecutionResult {
  verdict: Exclude<Verdict, "wrong_answer">;
  stdout: string;
  stderr: string;
  compileOutput: string;
  /** Judge0's own message, e.g. the signal for a runtime error */
  message: string;
  timeMs: number | null;
  memoryKb: number | null;
}

export interface Limits {
  timeLimitMs: number;
  memoryLimitMb: number;
}

export interface JudgeTest {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  verdict: Verdict;
  timeMs: number | null;
  memoryKb: number | null;
  /** Program output (trimmed); callers decide whether a student may see it */
  stdout: string;
  /** Compiler or runtime error text, truncated */
  error: string;
}

function baseUrl() {
  return (process.env.JUDGE0_URL?.trim() || DEFAULT_URL).replace(/\/+$/, "");
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  const token = process.env.JUDGE0_AUTH_TOKEN?.trim();
  if (token) h["X-Auth-Token"] = token;
  const rapidKey = process.env.JUDGE0_RAPIDAPI_KEY?.trim();
  if (rapidKey) {
    h["X-RapidAPI-Key"] = rapidKey;
    h["X-RapidAPI-Host"] = new URL(baseUrl()).host;
  }
  return h;
}

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string | null | undefined) => (s ? Buffer.from(s, "base64").toString("utf8") : "");

// ---- Language ids ---------------------------------------------------------
// Judge0 servers number languages differently, so ids are looked up once per
// server from /languages, preferring the newest GCC / JDK.

const LANGUAGE_PATTERNS: Record<ExamLanguage, RegExp> = {
  c: /^C \(GCC ([\d.]+)\)$/,
  cpp: /^C\+\+ \(GCC ([\d.]+)\)$/,
  java: /^Java \((?:OpenJDK|JDK) ([\d.]+)\)$/,
};

let languageIds: Promise<Record<ExamLanguage, number>> | null = null;

function compareVersions(a: string, b: string) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
}

async function loadLanguageIds(): Promise<Record<ExamLanguage, number>> {
  const res = await fetch(`${baseUrl()}/languages`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`Code runner unavailable (${res.status})`);
  const list = (await res.json()) as Array<{ id: number; name: string }>;
  const ids = {} as Record<ExamLanguage, number>;
  for (const lang of Object.keys(LANGUAGE_PATTERNS) as ExamLanguage[]) {
    let best: { id: number; version: string } | null = null;
    for (const { id, name } of list) {
      const version = name.match(LANGUAGE_PATTERNS[lang])?.[1];
      if (version && (!best || compareVersions(version, best.version) > 0)) best = { id, version };
    }
    if (!best) throw new Error(`The code runner does not support ${lang}`);
    ids[lang] = best.id;
  }
  return ids;
}

function getLanguageIds() {
  if (!languageIds) {
    languageIds = loadLanguageIds().catch((err) => {
      languageIds = null; // retry on the next call
      throw err;
    });
  }
  return languageIds;
}

// ---- Execution ------------------------------------------------------------

interface Judge0Submission {
  token?: string;
  status?: { id: number; description: string };
  stdout?: string | null;
  stderr?: string | null;
  compile_output?: string | null;
  message?: string | null;
  time?: string | null;
  memory?: number | null;
  error?: string;
}

const FIELDS = "token,status,stdout,stderr,compile_output,message,time,memory";

function verdictFor(statusId: number): ExecutionResult["verdict"] {
  if (statusId === 3 || statusId === 4) return "accepted"; // 4 = WA when expected_output is sent; we compare ourselves
  if (statusId === 5) return "time_limit";
  if (statusId === 6) return "compile_error";
  if (statusId >= 7 && statusId <= 12) return "runtime_error";
  return "internal_error";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Runs one program on one input. */
export async function execute(
  language: ExamLanguage,
  code: string,
  stdin: string,
  limits: Limits
): Promise<ExecutionResult> {
  const ids = await getLanguageIds();
  // The JVM starts slowly and needs more memory, so Java gets the usual allowance.
  const isJava = language === "java";
  const body = {
    language_id: ids[language],
    source_code: b64(code),
    stdin: b64(stdin.endsWith("\n") || stdin === "" ? stdin : `${stdin}\n`),
    cpu_time_limit: (limits.timeLimitMs / 1000) * (isJava ? 2 : 1),
    wall_time_limit: Math.min(20, (limits.timeLimitMs / 1000) * (isJava ? 2 : 1) * 3 + 2),
    memory_limit: Math.max(limits.memoryLimitMb, isJava ? 256 : 0) * 1024,
  };

  let res = await fetch(`${baseUrl()}/submissions?base64_encoded=true&wait=true&fields=${FIELDS}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (res.status === 429) {
    await sleep(1500);
    res = await fetch(`${baseUrl()}/submissions?base64_encoded=true&wait=true&fields=${FIELDS}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
      cache: "no-store",
    });
  }
  let data = (await res.json().catch(() => ({}))) as Judge0Submission;
  if (!res.ok) {
    throw new Error(res.status === 429 ? "The code runner is busy, try again in a moment" : data.error || `Code runner error (${res.status})`);
  }

  // Servers with wait disabled return just a token: poll until it's done.
  for (let i = 0; data.token && (!data.status || data.status.id <= 2) && i < 40; i++) {
    await sleep(i < 5 ? 300 : 800);
    const poll = await fetch(`${baseUrl()}/submissions/${data.token}?base64_encoded=true&fields=${FIELDS}`, {
      headers: headers(),
      cache: "no-store",
    });
    data = (await poll.json()) as Judge0Submission;
  }

  const statusId = data.status?.id ?? 13;
  return {
    verdict: statusId <= 2 ? "internal_error" : verdictFor(statusId),
    stdout: unb64(data.stdout),
    stderr: unb64(data.stderr),
    compileOutput: unb64(data.compile_output),
    message: unb64(data.message),
    timeMs: data.time ? Math.round(Number(data.time) * 1000) : null,
    memoryKb: data.memory ?? null,
  };
}

const truncate = (s: string, n = 2000) => (s.length > n ? `${s.slice(0, n)}\n…` : s);

function errorText(r: ExecutionResult) {
  if (r.verdict === "compile_error") return truncate(r.compileOutput || r.message);
  if (r.verdict === "runtime_error") return truncate(r.stderr || r.message || "Runtime error");
  if (r.verdict === "time_limit") return "Time limit exceeded";
  if (r.verdict === "internal_error") return truncate(r.message || "The code runner failed on this test");
  return truncate(r.stderr);
}

/**
 * Runs code against test cases (a few at a time). A compile error is the
 * same for every test, so the remaining tests are marked without running.
 */
export async function judge(
  language: ExamLanguage,
  code: string,
  tests: JudgeTest[],
  limits: Limits,
  concurrency = 4
): Promise<TestResult[]> {
  if (tests.length === 0) return [];

  const toResult = (test: JudgeTest, r: ExecutionResult): TestResult => {
    const passed =
      r.verdict === "accepted" && normalizeOutput(r.stdout) === normalizeOutput(test.expectedOutput);
    return {
      testCaseId: test.id,
      passed,
      verdict: r.verdict === "accepted" && !passed ? "wrong_answer" : r.verdict,
      timeMs: r.timeMs,
      memoryKb: r.memoryKb,
      stdout: truncate(normalizeOutput(r.stdout)),
      error: errorText(r),
    };
  };

  const results: TestResult[] = new Array(tests.length);
  const first = await execute(language, code, tests[0].input, limits);
  results[0] = toResult(tests[0], first);
  if (first.verdict === "compile_error") {
    for (let i = 1; i < tests.length; i++) results[i] = { ...results[0], testCaseId: tests[i].id };
    return results;
  }

  let next = 1;
  const worker = async () => {
    while (next < tests.length) {
      const i = next++;
      try {
        results[i] = toResult(tests[i], await execute(language, code, tests[i].input, limits));
      } catch (err) {
        results[i] = {
          testCaseId: tests[i].id,
          passed: false,
          verdict: "internal_error",
          timeMs: null,
          memoryKb: null,
          stdout: "",
          error: err instanceof Error ? err.message : "Code runner error",
        };
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tests.length - 1) }, worker));
  return results;
}
