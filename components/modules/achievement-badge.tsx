import { useId } from "react";
import { badgeTheme } from "@/lib/modules";
import { cn } from "@/lib/utils";

interface AchievementBadgeProps {
  /** Module id; picks the badge's colours. */
  seed: string;
  /** Short label on the ribbon, e.g. "C Basics". */
  label?: string;
  earned?: boolean;
  size?: number;
  className?: string;
}

/** Hexagonal medal for a module badge; greyed out until earned. */
export function AchievementBadge({ seed, label, earned = true, size = 96, className }: AchievementBadgeProps) {
  const theme = badgeTheme(seed);
  const uid = useId().replace(/:/g, "");
  const gradientId = `badge-grad-${uid}`;
  const shineId = `badge-shine-${uid}`;

  return (
    <svg
      viewBox="0 0 120 132"
      width={size}
      height={(size * 132) / 120}
      role="img"
      aria-label={label ? `${label} badge${earned ? "" : " (locked)"}` : "Badge"}
      className={cn(!earned && "grayscale opacity-40", "drop-shadow-md", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={theme.from} />
          <stop offset="100%" stopColor={theme.to} />
        </linearGradient>
        <linearGradient id={shineId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Ribbon tails */}
      <path d="M38 96 L28 128 L44 120 L52 130 L58 100 Z" fill={theme.to} opacity="0.85" />
      <path d="M82 96 L92 128 L76 120 L68 130 L62 100 Z" fill={theme.from} opacity="0.85" />

      {/* Hexagon medal */}
      <path d="M60 4 L108 32 L108 88 L60 116 L12 88 L12 32 Z" fill={`url(#${gradientId})`} />
      <path
        d="M60 14 L99 37 L99 83 L60 106 L21 83 L21 37 Z"
        fill="none"
        stroke={theme.ring}
        strokeWidth="2.5"
        opacity="0.9"
      />
      <path d="M60 4 L108 32 L108 60 L12 60 L12 32 Z" fill={`url(#${shineId})`} />

      {/* Star */}
      <path
        d="M60 34 L66.5 48 L82 49.5 L70.5 60 L74 75 L60 67 L46 75 L49.5 60 L38 49.5 L53.5 48 Z"
        fill="#fff"
        opacity="0.95"
      />

      {/* "C" monogram */}
      <text
        x="60"
        y="96"
        textAnchor="middle"
        fontSize="13"
        fontWeight="700"
        fill="#fff"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        letterSpacing="1.5"
      >
        C PROG
      </text>
    </svg>
  );
}
