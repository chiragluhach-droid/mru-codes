import { SIGNUP_BATCH_OPTIONS, inferBatch } from "@/lib/departments";
import { isTeacherEmail } from "@/lib/faculty";

export const STUDENT_SIGNUP_CLOSED_MESSAGE =
  "Use your university email (e.g. name25@mru.ac.in). Students from batches 2K22 to 2K26 can create an account.";

/**
 * New student accounts need a university email whose year (the two digits
 * before "@mru.ac.in") is an open batch. Students who signed up before this
 * rule (including with Gmail) keep their access.
 */
export function isAllowedStudentEmail(email: string | null | undefined) {
  const normalized = (email ?? "").trim().toLowerCase();
  if (isTeacherEmail(normalized)) return false;
  const batch = inferBatch(normalized);
  return batch !== null && (SIGNUP_BATCH_OPTIONS as readonly string[]).includes(batch);
}
