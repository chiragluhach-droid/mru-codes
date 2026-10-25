"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, RotateCcw, Play, Pause, SkipForward, SkipBack, ArrowRight } from "lucide-react";
import { CodeDisplay } from "./code-display";
import { ComplexityDisplay } from "./complexity-display";
import { toast } from "react-hot-toast";

interface Node {
  value: number;
  id: number;
}

interface Step {
  list: Node[];
  operation: string;
  description: string;
  highlightLines: number[];
  highlightNodes?: number[];
}

const linkedListCode = `public class LinkedList {
    class Node {
        int data;
        Node next;
        
        Node(int data) {
            this.data = data;
            this.next = null;
        }
    }
    
    private Node head;
    
    public void insertAtBegin(int data) {
        Node newNode = new Node(data);
        newNode.next = head;
        head = newNode;
    }
    
    public void insertAtEnd(int data) {
        Node newNode = new Node(data);
        
        if (head == null) {
            head = newNode;
            return;
        }
        
        Node current = head;
        while (current.next != null) {
            current = current.next;
        }
        current.next = newNode;
    }
    
    public void insertAt(int data, int pos) {
        Node newNode = new Node(data);
        
        if (pos == 0) {
            newNode.next = head;
            head = newNode;
            return;
        }
        
        Node current = head;
        for (int i = 0; i < pos - 1; i++) {
            if (current == null) return;
            current = current.next;
        }
        
        newNode.next = current.next;
        current.next = newNode;
    }
    
    public void deleteAt(int pos) {
        if (head == null) return;
        
        if (pos == 0) {
            head = head.next;
            return;
        }
        
        Node current = head;
        for (int i = 0; i < pos - 1; i++) {
            if (current.next == null) return;
            current = current.next;
        }
        
        if (current.next != null) {
            current.next = current.next.next;
        }
    }
}`;

