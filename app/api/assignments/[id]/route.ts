import { NextRequest, NextResponse } from "next/server";
import { getProfile } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { hasClassAccess, parseClassTarget, type ClassTarget } from "@/lib/class-targeting";

// GET /api/assignments/[id] - Get a specific assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            fullName: true,
            email: true,
          },
        },
        ...(profile.role === "student"
          ? {
              submissions: {
                where: {
                  studentId: profile.id,
                },
                take: 1,
                orderBy: {
                  submittedAt: "desc",
                },
              },
            }
          : {}),
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    // Students can only see published assignments targeted to their class
    if (profile.role === "student") {
      if (assignment.status !== "published") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      if (!hasClassAccess(assignment, profile)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Teachers can only see their own assignments
    if (profile.role === "teacher" && assignment.createdById !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("Error fetching assignment:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignment" },
      { status: 500 }
    );
  }
}

// PATCH /api/assignments/[id] - Update an assignment (teacher only)
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

    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.createdById !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      topic,
      difficulty,
      maxPoints,
      dueDate,
      status: assignmentStatus,
      pdfUrl,
      pdfFileName,
    } = body;

    // The target class is only changed when the request includes it.
    let target: ClassTarget | undefined;
    if (body.targetDepartment !== undefined) {
      const parsedTarget = parseClassTarget(body);
      if ("error" in parsedTarget) {
        return NextResponse.json({ error: parsedTarget.error }, { status: 400 });
      }
      target = parsedTarget.target;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(topic !== undefined && { topic }),
        ...(difficulty !== undefined && { difficulty }),
        ...(maxPoints !== undefined && { maxPoints }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(assignmentStatus !== undefined && { status: assignmentStatus }),
        ...(target ?? {}),
        ...(pdfUrl !== undefined && { pdfUrl }),
        ...(pdfFileName !== undefined && { pdfFileName }),
      },
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    return NextResponse.json({ assignment: updatedAssignment });
  } catch (error) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment" },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id] - Delete an assignment (teacher only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await getProfile();
    if (!profile || profile.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id },
    });

    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    if (assignment.createdById !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.assignment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
