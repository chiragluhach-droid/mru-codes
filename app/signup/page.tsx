import { redirect } from "next/navigation";
import { signupPath } from "@/lib/auth-roles";

// Only students can sign up; teachers are provisioned from the faculty list.
export default function SignupPage() {
  redirect(signupPath("student"));
}