export function LinkedListVisualizer() {
  const [list, setList] = useState<Node[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [position, setPosition] = useState("0");
  const [operation, setOperation] = useState<"insertBegin" | "insertEnd" | "insertAt" | "deleteAt">("insertEnd");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [nextId, setNextId] = useState(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
        if (currentStep + 1 < steps.length) {
          const nextStep = steps[currentStep + 1];
          applyStep(nextStep);
        }
      }, speed);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const applyStep = (step: Step) => {
    setList(step.list);
  };

  const addStep = (operation: string, newList: Node[], description: string, highlightLines: number[], highlightNodes: number[] = []) => {
    const newStep: Step = {
      list: [...newList],
      operation,
      description,
      highlightLines,
      highlightNodes,
    };
    setSteps((prev) => [...prev, newStep]);
  };

  const handleInsertBegin = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }

    const newNode: Node = { value, id: nextId };
    const newList = [newNode, ...list];
    
    setList(newList);
    setNextId(nextId + 1);
    addStep("insertBegin", newList, `Insert ${value} at the beginning. New head points to ${value}`, [14, 15, 16, 17], [0]);
    setCurrentStep((prev) => prev + 1);
    setInputValue("");
  };

  const handleInsertEnd = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }

    const newNode: Node = { value, id: nextId };
    const newList = [...list, newNode];
    
    setList(newList);
    setNextId(nextId + 1);
    addStep(
      "insertEnd",
      newList,
      list.length === 0 ? `Insert ${value} as the first node` : `Insert ${value} at the end. Traversed to tail node.`,
      [20, 21, 28, 29, 30, 31, 32],
      [newList.length - 1]
    );
    setCurrentStep((prev) => prev + 1);
    setInputValue("");
  };

  const handleInsertAt = () => {
    const value = parseInt(inputValue);
    const pos = parseInt(position);
    
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }
    
    if (isNaN(pos) || pos < 0 || pos > list.length) {
      toast.error(`Invalid position. Must be between 0 and ${list.length}`);
      return;
    }

    const newNode: Node = { value, id: nextId };
    const newList = [...list];
    newList.splice(pos, 0, newNode);
    
    setList(newList);
    setNextId(nextId + 1);
    addStep("insertAt", newList, `Insert ${value} at position ${pos}. Traversed ${pos} nodes.`, [35, 36, 51, 52], [pos]);
    setCurrentStep((prev) => prev + 1);
    setInputValue("");
  };

  const handleDeleteAt = () => {
    const pos = parseInt(position);
    
    if (isNaN(pos) || pos < 0 || pos >= list.length) {
      toast.error(`Invalid position. Must be between 0 and ${list.length - 1}`);
      return;
    }

    const deletedValue = list[pos].value;
    const newList = list.filter((_, index) => index !== pos);
    
    setList(newList);
    addStep("deleteAt", newList, `Delete node at position ${pos} (value = ${deletedValue}). Adjusted pointers.`, [55, 56, 70, 71], []);
    setCurrentStep((prev) => prev + 1);
  };

  const handleExecute = () => {
    switch (operation) {
      case "insertBegin":
        handleInsertBegin();
        break;
      case "insertEnd":
        handleInsertEnd();
        break;
      case "insertAt":
        handleInsertAt();
        break;
      case "deleteAt":
        handleDeleteAt();
        break;
    }
  };

  const handleReset = () => {
    setList([]);
    setSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
    setInputValue("");
    setPosition("0");
    setNextId(1);
  };

  const handlePlayPause = () => {
    if (steps.length === 0) {
      toast.error("No operations to replay");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      applyStep(steps[nextStep]);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      applyStep(steps[prevStep]);
      setIsPlaying(false);
    }
  };

  const currentStepData = currentStep >= 0 && currentStep < steps.length ? steps[currentStep] : null;

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pb-4">
      {/* TOP ROW: Controls (Left) + Code & Live Execution (Right) */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* LEFT: Controls + Visualization */}
        <div className="lg:w-[44%] flex flex-col gap-4">
          {/* Controls Card */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Operation</label>
                <Select value={operation} onValueChange={(v: any) => setOperation(v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insertBegin">Insert at Beginning</SelectItem>
                    <SelectItem value="insertEnd">Insert at End</SelectItem>
                    <SelectItem value="insertAt">Insert at Position</SelectItem>
                    <SelectItem value="deleteAt">Delete at Position</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {operation !== "deleteAt" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Value</label>
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Enter value"
                    className="h-9"
                  />
                </div>
              )}

              {(operation === "insertAt" || operation === "deleteAt") && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position</label>
                  <Input
                    type="number"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="Position"
                    className="h-9"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Speed: {speed}ms</label>
                <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={200} max={1500} step={100} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleExecute} variant="default" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Execute
              </Button>
              <Button onClick={handlePlayPause} variant="outline" size="sm" disabled={steps.length === 0}>
                {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPlaying ? "Pause" : "Replay"}
              </Button>
              <Button onClick={handlePrevious} variant="outline" size="sm" disabled={currentStep <= 0}>
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button onClick={handleNext} variant="outline" size="sm" disabled={currentStep >= steps.length - 1}>
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </div>

            <div className="text-sm">
              <span className="text-muted-foreground">Nodes: </span>
              <span className="font-semibold">{list.length}</span>
            </div>
          </Card>

          {/* Visualization */}
          <Card className="flex-1 min-h-[350px] p-6 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20 overflow-x-auto">
            <div className="w-full min-w-max pb-4">
              {list.length === 0 ? (
                <div className="flex items-center justify-center h-32 border-4 border-dashed border-muted-foreground/30 rounded-lg">
                  <span className="text-muted-foreground">Linked List is empty</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  {/* HEAD label */}
                  <div className="flex flex-col items-center mr-3">
                    <div className="text-xs font-bold text-primary mb-2">HEAD</div>
                    <div className="text-xl">→</div>
                  </div>

                  {list.map((node, index) => {
                    const isHighlighted = currentStepData?.highlightNodes?.includes(index);
                    
                    return (
                      <div key={node.id} className="flex items-center">
                        {/* Node */}
                        <div
                          className={`flex items-center border-4 rounded-lg transition-all duration-300 ${
                            isHighlighted
                              ? "border-primary bg-primary text-primary-foreground scale-105 shadow-lg shadow-primary/50"
                              : "border-muted-foreground/30 bg-muted/20"
                          }`}
                        >
                          <div className="px-4 py-3">
                            <div className="text-xs text-muted-foreground mb-1">Data</div>
                            <div className="text-xl font-bold">{node.value}</div>
                          </div>
                          <div className="border-l-4 border-muted-foreground/30 px-3 py-3">
                            <div className="text-xs text-muted-foreground mb-1">Next</div>
                            <div className="text-lg">→</div>
                          </div>
                        </div>

                        {/* Arrow to next node or NULL */}
                        {index < list.length - 1 ? (
                          <div className="px-1">
                            <ArrowRight className="w-5 h-5 text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="ml-3 px-3 py-1 border-2 border-dashed border-muted-foreground/30 rounded-md">
                            <span className="text-sm text-muted-foreground">NULL</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {currentStepData && (
              <div className="mt-4 text-center">
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>
            )}

            <div className="mt-4 text-xs text-muted-foreground text-center">
              <p>Each node contains data and a pointer to the next node</p>
            </div>
          </Card>
          {/* Complexity Box Below Visualization */}
          <Card className="p-3 bg-muted/20 border">
            <div className="text-sm font-semibold mb-2">Complexity</div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-muted-foreground">Insert/Delete (Begin): </span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">O(1)</span>
              </div>
              <div>
                <span className="text-muted-foreground">Insert/Delete (End/At): </span>
                <span className="font-mono font-semibold text-yellow-600 dark:text-yellow-400">O(n)</span>
              </div>
              <div>
                <span className="text-muted-foreground">Space: </span>
                <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">O(1)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Code Editor + Live Execution */}
        <div className="lg:w-[56%] flex flex-col gap-4">
          {/* Code Display */}
          <div className="flex-1">
            <CodeDisplay code={linkedListCode} language="java" highlightLines={currentStepData?.highlightLines || []} />
          </div>

          {/* Live Execution Box */}
          <Card className="p-4 bg-muted/30 border-2">
            <div className="flex items-center gap-2 font-semibold mb-3 pb-2 border-b">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-lg">Live Execution</span>
            </div>
            
            {currentStepData ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Current Operation
                  </div>
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm font-medium">{currentStepData.description}</p>
                  </div>
                </div>

                {currentStepData.highlightLines.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                      Executing Line
                    </div>
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="text-sm font-mono font-semibold">
                        Line {currentStepData.highlightLines.join(", ")}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    List State
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Operation: </span>
                        <span className="font-mono font-bold capitalize">{currentStepData.operation.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Nodes: </span>
                        <span className="font-mono font-bold">{list.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Execute operations to see live execution
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
