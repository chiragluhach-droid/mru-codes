import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { getProfile } from "@/lib/supabase/server";
import { moduleDetailsSchema } from "@/lib/modules";
import { findManageableModule } from "@/lib/modules-server";
import { destroyAsset, getUploadedAsset, moduleFolder } from "@/lib/cloudinary";

const patchSchema = moduleDetailsSchema.partial().extend({
  status: z.enum(["draft", "published", "archived"]).optional(),
  /** Cloudinary public_id of a cover image uploaded into this module's folder; null removes it. */
  coverPublicId: z.string().nullable().optional(),
});

// PATCH: edit details, cover or status (creator or admin teacher)
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

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    const { coverPublicId, status, ...details } = parsed.data;
    const data: Record<string, unknown> = { ...details };
    if (details.description !== undefined) data.description = details.description || null;
    if (details.category !== undefined) data.category = details.category || null;

    if (status && status !== learningModule.status) {
      if (status === "published") {
        const lessons = await prisma.moduleLesson.count({ where: { moduleId: id } });
        if (lessons === 0) {
          return NextResponse.json(
            { error: "Add at least one lesson before publishing" },
            { status: 400 }
          );
        }
        data.publishedAt = learningModule.publishedAt ?? new Date();
      }
      data.status = status;
    }

    if (coverPublicId !== undefined) {
      if (coverPublicId === null) {
        data.coverUrl = null;
      } else {
        if (!coverPublicId.startsWith(`${moduleFolder(id)}/`)) {
          return NextResponse.json({ error: "Invalid cover image" }, { status: 400 });
        }
        const asset = await getUploadedAsset("image", coverPublicId);
        if (!asset) return NextResponse.json({ error: "Cover image not found" }, { status: 400 });
        data.coverUrl = asset.secure_url.replace("/upload/", "/upload/w_960,h_540,c_fill,q_auto,f_auto/");
      }
    }

    const updated = await prisma.learningModule.update({ where: { id }, data });
    return NextResponse.json({ module: updated });
  } catch (error) {
    console.error("Error updating module:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE: remove the module, its lessons, progress and badges, and its videos
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const learningModule = await findManageableModule(profile, id);
    if (!learningModule) return NextResponse.json({ error: "Module not found" }, { status: 404 });

    const lessons = await prisma.moduleLesson.findMany({
      where: { moduleId: id },
      select: { videoPublicId: true },
    });
    await prisma.learningModule.delete({ where: { id } });
    await Promise.all(lessons.map((l) => destroyAsset("video", l.videoPublicId)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting module:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}
