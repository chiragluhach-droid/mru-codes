"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Star, Trophy, Code, Loader2, Settings } from "lucide-react";
import { toast } from "react-hot-toast";

interface HackerRankStats {
  username: string;
  problemsSolved: number;
  stars: number;
  rank: string;
  score: number;
  badges: string[];
  profileUrl: string;
  note?: string;
}

export function HackerRankStatsCard() {
  const [stats, setStats] = useState<HackerRankStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState<string | null>(null);

  const fetchStats = async (user: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/hackerrank/stats?username=${user}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch HackerRank stats");
      }

      const data = await response.json();
      setStats(data);
      setShowInput(false);
    } catch (error) {
      console.error("Error fetching HackerRank stats:", error);
      toast.error("Failed to fetch HackerRank stats. Please check the username.");
      setShowInput(true);
    } finally {
      setLoading(false);
    }
  };

  // Load saved username from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("hackerrank_username");
      if (saved) {
        setSavedUsername(saved);
        fetchStats(saved);
      } else {
        setShowInput(true);
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      setShowInput(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = () => {
    if (!username.trim()) {
      toast.error("Please enter your HackerRank username");
      return;
    }

    localStorage.setItem("hackerrank_username", username.trim());
    setSavedUsername(username.trim());
    fetchStats(username.trim());
  };

  const handleDisconnect = () => {
    localStorage.removeItem("hackerrank_username");
    setSavedUsername(null);
    setStats(null);
    setShowInput(true);
    setUsername("");
  };

  const handleRefresh = () => {
    if (savedUsername) {
      fetchStats(savedUsername);
    }
  };

  if (showInput || !savedUsername) {
    return (
      <Card className="border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded">
              <Code className="h-5 w-5 text-white" />
            </div>
            HackerRank Stats
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Connect your HackerRank profile to see your stats here.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter HackerRank username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleConnect()}
            />
            <Button onClick={handleConnect} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Connect"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Example: john_doe
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5" />
      
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded">
              <Code className="h-5 w-5 text-white" />
            </div>
            HackerRank Stats
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={loading}
              title="Refresh stats"
            >
              <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDisconnect}
              title="Change username"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            {/* Username */}
            <div className="flex items-center justify-between pb-3 border-b">
              <span className="text-sm text-muted-foreground">Profile</span>
              <span className="font-mono font-semibold">@{stats.username}</span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Problems Solved */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
                <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full">
                  <Code className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.problemsSolved}</p>
                  <p className="text-xs text-muted-foreground">Problems Solved</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/5">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-500/10 rounded-full">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.stars}</p>
                  <p className="text-xs text-muted-foreground">Stars</p>
                </div>
              </div>

              {/* Rank */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/5">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-500/10 rounded-full">
                  <Trophy className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-lg font-bold truncate">{stats.rank}</p>
                  <p className="text-xs text-muted-foreground">Rank</p>
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/5">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-500/10 rounded-full">
                  <Trophy className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.score.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            </div>

            {/* Visit Profile Button */}
            <Button
              className="w-full"
              variant="outline"
              onClick={() => window.open(stats.profileUrl, "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit HackerRank Profile
            </Button>

            {/* Last Updated */}
            {stats.note && (
              <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-600 dark:text-yellow-400 text-center">
                {stats.note}
              </div>
            )}
            <p className="text-xs text-center text-muted-foreground">
              Click refresh icon to update stats
            </p>
          </>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No stats available
          </div>
        )}
      </CardContent>
    </Card>
  );
}
