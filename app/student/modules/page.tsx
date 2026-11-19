import { redirect } from "next/navigation";
import { Award, BookOpenCheck, Film, PlayCircle } from "lucide-react";
import { getProfile } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AchievementBadge } from "@/components/modules/achievement-badge";
import { ModuleCard, type ModuleCardData } from "@/components/modules/module-card";

export default async function StudentModulesPage() {
  const profile = await getProfile();
  if (!profile) redirect("/api/auth/signout");
  if (profile.role !== "student") redirect("/teacher/dashboard");

  const [modules, progress, badges] = await Promise.all([
    prisma.learningModule.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
      include: {
        createdBy: { select: { fullName: true } },
        lessons: { select: { durationSec: true, thumbnailUrl: true }, orderBy: { position: "asc" } },
      },
    }),
    prisma.lessonProgress.findMany({
      where: { studentId: profile.id, lesson: { module: { status: "published" } } },
      select: { isCompleted: true, lesson: { select: { moduleId: true } } },
    }),
    prisma.moduleBadge.findMany({
      where: { studentId: profile.id },
      orderBy: { earnedAt: "desc" },
      include: { module: { select: { id: true, title: true, badgeName: true } } },
    }),
  ]);

  const completedByModule = new Map<string, number>();
  const startedModules = new Set<string>();
  for (const p of progress) {
    startedModules.add(p.lesson.moduleId);
    if (p.isCompleted) {
      completedByModule.set(p.lesson.moduleId, (completedByModule.get(p.lesson.moduleId) ?? 0) + 1);
    }
  }
  const badgeModuleIds = new Set(badges.map((b) => b.moduleId));

  const cards: ModuleCardData[] = modules.map((m) => ({
    id: m.id,
    title: m.title,
    category: m.category,
    level: m.level,
    coverUrl: m.coverUrl ?? m.lessons[0]?.thumbnailUrl ?? null,
    teacherName: m.createdBy.fullName,
    lessonCount: m.lessons.length,
    totalSec: m.lessons.reduce((sum, l) => sum + l.durationSec, 0),
    completedLessons: completedByModule.get(m.id) ?? 0,
    started: startedModules.has(m.id),
    completed: badgeModuleIds.has(m.id),
  }));
  const inProgress = cards.filter((c) => c.started && !c.completed);
  const completed = cards.filter((c) => c.completed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Film className="h-8 w-8 text-primary" />
            Modules
          </h1>
          <p className="text-muted-foreground mt-1">
            Video courses from your teachers. Finish every lesson to earn a badge.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="rounded-lg border bg-card px-4 py-2 text-center">
            <p className="text-xl font-semibold">{inProgress.length}</p>
            <p className="text-xs text-muted-foreground">In progress</p>
          </div>
          <div className="rounded-lg border bg-card px-4 py-2 text-center">
            <p className="text-xl font-semibold">{badges.length}</p>
            <p className="text-xs text-muted-foreground">Badges</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={inProgress.length > 0 ? "learning" : "browse"}>
        <TabsList>
          <TabsTrigger value="browse">Browse ({cards.length})</TabsTrigger>
          <TabsTrigger value="learning">My learning ({inProgress.length + completed.length})</TabsTrigger>
          <TabsTrigger value="badges">My badges ({badges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-5">
          {cards.length === 0 ? (
            <EmptyState
              icon={PlayCircle}
              title="No modules yet"
              text="Your teachers haven't published any modules. Check back soon."
            />
          ) : (
            <ModuleGrid modules={cards} />
          )}
        </TabsContent>

        <TabsContent value="learning" className="mt-5 space-y-8">
          {inProgress.length === 0 && completed.length === 0 ? (
            <EmptyState
              icon={BookOpenCheck}
              title="Nothing started yet"
              text="Open any module from Browse and your progress will show up here."
            />
          ) : (
            <>
              {inProgress.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">Continue learning</h2>
                  <ModuleGrid modules={inProgress} />
                </section>
              )}
              {completed.length > 0 && (
                <section className="space-y-3">
                  <h2 className="text-lg font-semibold">Completed</h2>
                  <ModuleGrid modules={completed} />
                </section>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="badges" className="mt-5">
          {badges.length === 0 ? (
            <EmptyState
              icon={Award}
              title="No badges yet"
              text="Complete every lesson in a module to earn its badge."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {badges.map((b) => (
                <Card key={b.id}>
                  <CardContent className="flex flex-col items-center gap-2 p-6 text-center">
                    <AchievementBadge seed={b.module.id} label={b.module.badgeName} size={96} />
                    <p className="font-semibold leading-snug">{b.module.badgeName}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{b.module.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Earned {b.earnedAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <p className="font-mono text-[11px] text-muted-foreground">ID: {b.credentialId}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ModuleGrid({ modules }: { modules: ModuleCardData[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {modules.map((m) => (
        <ModuleCard key={m.id} module={m} />
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Award;
  title: string;
  text: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-14 text-center">
        <div className="mb-3 rounded-full bg-primary/10 p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <p className="font-medium">{title}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
