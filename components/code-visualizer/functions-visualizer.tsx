"use client";

import { Card } from "@/components/ui/card";

export function FunctionsVisualizer() {
  return (
    <div className="h-full flex items-center justify-center">
      <Card className="p-8 max-w-md text-center">
        <h3 className="text-xl font-bold mb-4">Functions Visualizer</h3>
        <p className="text-muted-foreground">
          Coming soon! This will visualize function calls, parameters, return values, and scope.
        </p>
      </Card>
    </div>
  );
}
