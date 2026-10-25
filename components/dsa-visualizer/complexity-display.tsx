"use client";

import { Card } from "@/components/ui/card";
import { Clock, HardDrive, Info } from "lucide-react";

interface ComplexityDisplayProps {
  timeComplexity: {
    best: string;
    average: string;
    worst: string;
  };
  spaceComplexity: string;
  description: string;
}

export function ComplexityDisplay({
  timeComplexity,
  spaceComplexity,
  description,
}: ComplexityDisplayProps) {
  return (
    <Card className="p-3 bg-muted/30">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Header */}
        <div className="flex items-center gap-2 font-semibold shrink-0">
          <Info className="w-4 h-4 text-primary" />
          <span className="text-sm">Complexity Analysis</span>
        </div>

        {/* Time Complexity - Inline */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-muted-foreground">Time:</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
              <span className="text-muted-foreground">Best:</span>
              <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                {timeComplexity.best}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20">
              <span className="text-muted-foreground">Avg:</span>
              <span className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">
                {timeComplexity.average}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/10 border border-red-500/20">
              <span className="text-muted-foreground">Worst:</span>
              <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                {timeComplexity.worst}
              </span>
            </div>
          </div>
        </div>

        {/* Space Complexity - Inline */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs">
            <HardDrive className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-muted-foreground">Space:</span>
          </div>
          <div className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20">
            <span className="font-mono font-semibold text-xs text-purple-600 dark:text-purple-400">
              {spaceComplexity}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="flex-1 text-xs text-muted-foreground border-l pl-4 hidden lg:block">
          {description}
        </div>
      </div>
    </Card>
  );
}
