"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SortingVisualizer } from "./sorting-visualizer";
import { SearchingVisualizer } from "./searching-visualizer";
import { StackVisualizer } from "./stack-visualizer";
import { QueueVisualizer } from "./queue-visualizer";
import { LinkedListVisualizer } from "./linked-list-visualizer";
import { Card } from "@/components/ui/card";
import { ArrowDownUp, Search, Layers, ListOrdered, Link } from "lucide-react";

export function DSAVisualizerMain() {
  const [activeTab, setActiveTab] = useState("sorting");

  const tabs = [
    { value: "sorting", label: "Sorting", icon: ArrowDownUp },
    { value: "searching", label: "Searching", icon: Search },
    { value: "stack", label: "Stack", icon: Layers },
    { value: "queue", label: "Queue", icon: ListOrdered },
    { value: "linkedlist", label: "Linked List", icon: Link },
  ];

  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DSA Visualizer</h1>
        <p className="text-muted-foreground mt-2">
          Interactive algorithm visualizations with step-by-step execution
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
            <TabsContent value="sorting" className="h-full m-0 p-6">
              <SortingVisualizer />
            </TabsContent>
            <TabsContent value="searching" className="h-full m-0 p-6">
              <SearchingVisualizer />
            </TabsContent>
            <TabsContent value="stack" className="h-full m-0 p-6">
              <StackVisualizer />
            </TabsContent>
            <TabsContent value="queue" className="h-full m-0 p-6">
              <QueueVisualizer />
            </TabsContent>
            <TabsContent value="linkedlist" className="h-full m-0 p-6">
              <LinkedListVisualizer />
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
