import { notFound } from "next/navigation";
import { FacultySetupForm } from "@/components/auth/faculty-setup-form";

export function generateStaticParams() {
  return [{ role: "teacher" }];
}

/** /login/teacher/setup — students sign up instead, so there is no student variant. */
export default async function FacultySetupPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (role !== "teacher") notFound();

  return <FacultySetupForm />;
}
