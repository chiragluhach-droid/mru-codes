import { notFound } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { AUTH_ROLES, isAuthRole } from "@/lib/auth-roles";

export function generateStaticParams() {
  return AUTH_ROLES.map((role) => ({ role }));
}

/** /signup/student (university email, open batches) and /signup/teacher (faculty list). */
export default async function RoleSignupPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isAuthRole(role)) notFound();

  return <SignupForm role={role} />;
}
