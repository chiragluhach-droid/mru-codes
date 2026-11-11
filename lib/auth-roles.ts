export type AuthRole = "student" | "teacher";

export const AUTH_ROLES: readonly AuthRole[] = ["student", "teacher"];

export const ROLE_LABEL: Record<AuthRole, string> = {
  student: "Student",
  teacher: "Teacher",
};

export function isAuthRole(value: unknown): value is AuthRole {
  return value === "student" || value === "teacher";
}

/** `/login/student`, `/login/teacher`, or the role picker at `/login`. */
export function loginPath(role?: AuthRole | null) {
  return role ? `/login/${role}` : "/login";
}

/** `/signup/student`, `/signup/teacher`, or the role picker at `/signup`. */
export function signupPath(role?: AuthRole | null) {
  return role ? `/signup/${role}` : "/signup";
}

export function dashboardPath(role: AuthRole) {
  return role === "teacher" ? "/teacher/dashboard" : "/student/dashboard";
}
