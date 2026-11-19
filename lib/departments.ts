export type StudentDepartment = "CSE" | "AIML" | "FSD" | "GenAI" | "Core";
export type TeacherDepartment = "CST" | "ECE" | "ME" | "R&AI";

export type Department = StudentDepartment | TeacherDepartment;

/** Departments a student can belong to. Every department has a Batch/Section. */
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
 * Batch/Section is a batch number followed by a section letter, e.g. "2A" or
 * "4C". It is stored in the `section` column.
 */
export const BATCH_SECTION_LABEL = "Batch/Section";
export const BATCH_SECTION_PLACEHOLDER = "e.g. 2A, 4C";
export const BATCH_SECTION_FORMAT_MESSAGE =
  "Enter batch number + section letter, e.g. 2A or 4C";
const BATCH_SECTION_PATTERN = /^\d{1,2}[A-Z]$/;

/** Uppercases and strips spaces so " 2a " is stored as "2A". */
export function normalizeBatchSection(value: string | null | undefined) {
  return (value ?? "").replace(/\s+/g, "").toUpperCase();
}

export function isValidBatchSection(value: string | null | undefined) {
  return BATCH_SECTION_PATTERN.test(normalizeBatchSection(value));
}

export function departmentOptionsForRole(role: string | null | undefined) {
  return role === "teacher" ? TEACHER_DEPARTMENT_OPTIONS : DEPARTMENT_OPTIONS;
}

/** Every student department is split into batch/sections. */
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

  if (dept && sec) return `${dept} • ${sec}`;
  if (dept) return dept;
  if (sec) return sec;
  return "—";
}
