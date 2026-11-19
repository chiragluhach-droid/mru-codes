import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, Clock, Film, PlayCircle, Plus, Users } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { canEditDeleteAnyQuiz } from "@/lib/admin-teachers";
import { badgeTheme, formatDuration, levelLabel } from "@/lib/modules";

export default async function TeacherModulesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "teacher") redirect("/student/dashboard");

  const isAdmin = canEditDeleteAnyQuiz(profile.email);
  const modules = await prisma.learningModule.findMany({
    where: isAdmin ? {} : { createdById: profile.id },
    orderBy: { updatedAt: "desc" },
    include: {
      createdBy: { select: { fullName: true } },
      lessons: { select: { durationSec: true, thumbnailUrl: true }, orderBy: { position: "asc" } },
      _count: { select: { badges: true } },
    },
  });

  // Distinct students who started each module.
  const progress = await prisma.lessonProgress.findMany({
    where: { lesson: { moduleId: { in: modules.map((m) => m.id) } } },
    select: { studentId: true, lesson: { select: { moduleId: true } } },
  });
  const learners = new Map<string, Set<string>>();
  for (const p of progress) {
    const set = learners.get(p.lesson.moduleId) ?? new Set<string>();
    set.add(p.studentId);
    learners.set(p.lesson.moduleId, set);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-primary" />
            Modules
          </h1>
          <p className="text-muted-foreground mt-1">
            Build video courses. Students earn a badge when they finish every lesson.
          </p>
        </div>
        <Button asChild>
          <Link href="/teacher/modules/new">
            <Plus className="h-4 w-4 mr-2" />
            New module
          </Link>
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <PlayCircle className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Create your first module</h2>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-6">
              Group your video lessons into a module, publish it, and track how students progress.
            </p>
            <Button asChild>
              <Link href="/teacher/modules/new">
                <Plus className="h-4 w-4 mr-2" />
                New module
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => {
            const totalSec = m.lessons.reduce((sum, l) => sum + l.durationSec, 0);
            const cover = m.coverUrl ?? m.lessons[0]?.thumbnailUrl ?? null;
            const theme = badgeTheme(m.id);
            return (
              <Link key={m.id} href={`/teacher/modules/${m.id}`} className="group">
                <Card className="h-full overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
                  <div
                    className="relative aspect-video bg-cover bg-center"
                    style={
                      cover
                        ? { backgroundImage: `url(${cover})` }
                        : { backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }
                    }
                  >
                    {!cover && (
                      <Film className="absolute inset-0 m-auto h-10 w-10 text-white/80" />
                    )}
                    <div className="absolute left-3 top-3">
                      <Badge
                        className={
                          m.status === "published"
                            ? "bg-green-600 text-white hover:bg-green-600"
                            : "bg-background/90 text-foreground hover:bg-background/90"
                        }
                      >
                        {m.status === "published" ? "Published" : m.status === "archived" ? "Archived" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {levelLabel(m.level)}
                        {m.category ? ` · ${m.category}` : ""}
                        {isAdmin && m.createdById !== profile.id ? ` · by ${m.createdBy.fullName}` : ""}
                      </p>
                      <h3 className="font-semibold leading-snug line-clamp-2 mt-0.5">{m.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-3.5 w-3.5" />
                        {m.lessons.length} {m.lessons.length === 1 ? "lesson" : "lessons"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDuration(totalSec)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {learners.get(m.id)?.size ?? 0} learners
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        {m._count.badges} completed
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
