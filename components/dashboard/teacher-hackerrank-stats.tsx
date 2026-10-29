"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Code,
  Loader2,
  Star,
  Trophy,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";

interface StudentHackerRankData {
  id: string;
  fullName: string;
  rollNumber: string | null;
  department: string | null;
  section: string | null;
  hackerRankUsername: string | null;
  stats?: {
    problemsSolved: number;
    stars: number;
    rank: string;
    score: number;
    maxRating?: number;
    activeDays?: number;
    contests?: number;
    badgesCount?: number;
    profileUrl: string;
    note?: string;
    error?: string;
  };
}

export function TeacherHackerRankStats() {
  const [students, setStudents] = useState<StudentHackerRankData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");

  // Fetch all students with HackerRank usernames
  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/teacher/hackerrank-stats");
      if (!response.ok) {
        throw new Error("Failed to fetch student data");
      }
      const data = await response.json();
      setStudents(data.students || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load student HackerRank data");
    } finally {
      setLoading(false);
    }
  };

  // Refresh stats for all students
  const refreshStats = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/teacher/hackerrank-stats?refresh=true");
      if (!response.ok) {
        throw new Error("Failed to refresh stats");
      }
      const data = await response.json();
      setStudents(data.students || []);
      toast.success("Stats refreshed successfully");
    } catch (error) {
      console.error("Error refreshing stats:", error);
      toast.error("Failed to refresh stats");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Get unique departments and sections
  const departments = [...new Set(students.map((s) => s.department).filter(Boolean))];
  const sections = [...new Set(students.map((s) => s.section).filter(Boolean))];

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.hackerRankUsername?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDepartment =
      departmentFilter === "all" || student.department === departmentFilter;

    const matchesSection =
      sectionFilter === "all" || student.section === sectionFilter;

    return matchesSearch && matchesDepartment && matchesSection;
  });

  // Calculate summary stats
  const studentsWithHR = students.filter((s) => s.hackerRankUsername);
  const totalProblems = studentsWithHR.reduce(
    (sum, s) => sum + (s.stats?.problemsSolved || 0),
    0
  );
  const avgProblems =
    studentsWithHR.length > 0 ? Math.round(totalProblems / studentsWithHR.length) : 0;

  const topStudent = [...studentsWithHR].sort(
    (a, b) => (b.stats?.problemsSolved || 0) - (a.stats?.problemsSolved || 0)
  )[0];

  const renderStars = (stars: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < stars
                ? "text-yellow-500 fill-yellow-500"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connected Students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{studentsWithHR.length}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Out of {students.length} total
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Avg Problems Solved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{avgProblems}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProblems} total problems
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Top Performer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold truncate">
              {topStudent?.fullName || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {topStudent?.stats?.problemsSolved || 0} problems
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5 text-green-500" />
                Student HackerRank Stats
              </CardTitle>
              <CardDescription className="mt-1">
                View and track HackerRank progress for all students
              </CardDescription>
            </div>
            <Button
              onClick={refreshStats}
              disabled={refreshing}
              variant="outline"
              size="sm"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh Stats
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by name, roll number, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="sm:max-w-xs"
            />
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="sm:w-[180px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept!}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sectionFilter} onValueChange={setSectionFilter}>
              <SelectTrigger className="sm:w-[140px]">
                <SelectValue placeholder="All Sections" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sections</SelectItem>
                {sections.map((sec) => (
                  <SelectItem key={sec} value={sec!}>
                    Section {sec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No students found</h3>
              <p className="text-muted-foreground max-w-sm">
                {searchQuery || departmentFilter !== "all" || sectionFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Students will appear here once they connect their HackerRank accounts"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Dept/Sec</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead className="text-center">Problems</TableHead>
                    <TableHead className="text-center">Stars</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        {student.fullName}
                      </TableCell>
                      <TableCell>
                        {student.rollNumber || (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.department && student.section
                          ? `${student.department} ${student.section}`
                          : student.department || (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                      </TableCell>
                      <TableCell>
                        {student.hackerRankUsername ? (
                          <code className="text-sm bg-muted px-2 py-1 rounded">
                            {student.hackerRankUsername}
                          </code>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Not Connected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.stats ? (
                          <span className="font-semibold text-primary">
                            {student.stats.problemsSolved}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.stats ? (
                          renderStars(student.stats.stars)
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {student.stats ? (
                          <Badge variant="secondary" className="text-xs">
                            {student.stats.rank}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {student.stats ? (
                          <span className="font-mono text-sm">
                            {student.stats.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {student.stats?.profileUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(student.stats!.profileUrl, "_blank")
                            }
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
