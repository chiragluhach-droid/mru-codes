import { notFound } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { AUTH_ROLES, isAuthRole } from "@/lib/auth-roles";

export function generateStaticParams() {
  return AUTH_ROLES.map((role) => ({ role }));
}

export default async function RoleLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ role: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { role } = await params;
  if (!isAuthRole(role)) notFound();
  const { error } = await searchParams;

  return <LoginForm role={role} notAllowed={error === "not-allowed"} />;
}
