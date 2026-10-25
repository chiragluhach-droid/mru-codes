"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  LayoutDashboard,
  Trophy,
  Zap,
  FileText,
  PlusCircle,
  BarChart3,
  Users,
  Database,
  Lightbulb,
  Shield,
  Clock,
  FileSpreadsheet,
  ScrollText,
  FolderGit2,
  Code2,
  Award,
  MessageSquare,
  Network,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

const studentNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/learn", label: "Learn", icon: BookOpen },
  { href: "/dashboard/dsa-visualizer", label: "DSA Visualizer", icon: Network },
  { href: "/dashboard/code-visualizer", label: "Code Visualizer", icon: Eye },
  { href: "/dashboard/quiz/join", label: "Join Quiz", icon: Zap },
  { href: "/dashboard/quiz-history", label: "Quiz History", icon: Clock },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/profile", label: "Profile", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: FileText },
];

const teacherNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/learn", label: "Learn", icon: BookOpen },
  { href: "/dashboard/quiz/join", label: "Join Quiz", icon: Zap },
  { href: "/dashboard/quiz-history", label: "Quiz History", icon: Clock },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/dashboard/profile", label: "Profile", icon: Users },
  { href: "/dashboard/settings", label: "Settings", icon: FileText },
];

export function DashboardNav({ role }: { role: "student" | "teacher" }) {
  const pathname = usePathname();
  const navItems = role === "teacher" ? teacherNav : studentNav;

  return (
    <aside
      className={cn(
        "hidden lg:fixed lg:left-0 lg:top-14 lg:bottom-0 lg:z-40",
        "lg:flex lg:flex-col lg:w-56 lg:border-r lg:bg-secondary/30 lg:overflow-y-auto"
      )}
    >
      <nav className="flex flex-col p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
