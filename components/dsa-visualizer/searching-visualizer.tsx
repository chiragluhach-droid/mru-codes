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
    <div className="h-full flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col space-y-4">
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Algorithm</label>
              <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as SearchingAlgorithm)}>
                <SelectTrigger>
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
                className="w-full"
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
              <SearchIcon className="w-4 h-4 mr-2" />
              Search
            </Button>
            <Button onClick={handlePlayPause} variant="outline" size="sm" disabled={steps.length === 0}>
              {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
              {isPlaying ? "Pause" : "Play"}
            </Button>
            <Button onClick={handlePrevious} variant="outline" size="sm" disabled={currentStep <= 0}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button onClick={handleNext} variant="outline" size="sm" disabled={currentStep >= steps.length - 1}>
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </Card>

        <Card className="flex-1 p-6 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
          <div className="w-full max-w-4xl">
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
                    className={`w-16 h-16 flex flex-col items-center justify-center border-2 rounded-lg ${bgColor} ${borderColor} ${textColor} transition-all duration-300 transform ${
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
              <div className="text-center space-y-3">
                <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-md">
                  <p className="text-sm font-medium">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-muted-foreground">{currentStepData.description}</p>
                </div>
                <div className="flex items-center justify-center gap-4 text-lg">
                  <span className="text-muted-foreground">Target:</span>
                  <span className="font-bold text-primary text-2xl">{target}</span>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted border-2 border-border rounded"></div>
                <span>Unvisited</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span>Searching</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Found</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500/30 border-2 border-red-500 rounded"></div>
                <span>Not Found</span>
              </div>
              {algorithm === "binary" && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-purple-500 rounded"></div>
                    <span>Mid</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Left</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span>Right</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="lg:w-[500px] flex flex-col gap-4">
        <CodeDisplay
          code={algorithmData.code}
          language={algorithmData.language}
          highlightLines={currentStepData?.highlightLines || []}
        />
        <ComplexityDisplay
          timeComplexity={algorithmData.complexity.time}
          spaceComplexity={algorithmData.complexity.space}
          description={algorithmData.complexity.description}
        />
      </div>
    </div>
  );
}
