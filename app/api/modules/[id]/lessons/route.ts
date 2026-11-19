import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getProfile } from "@/lib/supabase/server";
import { findManageableModule } from "@/lib/modules-server";
import { getUploadedAsset, moduleFolder, videoThumbnailUrl } from "@/lib/cloudinary";

const createSchema = z.object({
  title: z.string().trim().min(2, "Lesson title is required").max(150),
  description: z.string().trim().max(2000).optional().nullable(),
  /** public_id returned by Cloudinary after the browser uploaded the video. */
  publicId: z.string().min(1),
});

const reorderSchema = z.object({ order: z.array(z.string().uuid()).min(1) });

// POST: add a lesson whose video was just uploaded to Cloudinary
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const learningModule = await findManageableModule(profile, id);
    if (!learningModule) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { title, description, publicId } = parsed.data;

    // Trust Cloudinary, not the browser, for the URL and duration.
    if (!publicId.startsWith(`${moduleFolder(id)}/`)) {
      return NextResponse.json({ error: "Invalid video" }, { status: 400 });
    }
    const asset = await getUploadedAsset("video", publicId);
    if (!asset) {
      return NextResponse.json({ error: "Uploaded video not found. Please upload again." }, { status: 400 });
    }

    const last = await prisma.moduleLesson.findFirst({
      where: { moduleId: id },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    const lesson = await prisma.moduleLesson.create({
      data: {
        moduleId: id,
        title,
        description: description || null,
        videoUrl: asset.secure_url,
        videoPublicId: asset.public_id,
        thumbnailUrl: videoThumbnailUrl(asset.public_id),
        durationSec: Math.round(asset.duration ?? 0),
        position: (last?.position ?? -1) + 1,
      },
    });

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error) {
    console.error("Error creating lesson:", error);
    return NextResponse.json({ error: "Failed to add lesson" }, { status: 500 });
  }
}

// PATCH { order: lessonId[] }: reorder lessons
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const learningModule = await findManageableModule(profile, id);
    if (!learningModule) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const parsed = reorderSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid order" }, { status: 400 });

    const existing = await prisma.moduleLesson.findMany({
      where: { moduleId: id },
      select: { id: true },
    });
    const ids = new Set(existing.map((l) => l.id));
    const order = parsed.data.order;
    if (order.length !== ids.size || !order.every((lessonId) => ids.has(lessonId))) {
      return NextResponse.json({ error: "Order must list every lesson once" }, { status: 400 });
    }

    await prisma.$transaction(
      order.map((lessonId, position) =>
        prisma.moduleLesson.update({ where: { id: lessonId }, data: { position } })
      )
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering lessons:", error);
    return NextResponse.json({ error: "Failed to reorder lessons" }, { status: 500 });
  }
}
