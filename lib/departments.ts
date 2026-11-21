export type StudentDepartment = "CSE" | "AIML" | "FSD" | "GenAI" | "Core";
export type TeacherDepartment = "CST" | "ECE" | "ME" | "R&AI";

export type Department = StudentDepartment | TeacherDepartment;

/** Departments a student can belong to. */
export const DEPARTMENT_OPTIONS: Array<{ value: StudentDepartment; label: string }> = [
  { value: "CSE", label: "CSE" },
  { value: "AIML", label: "AIML" },
  { value: "FSD", label: "FSD" },
  { value: "GenAI", label: "GenAI" },
  { value: "Core", label: "Core" },
];

export function isStudentDepartment(value: unknown): value is StudentDepartment {
  return DEPARTMENT_OPTIONS.some((opt) => opt.value === value);
}

/** Departments a teacher can belong to. Teachers are never tied to a section. */
export const TEACHER_DEPARTMENT_OPTIONS: Array<{ value: TeacherDepartment; label: string }> = [
  { value: "CST", label: "CST" },
  { value: "ECE", label: "ECE" },
  { value: "ME", label: "ME" },
  { value: "R&AI", label: "R&AI" },
];

/**
 * A student's class is department + batch (admission year, e.g. "2K26") +
 * section (letter) + semester (1-8). Teachers target assignments, quizzes and
 * discussions with the same four fields; an empty field means "all".
 */
export const SECTION_OPTIONS = ["A", "B", "C", "D", "E", "F"] as const;
export type Section = (typeof SECTION_OPTIONS)[number];

/** Batches teachers can target (newest first). */
export const BATCH_OPTIONS = ["2K26", "2K25", "2K24", "2K23", "2K22"] as const;
/** Batches that may register right now (see lib/student-allowlist.ts). */
export const SIGNUP_BATCH_OPTIONS = ["2K26"] as const;

export const SEMESTER_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export function isValidSection(value: unknown): value is Section {
  return typeof value === "string" && (SECTION_OPTIONS as readonly string[]).includes(value);
}

export function isValidBatch(value: unknown): boolean {
  return typeof value === "string" && /^2K\d\d$/.test(value);
}

export function isValidSemester(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 8;
}

/** Parses a semester from a form/query value; null when absent or invalid. */
export function parseSemester(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return isValidSemester(n) ? n : null;
}

/**
 * A student's batch from their university email (name_26@mru.ac.in) or roll
 * number (2K26...); the two always agree. Null when neither says.
 */
export function inferBatch(email: string | null | undefined, rollNumber?: string | null) {
  const fromEmail = (email ?? "").toLowerCase().match(/(\d\d)@mru\.ac\.in$/)?.[1];
  const fromRoll = (rollNumber ?? "").toUpperCase().replace(/\s/g, "").match(/^2K(\d\d)/)?.[1];
  const year = fromEmail ?? fromRoll;
  return year ? `2K${year}` : null;
}

/** formatClass for a row with target* fields (assignments, discussions). */
export function formatTarget(row: {
  targetDepartment?: string | null;
  targetBatch?: string | null;
  targetSection?: string | null;
  targetSemester?: number | null;
}) {
  return formatClass({
    department: row.targetDepartment,
    batch: row.targetBatch,
    section: row.targetSection,
    semester: row.targetSemester,
  });
}

/** "AIML • 2K26 • Sec A • Sem 1", skipping parts that are empty. */
export function formatClass(target: {
  department?: string | null;
  batch?: string | null;
  section?: string | null;
  semester?: number | null;
}) {
  const parts = [
    target.department?.trim() || null,
    target.batch?.trim() || null,
    target.section?.trim() ? `Sec ${target.section.trim()}` : null,
    target.semester ? `Sem ${target.semester}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(" • ") : "All students";
}

export function departmentOptionsForRole(role: string | null | undefined) {
  return role === "teacher" ? TEACHER_DEPARTMENT_OPTIONS : DEPARTMENT_OPTIONS;
}

/** Every student department is split into sections. */
export function departmentRequiresSection(dept: Department | null | undefined) {
  return isStudentDepartment(dept);
}

/**
 * Section applies to students only. A teacher never selects one, whatever
 * their department is named.
 */
export function roleRequiresSection(
  role: string | null | undefined,
  dept: Department | null | undefined
) {
  if (role === "teacher") return false;
  return departmentRequiresSection(dept);
}

export function formatDepartmentSection(
  department: string | null | undefined,
  section: string | null | undefined
) {
  const dept = typeof department === "string" && department.trim() ? department.trim() : null;
  const sec = typeof section === "string" && section.trim() ? section.trim() : null;

  if (dept && sec) return `${dept} • Sec ${sec}`;
  if (dept) return dept;
  if (sec) return `Sec ${sec}`;
  return "—";
}
