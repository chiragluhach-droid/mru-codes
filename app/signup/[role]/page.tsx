import { notFound, redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { loginPath } from "@/lib/auth-roles";

export function generateStaticParams() {
  return [{ role: "student" }];
}

export default async function RoleSignupPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  // There is no teacher signup: faculty accounts come from lib/faculty.ts.
  if (role === "teacher") redirect(loginPath("teacher"));
  if (role !== "student") notFound();

  return <SignupForm />;
}
