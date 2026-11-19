import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import { findManageableModule } from "@/lib/modules-server";
import { createSignedUpload, moduleFolder } from "@/lib/cloudinary";

// POST { kind: "video" | "image" }: signed params for a direct browser upload
// into this module's Cloudinary folder (creator or admin teacher only).
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

    const body = await request.json().catch(() => ({}));
    const kind = body?.kind === "image" ? "image" : "video";

    return NextResponse.json(createSignedUpload(kind, moduleFolder(id)));
  } catch (error) {
    console.error("Error signing upload:", error);
    return NextResponse.json({ error: "Uploads are not available right now" }, { status: 500 });
  }
}
