"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Plus, Minus, RotateCcw, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { CodeDisplay } from "./code-display";
import { ComplexityDisplay } from "./complexity-display";
import { toast } from "react-hot-toast";

interface Step {
  stack: number[];
  operation: "push" | "pop" | "peek" | "init" | "empty";
  value?: number;
  description: string;
  highlightLines: number[];
  highlight?: number;
}

const stackCode = `public class Stack {
    private int[] arr;
    private int top;
    private int capacity;
    
    public Stack(int size) {
        arr = new int[size];
        capacity = size;
        top = -1;
    }
    
    public void push(int value) {
        if (isFull()) {
            throw new Exception("Stack Overflow");
        }
        arr[++top] = value;
    }
    
    public int pop() {
        if (isEmpty()) {
            throw new Exception("Stack Underflow");
        }
        return arr[top--];
    }
    
    public int peek() {
        if (isEmpty()) {
            throw new Exception("Stack is empty");
        }
        return arr[top];
    }
    
    public boolean isEmpty() {
        return top == -1;
    }
    
    public boolean isFull() {
        return top == capacity - 1;
    }
}`;

export function StackVisualizer() {
  const [stack, setStack] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [maxSize] = useState(10);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
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
    setStack(step.stack);
  };

  const addStep = (operation: Step["operation"], value?: number, newStack?: number[]) => {
    const currentStack = newStack !== undefined ? newStack : stack;
    let description = "";
    let highlightLines: number[] = [];

    switch (operation) {
      case "init":
        description = "Stack initialized with maximum capacity " + maxSize;
        highlightLines = [6, 7, 8, 9];
        break;
      case "push":
        description = `Push ${value} onto the stack. Top pointer moves up to index ${currentStack.length - 1}.`;
        highlightLines = [12, 13, 14, 15, 16];
        break;
      case "pop":
        description = `Pop ${value} from the stack. Top pointer moves down.`;
        highlightLines = [19, 20, 21, 22, 23];
        break;
      case "peek":
        description = `Peek operation: Top element is ${value}`;
        highlightLines = [26, 27, 28, 29, 30];
        break;
      case "empty":
        description = "Stack is empty. Cannot perform pop operation.";
        highlightLines = [20, 21];
        break;
    }

    const newStep: Step = {
      stack: [...currentStack],
      operation,
      value,
      description,
      highlightLines,
      highlight: operation === "push" ? currentStack.length - 1 : operation === "pop" ? -1 : undefined,
    };

    setSteps((prev) => [...prev, newStep]);
  };

  const handlePush = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (stack.length >= maxSize) {
      toast.error("Stack Overflow! Maximum capacity reached");
      return;
    }

    const newStack = [...stack, value];
    setStack(newStack);
    addStep("push", value, newStack);
    setInputValue("");
    setCurrentStep((prev) => prev + 1);
  };

  const handlePop = () => {
    if (stack.length === 0) {
      toast.error("Stack Underflow! Stack is empty");
      addStep("empty");
      setCurrentStep((prev) => prev + 1);
      return;
    }

    const value = stack[stack.length - 1];
    const newStack = stack.slice(0, -1);
    setStack(newStack);
    addStep("pop", value, newStack);
    setCurrentStep((prev) => prev + 1);
  };

  const handlePeek = () => {
    if (stack.length === 0) {
      toast.error("Stack is empty");
      return;
    }
    const value = stack[stack.length - 1];
    toast.success(`Top element: ${value}`);
    addStep("peek", value);
    setCurrentStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setStack([]);
    setSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
    setInputValue("");
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Push Value</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePush()}
                    placeholder="Enter value"
                    className="h-9"
                  />
                  <Button onClick={handlePush} size="icon" className="h-9 w-9">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Speed: {speed}ms</label>
                <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={200} max={1500} step={100} />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handlePop} variant="destructive" size="sm">
                <Minus className="w-4 h-4 mr-1" />
                Pop
              </Button>
              <Button onClick={handlePeek} variant="outline" size="sm">
                Peek
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

            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">Size: </span>
                <span className="font-semibold">{stack.length}</span>
                <span className="text-muted-foreground"> / {maxSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <span className={stack.length === 0 ? "text-yellow-500" : stack.length === maxSize ? "text-red-500" : "text-green-500"}>
                  {stack.length === 0 ? "Empty" : stack.length === maxSize ? "Full" : "Active"}
                </span>
              </div>
            </div>
          </Card>

          {/* Visualization */}
          <Card className="flex-1 min-h-[400px] p-6 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
            <div className="flex flex-col-reverse items-center gap-2 min-h-[350px] justify-end">
              {stack.map((value, index) => (
                <div
                  key={`${index}-${value}`}
                  className={`w-32 h-16 flex items-center justify-center border-4 border-primary rounded-lg bg-primary/10 text-2xl font-bold transition-all duration-300 ${
                    currentStepData?.highlight === index ? "scale-110 shadow-lg shadow-primary/50 bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {value}
                </div>
              ))}
              
              {/* Base of stack */}
              <div className="w-40 h-3 bg-muted-foreground/50 rounded-full mt-2"></div>
            </div>

            {stack.length > 0 && (
              <div className="mt-6 text-center">
                <div className="text-sm text-muted-foreground mb-1">TOP</div>
                <div className="text-3xl font-bold text-primary">↑ {stack[stack.length - 1]}</div>
              </div>
            )}

            {currentStepData && (
              <div className="mt-4 text-center">
                <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </div>
              </div>
            )}
          </Card>
          {/* Complexity Box Below Visualization */}
          <Card className="p-3 bg-muted/20 border">
            <div className="text-sm font-semibold mb-2">Complexity</div>
            <div className="flex items-center gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">Time: </span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">O(1)</span>
              </div>
              <div>
                <span className="text-muted-foreground">Space: </span>
                <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">O(n)</span>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Code Editor + Live Execution */}
        <div className="lg:w-[56%] flex flex-col gap-4">
          {/* Code Display */}
          <div className="flex-1">
            <CodeDisplay code={stackCode} language="java" highlightLines={currentStepData?.highlightLines || []} />
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
                    Stack State
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Operation: </span>
                        <span className="font-mono font-bold capitalize">{currentStepData.operation}</span>
                      </div>
                      {currentStepData.value !== undefined && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Value: </span>
                          <span className="font-mono font-bold text-primary">{currentStepData.value}</span>
                        </div>
                      )}
                      <div className="text-sm">
                        <span className="text-muted-foreground">Size: </span>
                        <span className="font-mono font-bold">{stack.length}/{maxSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Perform stack operations to see live execution
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
