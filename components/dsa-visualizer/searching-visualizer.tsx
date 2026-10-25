"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Search as SearchIcon } from "lucide-react";
import { CodeDisplay } from "./code-display";
import { ComplexityDisplay } from "./complexity-display";
import { searchingAlgorithms, SearchingAlgorithm } from "./algorithms/searching-algorithms";
import { toast } from "react-hot-toast";

interface Step {
  array: number[];
  searching?: number[];
  found?: number;
  notFound?: number[];
  left?: number;
  right?: number;
  mid?: number;
  description: string;
  highlightLines: number[];
}

export function SearchingVisualizer() {
  const [array, setArray] = useState<number[]>([10, 20, 30, 40, 50, 60, 70, 80, 90]);
  const [target, setTarget] = useState(50);
  const [algorithm, setAlgorithm] = useState<SearchingAlgorithm>("binary");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const algorithmData = searchingAlgorithms[algorithm];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (isPlaying && currentStep < steps.length - 1) {
      timerRef.current = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, speed);
    } else if (currentStep >= steps.length - 1) {
      setIsPlaying(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying, currentStep, steps.length, speed]);

  const generateSortedArray = () => {
    const newArray = Array.from({ length: 12 }, (_, i) => (i + 1) * 10);
    setArray(newArray);
    setTarget(50);
    setSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
  };

  const generateUnsortedArray = () => {
    const newArray = [45, 12, 78, 23, 67, 34, 89, 56, 90, 11, 50];
    setArray(newArray);
    setTarget(50);
    setSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
  };

  const visualize = () => {
    if (algorithm === "binary" && !isSorted(array)) {
      toast.error("Binary search requires a sorted array!");
      return;
    }
    const newSteps = algorithmData.generate([...array], target);
    setSteps(newSteps);
    setCurrentStep(0);
  };

  const isSorted = (arr: number[]) => {
    for (let i = 1; i < arr.length; i++) {
      if (arr[i] < arr[i - 1]) return false;
    }
    return true;
  };

  const handlePlayPause = () => {
    if (steps.length === 0) {
      toast.error("Please generate visualization first");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentStep(-1);
    setIsPlaying(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setIsPlaying(false);
    }
  };

  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;
  const displayArray = currentStepData?.array || array;

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto pb-4">
      {/* TOP ROW: Controls (Left) + Code & Live Execution (Right) */}
      <div className="flex flex-col lg:flex-row gap-4">
        
        {/* LEFT: Controls + Visualization */}
        <div className="lg:w-[44%] flex flex-col gap-4">
          {/* Controls Card */}
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Algorithm</label>
                <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as SearchingAlgorithm)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear Search</SelectItem>
                    <SelectItem value="binary">Binary Search</SelectItem>
                    <SelectItem value="jump">Jump Search</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Target Value</label>
                <Input
                  type="number"
                  value={target}
                  onChange={(e) => setTarget(parseInt(e.target.value) || 0)}
                  placeholder="Enter target"
                  className="h-9"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Speed: {speed}ms</label>
                <Slider
                  value={[speed]}
                  onValueChange={([v]) => setSpeed(v)}
                  min={200}
                  max={2000}
                  step={100}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generateSortedArray} variant="outline" size="sm">
                Sorted Array
              </Button>
              <Button onClick={generateUnsortedArray} variant="outline" size="sm">
                Unsorted Array
              </Button>
              <Button onClick={visualize} variant="default" size="sm">
                <SearchIcon className="w-4 h-4 mr-1" />
                Search
              </Button>
              <Button onClick={handlePlayPause} variant="outline" size="sm" disabled={steps.length === 0}>
                {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {isPlaying ? "Pause" : "Play"}
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
          </Card>

          {/* Visualization */}
          <Card className="flex-1 min-h-[350px] p-6 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
            <div className="w-full max-w-full">
              <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
                {displayArray.map((value, idx) => {
                  const isSearching = currentStepData?.searching?.includes(idx);
                  const isFound = currentStepData?.found === idx;
                  const isNotFound = currentStepData?.notFound?.includes(idx);
                  const isLeft = currentStepData?.left === idx;
                  const isRight = currentStepData?.right === idx;
                  const isMid = currentStepData?.mid === idx;

                  let bgColor = "bg-muted";
                  let borderColor = "border-border";
                  let textColor = "text-foreground";

                  if (isFound) {
                    bgColor = "bg-green-500";
                    borderColor = "border-green-600";
                    textColor = "text-white";
                  } else if (isSearching) {
                    bgColor = "bg-yellow-500";
                    borderColor = "border-yellow-600";
                    textColor = "text-white";
                  } else if (isNotFound) {
                    bgColor = "bg-red-500/30";
                    borderColor = "border-red-500";
                    textColor = "text-foreground";
                  } else if (isMid) {
                    bgColor = "bg-purple-500";
                    borderColor = "border-purple-600";
                    textColor = "text-white";
                  } else if (isLeft) {
                    bgColor = "bg-blue-500";
                    borderColor = "border-blue-600";
                    textColor = "text-white";
                  } else if (isRight) {
                    bgColor = "bg-orange-500";
                    borderColor = "border-orange-600";
                    textColor = "text-white";
                  }

                  return (
                    <div
                      key={idx}
                      className={`w-14 h-14 flex flex-col items-center justify-center border-2 rounded-lg ${bgColor} ${borderColor} ${textColor} transition-all duration-300 ${
                        isSearching || isFound || isMid ? "scale-110 shadow-lg" : ""
                      }`}
                    >
                      <div className="text-xs opacity-60">[{idx}]</div>
                      <div className="text-lg font-bold">{value}</div>
                    </div>
                  );
                })}
              </div>

              {currentStepData && (
                <div className="text-center space-y-2">
                  <div className="inline-block bg-primary/10 text-primary px-3 py-1 rounded-md text-sm font-medium">
                    Step {currentStep + 1} of {steps.length}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-lg">
                    <span className="text-muted-foreground">Target:</span>
                    <span className="font-bold text-primary text-xl">{target}</span>
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-muted border-2 border-border rounded"></div>
                  <span>Unvisited</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Searching</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Found</span>
                </div>
                {algorithm === "binary" && (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-purple-500 rounded"></div>
                      <span>Mid</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span>Left</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-orange-500 rounded"></div>
                      <span>Right</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Code Editor + Complexity & Live Execution Side by Side */}
        <div className="lg:w-[56%] flex flex-col gap-4">
          {/* Code Display */}
          <div className="flex-1">
            <CodeDisplay
              code={algorithmData.code}
              language={algorithmData.language}
              highlightLines={currentStepData?.highlightLines || []}
            />
          </div>

          {/* Complexity and Live Execution Side by Side */}
          <div className="flex gap-4">
            {/* Complexity Box */}
            <Card className="w-[200px] p-3 bg-muted/20 border shrink-0">
              <div className="text-sm font-semibold mb-3">Complexity</div>
              <div className="space-y-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Time</div>
                  <div className="font-mono text-xs space-y-0.5">
                    <div className="text-green-600 dark:text-green-400">{algorithmData.complexity.time.best}</div>
                    <div className="text-yellow-600 dark:text-yellow-400">{algorithmData.complexity.time.average}</div>
                    <div className="text-red-600 dark:text-red-400">{algorithmData.complexity.time.worst}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Space</div>
                  <div className="font-mono text-xs font-semibold text-purple-600 dark:text-purple-400">
                    {algorithmData.complexity.space}
                  </div>
                </div>
              </div>
            </Card>

            {/* Live Execution Box */}
            <Card className="flex-1 p-4 bg-muted/30 border-2">
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
                    Search Status
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Target: </span>
                        <span className="font-mono font-bold text-primary">{target}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Step: </span>
                        <span className="font-mono font-bold">{currentStep + 1}/{steps.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Click "Search" to start visualization
                </p>
              </div>
            )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
