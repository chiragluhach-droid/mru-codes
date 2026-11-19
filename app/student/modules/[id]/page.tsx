import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { awardBadgeIfComplete } from "@/lib/modules-server";
import { ModulePlayer, type PlayerProgress } from "@/components/modules/module-player";

export default async function StudentModulePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "student") redirect("/teacher/dashboard");

  const { id } = await params;
  const learningModule = await prisma.learningModule.findUnique({
    where: { id },
    include: {
      createdBy: { select: { fullName: true } },
      lessons: { orderBy: { position: "asc" } },
    },
  });
  if (!learningModule || learningModule.status !== "published") notFound();

  // Covers the case where a lesson the student hadn't finished was removed.
  await awardBadgeIfComplete(id, profile.id);

  const [progressRows, badge] = await Promise.all([
    prisma.lessonProgress.findMany({
      where: { studentId: profile.id, lesson: { moduleId: id } },
      select: { lessonId: true, watchedSec: true, lastPositionSec: true, isCompleted: true },
    }),
    prisma.moduleBadge.findUnique({
      where: { moduleId_studentId: { moduleId: id, studentId: profile.id } },
    }),
  ]);

  const progress: Record<string, PlayerProgress> = {};
  for (const p of progressRows) {
    progress[p.lessonId] = {
      watchedSec: p.watchedSec,
      lastPositionSec: p.lastPositionSec,
      isCompleted: p.isCompleted,
    };
  }

  return (
    <ModulePlayer
      module={{
        id: learningModule.id,
        title: learningModule.title,
        level: learningModule.level,
        category: learningModule.category,
        badgeName: learningModule.badgeName,
        teacherName: learningModule.createdBy.fullName,
      }}
      lessons={learningModule.lessons.map((l) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        videoUrl: l.videoUrl,
        thumbnailUrl: l.thumbnailUrl,
        durationSec: l.durationSec,
      }))}
      initialProgress={progress}
      initialBadge={badge ? { credentialId: badge.credentialId, earnedAt: badge.earnedAt.toISOString() } : null}
      studentName={profile.fullName}
    />
  );
}
