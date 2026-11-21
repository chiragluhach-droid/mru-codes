import { redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/nav";
import { DashboardHeader } from "@/components/dashboard/header";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { isStudentDepartment, isValidBatch, isValidSection, isValidSemester } from "@/lib/departments";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  if (!profile) {
    redirect("/api/auth/signout");
  }

  // Double-check role (middleware should have caught this, but just in case)
  if (profile.role !== "student") {
    redirect("/teacher/dashboard");
  }

  // Transform Prisma profile to match component props
  const profileData = {
    id: profile.id,
    email: profile.email,
    full_name: profile.fullName,
    roll_number: profile.rollNumber,
    section: profile.section,
    role: profile.role as "student" | "teacher",
    avatar_url: profile.avatarUrl,
    total_points: profile.totalScore,
    created_at: profile.createdAt.toISOString(),
    updated_at: profile.updatedAt.toISOString(),
  };

  // Teachers target work by department, batch, section and semester, so a
  // student missing any of them (e.g. accounts from before batches existed)
  // wouldn't see their class's assignments.
  const needsClassUpdate =
    !isStudentDepartment(profile.department) ||
    !isValidBatch(profile.batch) ||
    !isValidSection(profile.section) ||
    !isValidSemester(profile.semester);

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <DashboardHeader profile={profileData} />
      {needsClassUpdate && (
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm flex items-center justify-center gap-2 text-center">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            Please complete your department, batch, semester and section so you see your class&apos;s
            assignments and quizzes.{" "}
            <Link href="/student/settings" className="font-medium text-primary underline-offset-4 hover:underline">
              Update now
            </Link>
          </span>
        </div>
      )}
      <div className="relative flex flex-1 min-h-0 overflow-hidden">
        <DashboardNav role={profile.role} />
        <main className="flex-1 min-h-0 p-3 sm:p-4 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:ml-56 lg:p-8 lg:pb-8 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
      <MobileNav role={profile.role} />
    </div>
  );
}

