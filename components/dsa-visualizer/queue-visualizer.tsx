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
  queue: number[];
  operation: "enqueue" | "dequeue" | "peek" | "init" | "empty";
  value?: number;
  description: string;
  highlightLines: number[];
  highlightFront?: boolean;
  highlightRear?: boolean;
}

const queueCode = `public class Queue {
    private int[] arr;
    private int front, rear, size;
    private int capacity;
    
    public Queue(int cap) {
        arr = new int[cap];
        capacity = cap;
        front = 0;
        rear = -1;
        size = 0;
    }
    
    public void enqueue(int value) {
        if (isFull()) {
            throw new Exception("Queue Overflow");
        }
        rear = (rear + 1) % capacity;
        arr[rear] = value;
        size++;
    }
    
    public int dequeue() {
        if (isEmpty()) {
            throw new Exception("Queue Underflow");
        }
        int value = arr[front];
        front = (front + 1) % capacity;
        size--;
        return value;
    }
    
    public int peek() {
        if (isEmpty()) {
            throw new Exception("Queue is empty");
        }
        return arr[front];
    }
    
    public boolean isEmpty() {
        return size == 0;
    }
    
    public boolean isFull() {
        return size == capacity;
    }
}`;

export function QueueVisualizer() {
  const [queue, setQueue] = useState<number[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [maxSize] = useState(8);
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
    setQueue(step.queue);
  };

  const addStep = (operation: Step["operation"], value?: number, newQueue?: number[], highlightFront = false, highlightRear = false) => {
    const currentQueue = newQueue !== undefined ? newQueue : queue;
    let description = "";
    let highlightLines: number[] = [];

    switch (operation) {
      case "init":
        description = "Queue initialized with maximum capacity " + maxSize;
        highlightLines = [6, 7, 8, 9, 10, 11];
        break;
      case "enqueue":
        description = `Enqueue ${value} at the rear. Rear pointer moves to position ${currentQueue.length - 1}. Size: ${currentQueue.length}`;
        highlightLines = [14, 15, 16, 17, 18, 19, 20];
        break;
      case "dequeue":
        description = `Dequeue ${value} from the front. Front pointer moves forward. Size: ${currentQueue.length}`;
        highlightLines = [23, 24, 25, 26, 27, 28, 29, 30];
        break;
      case "peek":
        description = `Peek operation: Front element is ${value}`;
        highlightLines = [33, 34, 35, 36, 37];
        break;
      case "empty":
        description = "Queue is empty. Cannot perform dequeue operation.";
        highlightLines = [24, 25];
        break;
    }

    const newStep: Step = {
      queue: [...currentQueue],
      operation,
      value,
      description,
      highlightLines,
      highlightFront,
      highlightRear,
    };

    setSteps((prev) => [...prev, newStep]);
  };

  const handleEnqueue = () => {
    const value = parseInt(inputValue);
    if (isNaN(value)) {
      toast.error("Please enter a valid number");
      return;
    }
    if (queue.length >= maxSize) {
      toast.error("Queue Overflow! Maximum capacity reached");
      return;
    }

    const newQueue = [...queue, value];
    setQueue(newQueue);
    addStep("enqueue", value, newQueue, false, true);
    setInputValue("");
    setCurrentStep((prev) => prev + 1);
  };

  const handleDequeue = () => {
    if (queue.length === 0) {
      toast.error("Queue Underflow! Queue is empty");
      addStep("empty");
      setCurrentStep((prev) => prev + 1);
      return;
    }

    const value = queue[0];
    const newQueue = queue.slice(1);
    setQueue(newQueue);
    addStep("dequeue", value, newQueue, true, false);
    setCurrentStep((prev) => prev + 1);
  };

  const handlePeek = () => {
    if (queue.length === 0) {
      toast.error("Queue is empty");
      return;
    }
    const value = queue[0];
    toast.success(`Front element: ${value}`);
    addStep("peek", value, queue, true, false);
    setCurrentStep((prev) => prev + 1);
  };

  const handleReset = () => {
    setQueue([]);
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
                <label className="text-sm font-medium">Enqueue Value</label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleEnqueue()}
                    placeholder="Enter value"
                    className="h-9"
                  />
                  <Button onClick={handleEnqueue} size="icon" className="h-9 w-9">
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
              <Button onClick={handleDequeue} variant="destructive" size="sm">
                <Minus className="w-4 h-4 mr-1" />
                Dequeue
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
                <span className="font-semibold">{queue.length}</span>
                <span className="text-muted-foreground"> / {maxSize}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Status: </span>
                <span className={queue.length === 0 ? "text-yellow-500" : queue.length === maxSize ? "text-red-500" : "text-green-500"}>
                  {queue.length === 0 ? "Empty" : queue.length === maxSize ? "Full" : "Active"}
                </span>
              </div>
            </div>
          </Card>

          {/* Visualization */}
          <Card className="flex-1 min-h-[350px] p-6 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
            <div className="w-full max-w-full">
              {/* Front label */}
              {queue.length > 0 && (
                <div className="flex justify-start mb-2 ml-2">
                  <div className="text-sm font-semibold text-green-500 flex items-center gap-1">
                    <span>FRONT</span>
                    <span className="text-2xl">↓</span>
                  </div>
                </div>
              )}

              {/* Queue visualization */}
              <div className="flex items-center gap-2 min-h-[100px]">
                {queue.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center border-4 border-dashed border-muted-foreground/30 rounded-lg h-20">
                    <span className="text-muted-foreground">Queue is empty</span>
                  </div>
                ) : (
                  queue.map((value, index) => (
                    <div
                      key={`${index}-${value}`}
                      className={`flex-1 max-w-[90px] h-20 flex items-center justify-center border-4 rounded-lg text-xl font-bold transition-all duration-300 ${
                        index === 0
                          ? "border-green-500 bg-green-500/10"
                          : index === queue.length - 1
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-primary bg-primary/10"
                      } ${
                        (currentStepData?.highlightFront && index === 0) || (currentStepData?.highlightRear && index === queue.length - 1)
                          ? "scale-110 shadow-lg shadow-primary/50 bg-primary text-primary-foreground border-primary"
                          : ""
                      }`}
                    >
                      {value}
                    </div>
                  ))
                )}
              </div>

              {/* Rear label */}
              {queue.length > 0 && (
                <div className="flex justify-end mt-2 mr-2">
                  <div className="text-sm font-semibold text-blue-500 flex items-center gap-1">
                    <span className="text-2xl">↑</span>
                    <span>REAR</span>
                  </div>
                </div>
              )}

              {currentStepData && (
                <div className="mt-6 text-center">
                  <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                </div>
              )}

              {/* Legend */}
              <div className="mt-6 flex justify-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 border-4 border-green-500 bg-green-500/10 rounded"></div>
                  <span>Front</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 border-4 border-blue-500 bg-blue-500/10 rounded"></div>
                  <span>Rear</span>
                </div>
              </div>
            </div>
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
            <CodeDisplay code={queueCode} language="java" highlightLines={currentStepData?.highlightLines || []} />
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
                    Queue State
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
                        <span className="font-mono font-bold">{queue.length}/{maxSize}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Perform queue operations to see live execution
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
