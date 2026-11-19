import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { formatDepartmentSection } from "@/lib/departments";
import { canManageModule } from "@/lib/modules-server";
import { ModuleManager, type ManagerLearner } from "@/components/modules/module-manager";

export default async function TeacherModulePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");

  const { id } = await params;
  const learningModule = await prisma.learningModule.findUnique({
    where: { id },
    include: { lessons: { orderBy: { position: "asc" } } },
  });
  if (!learningModule || !canManageModule(profile, learningModule)) notFound();

  const [progress, badges] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { lesson: { moduleId: id } },
      select: {
        studentId: true,
        isCompleted: true,
        updatedAt: true,
        student: {
          select: { fullName: true, rollNumber: true, department: true, section: true },
        },
      },
    }),
    prisma.moduleBadge.findMany({ where: { moduleId: id }, select: { studentId: true, earnedAt: true } }),
  ]);

  const badgeByStudent = new Map(badges.map((b) => [b.studentId, b.earnedAt]));
  const learnerMap = new Map<string, ManagerLearner>();
  for (const p of progress) {
    const learner = learnerMap.get(p.studentId) ?? {
      studentId: p.studentId,
      name: p.student.fullName,
      rollNumber: p.student.rollNumber,
      classLabel: formatDepartmentSection(p.student.department, p.student.section),
      completedLessons: 0,
      lastActivity: p.updatedAt.toISOString(),
      badgeEarnedAt: badgeByStudent.get(p.studentId)?.toISOString() ?? null,
    };
    if (p.isCompleted) learner.completedLessons += 1;
    if (p.updatedAt.toISOString() > learner.lastActivity) learner.lastActivity = p.updatedAt.toISOString();
    learnerMap.set(p.studentId, learner);
  }
  const learners = [...learnerMap.values()].sort(
    (a, b) => b.completedLessons - a.completedLessons || a.name.localeCompare(b.name)
  );

  return (
    <ModuleManager
      module={{
        id: learningModule.id,
        title: learningModule.title,
        description: learningModule.description,
        category: learningModule.category,
        level: learningModule.level,
        badgeName: learningModule.badgeName,
        status: learningModule.status,
        coverUrl: learningModule.coverUrl,
      }}
      lessons={learningModule.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        durationSec: l.durationSec,
        thumbnailUrl: l.thumbnailUrl,
        videoUrl: l.videoUrl,
      }))}
      learners={learners}
    />
  );
}
