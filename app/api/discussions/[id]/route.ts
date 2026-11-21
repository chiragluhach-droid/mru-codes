import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { hasClassAccess, type ClassTarget, type StudentClass } from "@/lib/class-targeting";

/** Teachers see every thread; students only threads targeted at their class. */
function hasThreadAccess(
  thread: Partial<ClassTarget>,
  profile: StudentClass & { role: string }
) {
  return profile.role !== "student" || hasClassAccess(thread, profile);
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const thread = await prisma.discussionThread.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
            department: true,
            section: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Discussion thread not found" }, { status: 404 });
    }

    if (!hasThreadAccess(thread, profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ thread });
  } catch (error) {
    console.error("Error fetching discussion thread:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussion thread" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const existing = await prisma.discussionThread.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Discussion thread not found" }, { status: 404 });
    }

    const body = await request.json();
    const isPinned = typeof body.isPinned === "boolean" ? body.isPinned : undefined;
    const isClosed = typeof body.isClosed === "boolean" ? body.isClosed : undefined;

    if (isPinned === undefined && isClosed === undefined) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const updated = await prisma.discussionThread.update({
      where: { id },
      data: {
        ...(isPinned !== undefined && { isPinned }),
        ...(isClosed !== undefined && { isClosed }),
      },
    });

    return NextResponse.json({ thread: updated });
  } catch (error) {
    console.error("Error updating discussion thread:", error);
    return NextResponse.json(
      { error: "Failed to update discussion thread" },
      { status: 500 }
    );
  }
}
