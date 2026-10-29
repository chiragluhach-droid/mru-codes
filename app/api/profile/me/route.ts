import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfileForSupabaseUser } from "@/lib/profile";
import prisma from "@/lib/prisma";

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
    if (body.section !== undefined) updateData.section = body.section ?? null;
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


