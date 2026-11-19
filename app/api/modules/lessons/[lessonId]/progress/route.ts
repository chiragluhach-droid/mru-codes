import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getProfile } from "@/lib/supabase/server";
import { requiredWatchSec } from "@/lib/modules";
import { awardBadgeIfComplete } from "@/lib/modules-server";

const bodySchema = z.object({
  /** Seconds of the video actually played (seeking doesn't count). */
  watchedSec: z.number().min(0).max(24 * 3600),
  /** Playback position, used to resume. */
  positionSec: z.number().min(0).max(24 * 3600),
  /** The player reached the end (only used when the duration is unknown). */
  ended: z.boolean().optional(),
});

/** Playback can run at up to 2x, plus slack for reporting intervals. */
const MAX_WATCH_RATE = 2.5;
const SLACK_SEC = 15;
const FIRST_REPORT_MAX_SEC = 30;

// POST: record a student's watch progress; completes the lesson at 90% watched
// and awards the module badge when every lesson is complete.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (profile.role !== "student") {
      return NextResponse.json({ error: "Only students track progress" }, { status: 403 });
    }
    const { lessonId } = await params;

    const lesson = await prisma.moduleLesson.findUnique({
      where: { id: lessonId },
      include: { module: { select: { id: true, status: true } } },
    });
    if (!lesson || lesson.module.status !== "published") {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid progress" }, { status: 400 });
    const { watchedSec, positionSec, ended } = parsed.data;

    const existing = await prisma.lessonProgress.findUnique({
      where: { lessonId_studentId: { lessonId, studentId: profile.id } },
    });

    // Watch time can only grow about as fast as real time passes.
    const previous = existing?.watchedSec ?? 0;
    const maxGain = existing
      ? ((Date.now() - existing.updatedAt.getTime()) / 1000) * MAX_WATCH_RATE + SLACK_SEC
      : FIRST_REPORT_MAX_SEC;
    let watched = Math.max(previous, Math.min(Math.floor(watchedSec), previous + Math.floor(maxGain)));
    if (lesson.durationSec > 0) watched = Math.min(watched, lesson.durationSec);
    const position =
      lesson.durationSec > 0 ? Math.min(Math.floor(positionSec), lesson.durationSec) : Math.floor(positionSec);

    const reachedThreshold =
      lesson.durationSec > 0 ? watched >= requiredWatchSec(lesson.durationSec) : Boolean(ended);
    const completedNow = !existing?.isCompleted && reachedThreshold;

    const progress = await prisma.lessonProgress.upsert({
      where: { lessonId_studentId: { lessonId, studentId: profile.id } },
      create: {
        lessonId,
        studentId: profile.id,
        watchedSec: watched,
        lastPositionSec: position,
        isCompleted: reachedThreshold,
        completedAt: reachedThreshold ? new Date() : null,
      },
      update: {
        watchedSec: watched,
        lastPositionSec: position,
        ...(completedNow ? { isCompleted: true, completedAt: new Date() } : {}),
      },
    });

    const badge = completedNow ? await awardBadgeIfComplete(lesson.module.id, profile.id) : null;

    return NextResponse.json({
      watchedSec: progress.watchedSec,
      isCompleted: progress.isCompleted,
      lessonCompletedNow: completedNow,
      badge: badge ? { credentialId: badge.credentialId, earnedAt: badge.earnedAt } : null,
    });
  } catch (error) {
    console.error("Error saving lesson progress:", error);
    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });
  }
}
