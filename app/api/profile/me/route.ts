import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfileForSupabaseUser } from "@/lib/profile";
import { STUDENT_SIGNUP_CLOSED_MESSAGE } from "@/lib/student-allowlist";
import prisma from "@/lib/prisma";
import { isValidBatch, isValidSection, parseSemester } from "@/lib/departments";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getOrCreateProfileForSupabaseUser(user);
  if (!profile) {
    return NextResponse.json({ error: STUDENT_SIGNUP_CLOSED_MESSAGE }, { status: 403 });
  }
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Build update data object
    const updateData: any = {};
    
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.rollNumber !== undefined) updateData.rollNumber = body.rollNumber ?? null;
    if (body.department !== undefined) updateData.department = body.department ?? null;
    if (body.section !== undefined) {
      const section = typeof body.section === "string" ? body.section.trim().toUpperCase() : "";
      if (section && !isValidSection(section)) {
        return NextResponse.json({ error: "Choose a valid section" }, { status: 400 });
      }
      updateData.section = section || null;
    }
    if (body.batch !== undefined) {
      const batch = typeof body.batch === "string" ? body.batch.trim().toUpperCase() : "";
      if (batch && !isValidBatch(batch)) {
        return NextResponse.json({ error: "Choose a valid batch" }, { status: 400 });
      }
      updateData.batch = batch || null;
    }
    if (body.semester !== undefined) {
      const semester = parseSemester(body.semester);
      if (body.semester !== null && body.semester !== "" && semester === null) {
        return NextResponse.json({ error: "Choose a valid semester" }, { status: 400 });
      }
      updateData.semester = semester;
    }
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl ?? null;
    if (body.hackerRankUsername !== undefined) updateData.hackerRankUsername = body.hackerRankUsername ?? null;

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: updateData,
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}


