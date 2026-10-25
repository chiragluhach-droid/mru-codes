"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { RecursionVisualizer } from "./recursion-visualizer";
import { LoopsVisualizer } from "./loops-visualizer";
import { FunctionsVisualizer } from "./functions-visualizer";
import { ArraysVisualizer } from "./arrays-visualizer";
import { ConditionalsVisualizer } from "./conditionals-visualizer";
import { Repeat, GitBranch, FunctionSquare, Grid3x3, GitMerge } from "lucide-react";

export function CodeVisualizerMain() {
  const [activeTab, setActiveTab] = useState("recursion");

  const tabs = [
    { value: "recursion", label: "Recursion", icon: Repeat },
    { value: "loops", label: "Loops", icon: Repeat },
    { value: "functions", label: "Functions", icon: FunctionSquare },
    { value: "arrays", label: "Arrays", icon: Grid3x3 },
    { value: "conditionals", label: "Conditionals", icon: GitBranch },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Code Visualizer</h1>
        <p className="text-muted-foreground mt-2">
          Interactive step-by-step code execution visualization with call stack and variable tracking
        </p>
      </div>

      <Card className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b px-6 pt-4">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-t-md rounded-b-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="recursion" className="h-full m-0 p-6">
              <RecursionVisualizer />
            </TabsContent>
            <TabsContent value="loops" className="h-full m-0 p-6">
              <LoopsVisualizer />
            </TabsContent>
            <TabsContent value="functions" className="h-full m-0 p-6">
              <FunctionsVisualizer />
            </TabsContent>
            <TabsContent value="arrays" className="h-full m-0 p-6">
              <ArraysVisualizer />
            </TabsContent>
            <TabsContent value="conditionals" className="h-full m-0 p-6">
              <ConditionalsVisualizer />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
