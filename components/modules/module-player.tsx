"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  PartyPopper,
  PlayCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { AchievementBadge } from "@/components/modules/achievement-badge";
import { cn } from "@/lib/utils";
import { formatClock, formatDuration, levelLabel, percent, requiredWatchSec } from "@/lib/modules";

export interface PlayerLesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  durationSec: number;
}

export interface PlayerProgress {
  watchedSec: number;
  lastPositionSec: number;
  isCompleted: boolean;
}

export interface PlayerBadge {
  credentialId: string;
  earnedAt: string;
}

interface ModulePlayerProps {
  module: {
    id: string;
    title: string;
    level: string;
    category: string | null;
    badgeName: string;
    teacherName: string;
  };
  lessons: PlayerLesson[];
  initialProgress: Record<string, PlayerProgress>;
  initialBadge: PlayerBadge | null;
  studentName: string;
}

/** How often progress is saved while a video plays. */
const REPORT_EVERY_MS = 10_000;
/** Gaps larger than this between timeupdates are seeks, not watching. */
const MAX_TICK_SEC = 3;
const AUTO_ADVANCE_SEC = 5;

export function ModulePlayer({ module: m, lessons, initialProgress, initialBadge, studentName }: ModulePlayerProps) {
  const [progress, setProgress] = useState<Record<string, PlayerProgress>>(initialProgress);
  const [badge, setBadge] = useState<PlayerBadge | null>(initialBadge);
  const [showBadge, setShowBadge] = useState(false);
  const [currentId, setCurrentId] = useState(() => {
    const firstIncomplete = lessons.find((l) => !initialProgress[l.id]?.isCompleted);
    return (firstIncomplete ?? lessons[0])?.id;
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [liveWatched, setLiveWatched] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const watchedRef = useRef(0); // seconds actually played for the current lesson
  const positionRef = useRef(0); // playback position of the current lesson
  const lastTimeRef = useRef<number | null>(null);
  const lastReportRef = useRef(0);
  const reportingRef = useRef(false);

  const currentIndex = lessons.findIndex((l) => l.id === currentId);
  const current = lessons[currentIndex];
  const next = lessons[currentIndex + 1];
  const prev = lessons[currentIndex - 1];
  const completedCount = lessons.filter((l) => progress[l.id]?.isCompleted).length;
  const modulePct = percent(completedCount, lessons.length);
  const currentProgress = current ? progress[current.id] : undefined;
  const required = current ? requiredWatchSec(current.durationSec) : 0;

  const report = useCallback(
    async (lessonId: string, options: { ended?: boolean; beacon?: boolean } = {}) => {
      const payload = {
        watchedSec: Math.floor(watchedRef.current),
        positionSec: Math.floor(positionRef.current),
        ended: options.ended ?? false,
      };
      const url = `/api/modules/lessons/${lessonId}/progress`;
      lastReportRef.current = Date.now();

      if (options.beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: "application/json" }));
        return;
      }
      if (reportingRef.current && !options.ended) return;
      reportingRef.current = true;
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!response.ok) return;
        const result = (await response.json()) as {
          watchedSec: number;
          isCompleted: boolean;
          lessonCompletedNow: boolean;
          badge: PlayerBadge | null;
        };
        watchedRef.current = Math.max(watchedRef.current, result.watchedSec);
        setProgress((prevProgress) => ({
          ...prevProgress,
          [lessonId]: {
            watchedSec: result.watchedSec,
            lastPositionSec: payload.positionSec,
            isCompleted: result.isCompleted,
          },
        }));
        if (result.lessonCompletedNow && !result.badge) toast.success("Lesson completed");
        if (result.badge) {
          setBadge(result.badge);
          setShowBadge(true);
        }
      } catch {
        // Network blip; the next report will catch up.
      } finally {
        reportingRef.current = false;
      }
    },
    []
  );

  // Reset tracking when the lesson changes.
  useEffect(() => {
    if (!current) return;
    watchedRef.current = progress[current.id]?.watchedSec ?? 0;
    positionRef.current = progress[current.id]?.lastPositionSec ?? 0;
    setLiveWatched(watchedRef.current);
    lastTimeRef.current = null;
    setCountdown(null);
  }, [currentId]); // only on lesson switch

  // Save progress when leaving the page or hiding the tab.
  useEffect(() => {
    const lessonId = currentId;
    if (!lessonId) return;
    const onHide = () => {
      if (document.visibilityState === "hidden" && watchedRef.current > 0) report(lessonId, { beacon: true });
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      if (watchedRef.current > 0) report(lessonId, { beacon: true });
    };
  }, [currentId, report]);

  // Auto-advance countdown after a lesson ends.
  useEffect(() => {
    if (countdown === null) return;
    if (countdown <= 0) {
      if (next) setCurrentId(next.id);
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => (c === null ? null : c - 1)), 1000);
    return () => clearTimeout(timer);
  }, [countdown, next]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video || !current) return;
    const resumeAt = progress[current.id]?.lastPositionSec ?? 0;
    if (!progress[current.id]?.isCompleted && resumeAt > 5 && resumeAt < video.duration - 5) {
      video.currentTime = resumeAt;
    }
    lastTimeRef.current = video.currentTime;
    positionRef.current = video.currentTime;
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !current) return;
    const now = video.currentTime;
    const last = lastTimeRef.current;
    lastTimeRef.current = now;
    positionRef.current = now;
    if (last === null || video.seeking || video.paused) return;
    const delta = now - last;
    if (delta > 0 && delta <= MAX_TICK_SEC * Math.max(1, video.playbackRate)) {
      watchedRef.current += delta;
      if (Math.floor(watchedRef.current) !== Math.floor(liveWatched)) setLiveWatched(watchedRef.current);
    }
    if (Date.now() - lastReportRef.current >= REPORT_EVERY_MS) report(current.id);
  };

  const handleEnded = () => {
    if (!current) return;
    positionRef.current = 0; // start from the beginning if rewatched
    report(current.id, { ended: true });
    if (next) setCountdown(AUTO_ADVANCE_SEC);
  };

  const goTo = (lessonId: string) => {
    if (current && watchedRef.current > 0) report(current.id);
    setCurrentId(lessonId);
  };

  if (!current) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-muted-foreground">This module has no lessons yet.</CardContent>
      </Card>
    );
  }

  const lessonWatchPct = currentProgress?.isCompleted
    ? 100
    : required > 0
      ? Math.min(100, Math.round((Math.max(liveWatched, currentProgress?.watchedSec ?? 0) / required) * 100))
      : 0;

  return (
    <div className="space-y-4">
      <Link
        href="/student/modules"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        All modules
      </Link>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Player + lesson info */}
        <div className="min-w-0 space-y-4">
          <div className="relative overflow-hidden rounded-xl bg-black shadow-lg">
            <video
              ref={videoRef}
              key={current.id}
              src={current.videoUrl}
              poster={current.thumbnailUrl ?? undefined}
              controls
              playsInline
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPause={() => watchedRef.current > 0 && report(current.id)}
              onEnded={handleEnded}
              className="aspect-video w-full"
            />
            {countdown !== null && next && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 p-4 text-center text-white">
                <p className="text-sm text-white/70">Up next in {countdown}s</p>
                <p className="max-w-md text-lg font-semibold">{next.title}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setCountdown(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => goTo(next.id)}>
                    Play now
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                Lesson {currentIndex + 1} of {lessons.length}
              </p>
              <h1 className="text-xl font-bold leading-snug sm:text-2xl">{current.title}</h1>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" disabled={!prev} onClick={() => prev && goTo(prev.id)}>
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>
              <Button size="sm" disabled={!next} onClick={() => next && goTo(next.id)}>
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                {currentProgress?.isCompleted ? (
                  <span className="flex items-center gap-1.5 font-medium text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Lesson completed
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Watch at least 90% of the video to complete this lesson
                  </span>
                )}
                <span className="shrink-0 text-xs text-muted-foreground">{lessonWatchPct}%</span>
              </div>
              <Progress
                value={lessonWatchPct}
                className="h-1.5"
                indicatorClassName={currentProgress?.isCompleted ? "bg-green-600" : undefined}
              />
              {current.description && (
                <p className="whitespace-pre-line pt-1 text-sm text-muted-foreground">{current.description}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {levelLabel(m.level)}
                  {m.category ? ` · ${m.category}` : ""} · By {m.teacherName}
                </p>
                <h2 className="font-semibold leading-snug">{m.title}</h2>
              </div>
              <div className="space-y-1">
                <Progress value={modulePct} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {completedCount} of {lessons.length} lessons complete · {modulePct}%
                </p>
              </div>
              {badge ? (
                <button
                  type="button"
                  onClick={() => setShowBadge(true)}
                  className="flex w-full items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-2.5 text-left transition-colors hover:bg-green-500/15"
                >
                  <AchievementBadge seed={m.id} label={m.badgeName} size={40} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">Badge earned</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.badgeName}</span>
                  </span>
                </button>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border p-2.5">
                  <AchievementBadge seed={m.id} label={m.badgeName} size={40} earned={false} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{m.badgeName}</span>
                    <span className="block text-xs text-muted-foreground">Complete all lessons to earn it</span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b px-4 py-3 text-sm font-semibold">Contents</div>
            <ol className="max-h-[60vh] overflow-y-auto">
              {lessons.map((lesson, index) => {
                const done = progress[lesson.id]?.isCompleted;
                const active = lesson.id === current.id;
                return (
                  <li key={lesson.id}>
                    <button
                      type="button"
                      onClick={() => goTo(lesson.id)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                        active ? "bg-primary/10" : "hover:bg-accent/50"
                      )}
                    >
                      <span className="mt-0.5 shrink-0">
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500" />
                        ) : active ? (
                          <PlayCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-sm leading-snug", active && "font-medium")}>
                          {index + 1}. {lesson.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{formatClock(lesson.durationSec)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="border-t px-4 py-2 text-xs text-muted-foreground">
              Total {formatDuration(lessons.reduce((sum, l) => sum + l.durationSec, 0))}
            </div>
          </Card>
        </aside>
      </div>

      {/* Badge / celebration */}
      <Dialog open={showBadge && Boolean(badge)} onOpenChange={setShowBadge}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <div className="mb-1 flex items-center justify-center gap-2 text-primary">
              <PartyPopper className="h-5 w-5" />
            </div>
            <DialogTitle className="text-center text-xl">Congratulations, {studentName.split(" ")[0]}!</DialogTitle>
            <DialogDescription className="text-center">
              You completed every lesson in &ldquo;{m.title}&rdquo; and earned a badge.
            </DialogDescription>
          </DialogHeader>
          {badge && (
            <div className="flex flex-col items-center gap-2 py-2 text-center">
              <AchievementBadge seed={m.id} label={m.badgeName} size={140} />
              <p className="text-lg font-semibold">{m.badgeName}</p>
              <p className="text-sm text-muted-foreground">
                Earned{" "}
                {new Date(badge.earnedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p className="font-mono text-xs text-muted-foreground">Credential ID: {badge.credentialId}</p>
              <Button asChild variant="outline" className="mt-2">
                <Link href="/student/modules">See all my badges</Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
