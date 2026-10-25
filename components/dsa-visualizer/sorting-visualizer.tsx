"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Play, Pause, RotateCcw, SkipForward, SkipBack, Shuffle } from "lucide-react";
import { CodeDisplay } from "./code-display";
import { ComplexityDisplay } from "./complexity-display";
import { sortingAlgorithms, SortingAlgorithm } from "./algorithms/sorting-algorithms";
import { toast } from "react-hot-toast";

interface Step {
  array: number[];
  comparing?: number[];
  swapping?: number[];
  sorted?: number[];
  pivot?: number;
  description: string;
  highlightLines: number[];
}

export function SortingVisualizer() {
  const [array, setArray] = useState<number[]>([64, 34, 25, 12, 22, 11, 90]);
  const [algorithm, setAlgorithm] = useState<SortingAlgorithm>("bubble");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(500);
  const [inputMode, setInputMode] = useState("standard");
  const [customInput, setCustomInput] = useState("");
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const algorithmData = sortingAlgorithms[algorithm];

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

  const generateArray = (mode: string) => {
    let newArray: number[] = [];
    switch (mode) {
      case "standard":
        newArray = [64, 34, 25, 12, 22, 11, 90];
        break;
      case "small":
        newArray = [5, 2, 8, 1, 9];
        break;
      case "reverse":
        newArray = [90, 80, 70, 60, 50, 40, 30, 20, 10];
        break;
      case "sorted":
        newArray = [10, 20, 30, 40, 50, 60, 70, 80, 90];
        break;
      case "nearly":
        newArray = [10, 20, 30, 25, 50, 60, 70, 65, 90];
        break;
      case "equal":
        newArray = [50, 50, 50, 50, 50, 50];
        break;
      case "random":
        newArray = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100) + 1);
        break;
      case "custom":
        if (customInput) {
          newArray = customInput
            .split(",")
            .map((n) => parseInt(n.trim()))
            .filter((n) => !isNaN(n));
          if (newArray.length === 0) {
            toast.error("Invalid input format");
            return;
          }
        }
        break;
    }
    setArray(newArray);
    setSteps([]);
    setCurrentStep(-1);
    setIsPlaying(false);
    setShowChallenge(false);
  };

  const visualize = () => {
    const newSteps = algorithmData.generate([...array]);
    setSteps(newSteps);
    setCurrentStep(0);
    setShowChallenge(false);
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
    setShowChallenge(false);
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

  const startChallenge = () => {
    if (steps.length === 0) {
      toast.error("Please generate visualization first");
      return;
    }
    if (currentStep >= steps.length - 1) {
      toast.error("Already at the last step");
      return;
    }
    setShowChallenge(true);
    setIsPlaying(false);
  };

  const checkChallenge = () => {
    if (currentStep >= steps.length - 1) return;
    
    const nextStep = steps[currentStep + 1];
    const userAnswer = challengeAnswer.trim().toLowerCase();
    const correctAnswer = nextStep.description.toLowerCase();
    
    if (userAnswer && correctAnswer.includes(userAnswer.substring(0, 10))) {
      toast.success("Correct! Moving to next step");
      setCurrentStep((prev) => prev + 1);
      setShowChallenge(false);
      setChallengeAnswer("");
    } else {
      toast.error("Try again! Hint: " + nextStep.description.substring(0, 20) + "...");
    }
  };

  const currentStepData = currentStep >= 0 ? steps[currentStep] : null;
  const displayArray = currentStepData?.array || array;
  const maxValue = Math.max(...displayArray);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel - Controls and Visualization */}
      <div className="flex-1 flex flex-col space-y-4">
        {/* Controls */}
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Algorithm</label>
              <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as SortingAlgorithm)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bubble">Bubble Sort</SelectItem>
                  <SelectItem value="selection">Selection Sort</SelectItem>
                  <SelectItem value="insertion">Insertion Sort</SelectItem>
                  <SelectItem value="merge">Merge Sort</SelectItem>
                  <SelectItem value="quick">Quick Sort</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Input Type</label>
              <Select value={inputMode} onValueChange={setInputMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="reverse">Reverse Sorted</SelectItem>
                  <SelectItem value="sorted">Already Sorted</SelectItem>
                  <SelectItem value="nearly">Nearly Sorted</SelectItem>
                  <SelectItem value="equal">All Equal</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {inputMode === "custom" && (
              <div className="space-y-2 col-span-full">
                <label className="text-sm font-medium">Custom Input (comma-separated)</label>
                <Input
                  placeholder="e.g., 64, 34, 25, 12, 22"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Speed: {speed}ms</label>
              <Slider
                value={[speed]}
                onValueChange={([v]) => setSpeed(v)}
                min={100}
                max={2000}
                step={100}
                className="w-full"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generateArray(inputMode)} variant="outline" size="sm">
              <Shuffle className="w-4 h-4 mr-2" />
              Generate Array
            </Button>
            <Button onClick={visualize} variant="default" size="sm">
              Visualize
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
            <Button onClick={startChallenge} variant="secondary" size="sm">
              Challenge Mode
            </Button>
          </div>

          {showChallenge && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-2">🎯 Predict the Next Step</h3>
              <p className="text-sm text-muted-foreground mb-3">
                What will happen in the next step?
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Describe the next operation..."
                  value={challengeAnswer}
                  onChange={(e) => setChallengeAnswer(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && checkChallenge()}
                />
                <Button onClick={checkChallenge} size="sm">
                  Check
                </Button>
              </div>
            </Card>
          )}
        </Card>

        {/* Visualization Area */}
        <Card className="flex-1 p-6 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
          <div className="w-full flex items-end justify-center gap-1 h-64">
            {displayArray.map((value, idx) => {
              const isComparing = currentStepData?.comparing?.includes(idx);
              const isSwapping = currentStepData?.swapping?.includes(idx);
              const isSorted = currentStepData?.sorted?.includes(idx);
              const isPivot = currentStepData?.pivot === idx;

              let barColor = "bg-primary";
              if (isSorted) barColor = "bg-green-500";
              else if (isSwapping) barColor = "bg-red-500";
              else if (isComparing) barColor = "bg-yellow-500";
              else if (isPivot) barColor = "bg-purple-500";

              return (
                <div key={idx} className="flex flex-col items-center gap-1 flex-1 max-w-[80px]">
                  <span className="text-xs font-mono text-muted-foreground">{value}</span>
                  <div
                    className={`w-full ${barColor} rounded-t-md transition-all duration-300 relative group`}
                    style={{ height: `${(value / maxValue) * 200}px` }}
                  >
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {currentStepData && (
            <div className="mt-8 text-center space-y-2">
              <div className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-md">
                <p className="text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
              <p className="text-muted-foreground max-w-2xl">{currentStepData.description}</p>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <span>Unsorted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Comparing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Swapping</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span>Pivot</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Sorted</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Panel - Code and Complexity */}
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
