import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { parseSemester } from "@/lib/departments";
import { classTargetWhere, parseClassTarget, type ClassTarget } from "@/lib/class-targeting";

export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const department = searchParams.get("department")?.trim() || null;
    const batch = searchParams.get("batch")?.trim() || null;
    const section = searchParams.get("section")?.trim() || null;
    const semester = parseSemester(searchParams.get("semester"));

    const threads = await prisma.discussionThread.findMany({
      where:
        profile.role === "student"
          ? classTargetWhere(profile)
          : {
              ...(department ? { targetDepartment: department } : {}),
              ...(batch ? { targetBatch: batch } : {}),
              ...(section ? { targetSection: section } : {}),
              ...(semester ? { targetSemester: semester } : {}),
            },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
            department: true,
            section: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
      take: 100,
    });

    return NextResponse.json({ threads });
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussion threads" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required" },
        { status: 400 }
      );
    }

    // Students post to their own class; teachers choose the target class.
    let target: ClassTarget;
    if (profile.role === "student") {
      if (!profile.department?.trim()) {
        return NextResponse.json(
          { error: "Your profile does not have a department configured" },
          { status: 400 }
        );
      }
      target = {
        targetDepartment: profile.department.trim(),
        targetBatch: profile.batch?.trim() || null,
        targetSection: profile.section?.trim() || null,
        targetSemester: profile.semester ?? null,
      };
    } else {
      const parsedTarget = parseClassTarget(body);
      if ("error" in parsedTarget) {
        return NextResponse.json({ error: parsedTarget.error }, { status: 400 });
      }
      target = parsedTarget.target;
    }

    const thread = await prisma.discussionThread.create({
      data: {
        title,
        content,
        createdById: profile.id,
        ...target,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            fullName: true,
            role: true,
            department: true,
            section: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
    });

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    console.error("Error creating discussion:", error);
    return NextResponse.json(
      { error: "Failed to create discussion thread" },
      { status: 500 }
    );
  }
}
