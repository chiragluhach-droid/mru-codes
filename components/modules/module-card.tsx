import Link from "next/link";
import { CheckCircle2, Clock, Film, PlayCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { badgeTheme, formatDuration, levelLabel, percent } from "@/lib/modules";

export interface ModuleCardData {
  id: string;
  title: string;
  category: string | null;
  level: string;
  coverUrl: string | null;
  teacherName: string;
  lessonCount: number;
  totalSec: number;
  completedLessons: number;
  /** The student has watched any part of any lesson. */
  started: boolean;
  completed: boolean;
}

/** Catalog card for a module, LinkedIn Learning style. */
export function ModuleCard({ module: m }: { module: ModuleCardData }) {
  const theme = badgeTheme(m.id);
  const pct = percent(m.completedLessons, m.lessonCount);

  return (
    <Link href={`/student/modules/${m.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all group-hover:shadow-lg group-hover:-translate-y-0.5">
        <div
          className="relative aspect-video bg-cover bg-center"
          style={
            m.coverUrl
              ? { backgroundImage: `url(${m.coverUrl})` }
              : { backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }
          }
        >
          {!m.coverUrl && <Film className="absolute inset-0 m-auto h-10 w-10 text-white/80" />}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <PlayCircle className="h-12 w-12 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {m.completed && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-green-600 px-2 py-0.5 text-xs font-medium text-white">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Completed
            </span>
          )}
          <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white">
            {formatDuration(m.totalSec)}
          </span>
        </div>
        <CardContent className="space-y-3 p-4">
          <div>
            <p className="text-xs text-muted-foreground">
              {levelLabel(m.level)}
              {m.category ? ` · ${m.category}` : ""}
            </p>
            <h3 className="mt-0.5 line-clamp-2 font-semibold leading-snug">{m.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">By {m.teacherName}</p>
          </div>
          {m.started && !m.completed ? (
            <div className="space-y-1">
              <Progress value={pct} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {pct}% complete · {m.completedLessons}/{m.lessonCount} lessons
              </p>
            </div>
          ) : (
            <p className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <PlayCircle className="h-3.5 w-3.5" />
                {m.lessonCount} {m.lessonCount === 1 ? "lesson" : "lessons"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDuration(m.totalSec)}
              </span>
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
