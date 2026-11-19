import { redirect } from "next/navigation";
import { signupPath } from "@/lib/auth-roles";

// The form has a Student/Teacher toggle; start on Student.
export default function SignupPage() {
  redirect(signupPath("student"));
}
