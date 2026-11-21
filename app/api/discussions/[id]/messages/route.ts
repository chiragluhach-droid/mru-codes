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
      select: {
        id: true,
        targetDepartment: true,
        targetBatch: true,
        targetSection: true,
        targetSemester: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Discussion thread not found" }, { status: 404 });
    }

    if (!hasThreadAccess(thread, profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await prisma.discussionMessage.findMany({
      where: {
        threadId: id,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
            department: true,
            section: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching discussion messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussion messages" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
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
      select: {
        id: true,
        isClosed: true,
        targetDepartment: true,
        targetBatch: true,
        targetSection: true,
        targetSemester: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Discussion thread not found" }, { status: 404 });
    }

    if (!hasThreadAccess(thread, profile)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (thread.isClosed && profile.role !== "teacher") {
      return NextResponse.json(
        { error: "This discussion thread is closed" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const parentId = typeof body.parentId === "string" ? body.parentId : null;

    if (!content) {
      return NextResponse.json({ error: "Message content is required" }, { status: 400 });
    }

    if (parentId) {
      const parentMessage = await prisma.discussionMessage.findUnique({
        where: { id: parentId },
        select: { id: true, threadId: true },
      });

      if (!parentMessage || parentMessage.threadId !== id) {
        return NextResponse.json(
          { error: "Invalid message being replied to" },
          { status: 400 }
        );
      }
    }

    const message = await prisma.discussionMessage.create({
      data: {
        threadId: id,
        authorId: profile.id,
        content,
        parentId,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            role: true,
            avatarUrl: true,
            department: true,
            section: true,
          },
        },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error posting discussion message:", error);
    return NextResponse.json(
      { error: "Failed to post discussion message" },
      { status: 500 }
    );
  }
}
