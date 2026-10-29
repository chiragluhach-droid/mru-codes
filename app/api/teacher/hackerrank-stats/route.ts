import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Verify teacher authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a teacher
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!profile || profile.role !== "teacher") {
      return NextResponse.json(
        { error: "Access denied. Teachers only." },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const shouldRefresh = searchParams.get("refresh") === "true";

    // Fetch all students
    const students = await prisma.profile.findMany({
      where: {
        role: "student",
      },
      select: {
        id: true,
        fullName: true,
        rollNumber: true,
        department: true,
        section: true,
        hackerRankUsername: true,
      } as any, // Type will be correct after Prisma migration
      orderBy: [
        { department: "asc" },
        { section: "asc" },
        { rollNumber: "asc" },
      ],
    }) as any[];

    // Fetch HackerRank stats for students who have connected their accounts
    const studentsWithStats = await Promise.all(
      students.map(async (student) => {
        if (!student.hackerRankUsername) {
          return {
            ...student,
            stats: null,
          };
        }

        try {
          // Fetch stats from HackerRank API
          const statsResponse = await fetch(
            `${request.nextUrl.origin}/api/hackerrank/stats?username=${encodeURIComponent(
              student.hackerRankUsername
            )}`,
            {
              cache: shouldRefresh ? 'no-store' : 'default',
            }
          );

          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            return {
              ...student,
              stats,
            };
          } else {
            return {
              ...student,
              stats: {
                username: student.hackerRankUsername,
                problemsSolved: 0,
                stars: 0,
                rank: "Error",
                score: 0,
                profileUrl: `https://www.hackerrank.com/${student.hackerRankUsername}`,
                error: "Failed to fetch stats",
              },
            };
          }
        } catch (error) {
          console.error(
            `Error fetching stats for ${student.hackerRankUsername}:`,
            error
          );
          return {
            ...student,
            stats: {
              username: student.hackerRankUsername,
              problemsSolved: 0,
              stars: 0,
              rank: "Error",
              score: 0,
              profileUrl: `https://www.hackerrank.com/${student.hackerRankUsername}`,
              error: "Failed to fetch stats",
            },
          };
        }
      })
    );

    return NextResponse.json({
      students: studentsWithStats,
      total: students.length,
      connected: students.filter((s) => s.hackerRankUsername).length,
    });
  } catch (error) {
    console.error("Error in teacher HackerRank stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
