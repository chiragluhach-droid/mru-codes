import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    try {
      // Use the reliable HackerRank Stats API
      // Docs: https://hackerrank-stats.tashif.codes/
      const statsResponse = await fetch(
        `https://hackerrank-stats.tashif.codes/${encodeURIComponent(username)}/profile`,
        {
          headers: {
            "Accept": "application/json",
          },
          cache: 'no-store',
        }
      );

      if (!statsResponse.ok) {
        throw new Error(`API returned ${statsResponse.status}`);
      }

      const statsData = await statsResponse.json();
      
      // Check if request was successful
      if (statsData.status !== "success") {
        throw new Error("Failed to fetch HackerRank stats");
      }

      const data = statsData.data;

      // Map the response to our format
      return NextResponse.json({
        username: statsData.username,
        problemsSolved: data.totalSolved || 0,
        stars: Math.min(Math.floor((data.badgesCount || 0) / 5), 5), // Approximate stars from badges
        rank: data.rank || "Unranked",
        score: data.currentRating || 0,
        maxRating: data.maxRating || 0,
        activeDays: data.totalActiveDays || 0,
        contests: data.totalContests || 0,
        badgesCount: data.badgesCount || 0,
        profileUrl: `https://www.hackerrank.com/${username}`,
      });

    } catch (fetchError) {
      console.error("HackerRank API fetch error:", fetchError);
      
      // Return placeholder data if API fails
      return NextResponse.json({
        username,
        problemsSolved: 0,
        stars: 0,
        rank: "Unable to fetch",
        score: 0,
        maxRating: 0,
        activeDays: 0,
        contests: 0,
        badgesCount: 0,
        profileUrl: `https://www.hackerrank.com/${username}`,
        note: "Stats unavailable. Click 'Visit Profile' to view on HackerRank.",
        error: "Could not fetch stats. Please verify the username is correct.",
      });
    }

  } catch (error) {
    console.error("Error in HackerRank stats API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
