import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getProfile } from "@/lib/supabase/server";
import { moduleDetailsSchema } from "@/lib/modules";

// POST: create a module (teachers only). Lessons are added afterwards.
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (profile.role !== "teacher") {
      return NextResponse.json({ error: "Only teachers can create modules" }, { status: 403 });
    }

    const parsed = moduleDetailsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const learningModule = await prisma.learningModule.create({
      data: {
        title: parsed.data.title!,
        description: parsed.data.description || null,
        category: parsed.data.category || null,
        level: parsed.data.level!,
        badgeName: parsed.data.badgeName!,
        createdById: profile.id,
      },
    });

    return NextResponse.json({ module: learningModule }, { status: 201 });
  } catch (error) {
    console.error("Error creating module:", error);
    return NextResponse.json({ error: "Failed to create module" }, { status: 500 });
  }
}
