import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getProfile } from "@/lib/supabase/server";
import { findManageableModule } from "@/lib/modules-server";
import { destroyAsset } from "@/lib/cloudinary";

const patchSchema = z.object({
  title: z.string().trim().min(2, "Lesson title is required").max(150).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
});

type Params = { params: Promise<{ id: string; lessonId: string }> };

async function loadLesson(id: string, lessonId: string) {
  const lesson = await prisma.moduleLesson.findUnique({ where: { id: lessonId } });
  return lesson && lesson.moduleId === id ? lesson : null;
}

// PATCH: rename / re-describe a lesson
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, lessonId } = await params;
    if (!(await findManageableModule(profile, id))) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }
    if (!(await loadLesson(id, lessonId))) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const data = { ...parsed.data };
    if (data.description !== undefined) data.description = data.description || null;

    const lesson = await prisma.moduleLesson.update({ where: { id: lessonId }, data });
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error("Error updating lesson:", error);
    return NextResponse.json({ error: "Failed to update lesson" }, { status: 500 });
  }
}

// DELETE: remove a lesson and its video
export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, lessonId } = await params;
    const learningModule = await findManageableModule(profile, id);
    if (!learningModule) return NextResponse.json({ error: "Module not found" }, { status: 404 });
    const lesson = await loadLesson(id, lessonId);
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

    const remaining = await prisma.moduleLesson.count({ where: { moduleId: id } });
    if (learningModule.status === "published" && remaining <= 1) {
      return NextResponse.json(
        { error: "A published module needs at least one lesson. Unpublish it first." },
        { status: 400 }
      );
    }

    await prisma.moduleLesson.delete({ where: { id: lessonId } });
    await destroyAsset("video", lesson.videoPublicId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    return NextResponse.json({ error: "Failed to delete lesson" }, { status: 500 });
  }
}
