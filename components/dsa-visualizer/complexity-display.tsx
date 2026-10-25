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
    <Card className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Info className="w-5 h-5 text-primary" />
        Complexity Analysis
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Clock className="w-4 h-4 text-blue-500" />
            Time Complexity
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
              <div className="text-xs text-muted-foreground mb-1">Best Case</div>
              <div className="font-mono font-semibold text-green-600 dark:text-green-400">
                {timeComplexity.best}
              </div>
            </div>
            <div className="p-2 rounded-md bg-yellow-500/10 border border-yellow-500/20">
              <div className="text-xs text-muted-foreground mb-1">Average Case</div>
              <div className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">
                {timeComplexity.average}
              </div>
            </div>
            <div className="p-2 rounded-md bg-red-500/10 border border-red-500/20">
              <div className="text-xs text-muted-foreground mb-1">Worst Case</div>
              <div className="font-mono font-semibold text-red-600 dark:text-red-400">
                {timeComplexity.worst}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HardDrive className="w-4 h-4 text-purple-500" />
            Space Complexity
          </div>
          <div className="p-3 rounded-md bg-purple-500/10 border border-purple-500/20">
            <div className="font-mono font-semibold text-purple-600 dark:text-purple-400">
              {spaceComplexity}
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </Card>
  );
}
