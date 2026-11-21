import { isStudentDepartment, isValidBatch, isValidSection, parseSemester } from "@/lib/departments";

/**
 * Class targeting shared by assignments, discussions and quiz sessions.
 * A target field left empty (null) means "everyone" for that field, so a
 * target of { CSE, 2K26, null, null } reaches every CSE 2K26 student.
 */

export interface StudentClass {
  department: string | null;
  batch: string | null;
  section: string | null;
  semester: number | null;
}

export interface ClassTarget {
  targetDepartment: string | null;
  targetBatch: string | null;
  targetSection: string | null;
  targetSemester: number | null;
}

function clean(value: string | null | undefined) {
  return value?.trim() || null;
}

/** Prisma `where` fragment: rows whose target includes this student. */
export function classTargetWhere(student: StudentClass) {
  const department = clean(student.department);
  const batch = clean(student.batch);
  const section = clean(student.section);
  return {
    AND: [
      { OR: [{ targetDepartment: null }, ...(department ? [{ targetDepartment: department }] : [])] },
      { OR: [{ targetBatch: null }, ...(batch ? [{ targetBatch: batch }] : [])] },
      { OR: [{ targetSection: null }, ...(section ? [{ targetSection: section }] : [])] },
      { OR: [{ targetSemester: null }, ...(student.semester ? [{ targetSemester: student.semester }] : [])] },
    ],
  };
}

/** Same rule as classTargetWhere, for a single row already loaded. */
export function hasClassAccess(target: Partial<ClassTarget>, student: StudentClass) {
  const matches = (wanted: string | null | undefined, actual: string | null) =>
    !clean(wanted) || clean(wanted) === clean(actual);
  return (
    matches(target.targetDepartment, student.department) &&
    matches(target.targetBatch, student.batch) &&
    matches(target.targetSection, student.section) &&
    (!target.targetSemester || target.targetSemester === student.semester)
  );
}

/**
 * Validates a teacher-chosen target from a request body. Department and batch
 * are required so batches never mix; section and semester are optional.
 */
export function parseClassTarget(
  body: Record<string, unknown>
): { target: ClassTarget } | { error: string } {
  const department = typeof body.targetDepartment === "string" ? body.targetDepartment.trim() : "";
  const batch = typeof body.targetBatch === "string" ? body.targetBatch.trim().toUpperCase() : "";
  const section = typeof body.targetSection === "string" ? body.targetSection.trim().toUpperCase() : "";
  const semesterRaw = body.targetSemester;

  if (!isStudentDepartment(department)) return { error: "Choose the target department" };
  if (!isValidBatch(batch)) return { error: "Choose the target batch" };
  if (section && !isValidSection(section)) return { error: "Choose a valid section" };
  const semester = parseSemester(semesterRaw);
  if (semesterRaw !== undefined && semesterRaw !== null && semesterRaw !== "" && semester === null) {
    return { error: "Choose a valid semester" };
  }

  return {
    target: {
      targetDepartment: department,
      targetBatch: batch,
      targetSection: section || null,
      targetSemester: semester,
    },
  };
}

/**
 * Prisma `where` fragment for teacher report filters (?department=&batch=
 * &section=&semester=). Missing or "all" values don't filter.
 */
export function studentClassFilter(params: URLSearchParams) {
  const pick = (key: string) => {
    const value = params.get(key)?.trim();
    return value && value !== "all" ? value : null;
  };
  const department = pick("department");
  const batch = pick("batch");
  const section = pick("section");
  const semester = parseSemester(pick("semester"));
  return {
    ...(department ? { department } : {}),
    ...(batch ? { batch } : {}),
    ...(section ? { section } : {}),
    ...(semester ? { semester } : {}),
  };
}

/** "Department: CSE • Batch: 2K26 • Section: A" for report headers. */
export function describeStudentClassFilter(params: URLSearchParams) {
  const parts = [
    ["Department", "department"],
    ["Batch", "batch"],
    ["Section", "section"],
    ["Semester", "semester"],
  ]
    .map(([label, key]) => {
      const value = params.get(key)?.trim();
      return value && value !== "all" ? `${label}: ${value}` : null;
    })
    .filter(Boolean);
  return parts.length ? parts.join(" • ") : "All Students";
}
