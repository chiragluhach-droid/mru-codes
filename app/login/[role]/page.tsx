import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_ROLES, isAuthRole } from "@/lib/auth-roles";

export function generateStaticParams() {
  return AUTH_ROLES.map((role) => ({ role }));
}

export default async function RoleLoginPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!isAuthRole(role)) notFound();

  return <LoginForm role={role} />;
}
