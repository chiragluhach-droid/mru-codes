import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExamDetailsForm } from "@/components/exams/exam-details-form";

export default async function NewExamPage() {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/teacher/exams" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Exams
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>New exam</CardTitle>
          <CardDescription>Set the timing and class first. You&apos;ll add questions on the next page.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExamDetailsForm />
        </CardContent>
      </Card>
    </div>
  );
}
