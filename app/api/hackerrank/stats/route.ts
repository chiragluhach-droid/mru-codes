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
      // Fetch HackerRank profile data using their public API
      const profileResponse = await fetch(
        `https://www.hackerrank.com/rest/hackers/${username}/scores_elo`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
          cache: 'no-store',
        }
      );

      let problemsSolved = 0;
      let stars = 0;

      if (profileResponse.ok) {
        const scoresData = await profileResponse.json();
        console.log("Scores data:", scoresData);
        
        // Calculate problems from scores
        if (scoresData.models && Array.isArray(scoresData.models)) {
          problemsSolved = scoresData.models.reduce((total: number, model: any) => {
            return total + (model.solved || 0);
          }, 0);
        }
      }

      // Fetch basic profile info
      const basicProfileResponse = await fetch(
        `https://www.hackerrank.com/rest/hackers/${username}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "application/json",
          },
          cache: 'no-store',
        }
      );

      let rank = "Not Available";
      let score = 0;
      let badges: string[] = [];

      if (basicProfileResponse.ok) {
        const profileData = await basicProfileResponse.json();
        console.log("Profile data:", profileData);
        
        const model = profileData.model;
        
        // Get solved count from basic profile if not from scores
        if (problemsSolved === 0 && model?.solved_challenges) {
          problemsSolved = model.solved_challenges;
        }
        
        // Get rank/level
        if (model?.level) {
          rank = model.level;
        }
        
        // Get score
        if (model?.rating) {
          score = Math.round(model.rating);
        }
        
        // Get stars from badges
        if (model?.badges && Array.isArray(model.badges)) {
          badges = model.badges;
          stars = model.badges.filter((badge: any) => 
            badge && typeof badge === 'object' && badge.badge_id && 
            (badge.badge_id.includes('star') || badge.level)
          ).length;
          
          // Cap stars at 5
          stars = Math.min(stars, 5);
        }
      }

      return NextResponse.json({
        username,
        problemsSolved,
        stars,
        rank,
        score,
        badges: badges.slice(0, 5),
        profileUrl: `https://www.hackerrank.com/${username}`,
      });

    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      
      // Return placeholder data if API fails
      return NextResponse.json({
        username,
        problemsSolved: 0,
        stars: 0,
        rank: "Unable to fetch",
        score: 0,
        badges: [],
        profileUrl: `https://www.hackerrank.com/${username}`,
        note: "Stats unavailable. Click 'Visit Profile' to view on HackerRank.",
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
