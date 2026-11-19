/** Shared (client-safe) helpers for video modules. */

import { z } from "zod";

/** Editable module details, validated in the teacher form and the API. */
export const moduleDetailsSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().trim().max(2000).optional().nullable(),
  category: z.string().trim().max(60).optional().nullable(),
  level: z.enum(["easy", "medium", "hard"]),
  badgeName: z.string().trim().min(3, "Badge name must be at least 3 characters").max(80),
});

export type ModuleDetails = z.infer<typeof moduleDetailsSchema>;

/** A lesson counts as completed once this share of it has been watched. */
export const LESSON_COMPLETION_RATIO = 0.9;

export const MODULE_LEVELS = [
  { value: "easy", label: "Beginner" },
  { value: "medium", label: "Intermediate" },
  { value: "hard", label: "Advanced" },
] as const;

export type ModuleLevel = (typeof MODULE_LEVELS)[number]["value"];

export function levelLabel(level: string) {
  return MODULE_LEVELS.find((l) => l.value === level)?.label ?? level;
}

/** "1h 5m", "12m", "45s". */
export function formatDuration(totalSec: number) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h) return m ? `${h}h ${m}m` : `${h}h`;
  if (m) return `${m}m`;
  return `${sec}s`;
}

/** "4:07" or "1:02:09". */
export function formatClock(totalSec: number) {
  const sec = Math.max(0, Math.round(totalSec));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = h ? String(m).padStart(2, "0") : String(m);
  return `${h ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function percent(done: number, total: number) {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

/** Seconds a student must watch before a lesson completes. */
export function requiredWatchSec(durationSec: number) {
  return Math.floor(durationSec * LESSON_COMPLETION_RATIO);
}

const BADGE_THEMES = [
  { from: "#6366f1", to: "#a855f7", ring: "#c4b5fd" }, // indigo → purple
  { from: "#0ea5e9", to: "#14b8a6", ring: "#99f6e4" }, // sky → teal
  { from: "#f59e0b", to: "#ef4444", ring: "#fde68a" }, // amber → red
  { from: "#10b981", to: "#84cc16", ring: "#bbf7d0" }, // emerald → lime
  { from: "#ec4899", to: "#f97316", ring: "#fbcfe8" }, // pink → orange
  { from: "#3b82f6", to: "#6366f1", ring: "#bfdbfe" }, // blue → indigo
] as const;

/** Stable colour theme for a module's badge, derived from its id. */
export function badgeTheme(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return BADGE_THEMES[hash % BADGE_THEMES.length];
}
