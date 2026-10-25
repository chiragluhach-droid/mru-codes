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
                <Select value={algorithm} onValueChange={(v) => setAlgorithm(v as SortingAlgorithm)}>
                  <SelectTrigger className="h-9">
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
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="reverse">Reverse</SelectItem>
                    <SelectItem value="sorted">Sorted</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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

            {inputMode === "custom" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Custom Input</label>
                <Input
                  placeholder="e.g., 64, 34, 25, 12, 22"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => generateArray(inputMode)} variant="outline" size="sm">
                <Shuffle className="w-4 h-4 mr-2" />
                Generate Array
              </Button>
              <Button onClick={visualize} variant="default" size="sm">
                Visualize
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
              <Button onClick={startChallenge} variant="secondary" size="sm">
                Challenge Mode
              </Button>
            </div>

            {showChallenge && (
              <Card className="p-3 bg-primary/5 border-primary/20">
                <h3 className="font-semibold mb-2 text-sm">🎯 Predict Next Step</h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Describe the next operation..."
                    value={challengeAnswer}
                    onChange={(e) => setChallengeAnswer(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && checkChallenge()}
                    className="text-sm"
                  />
                  <Button onClick={checkChallenge} size="sm">
                    Check
                  </Button>
                </div>
              </Card>
            )}
          </Card>

          {/* Visualization */}
          <Card className="p-4 flex flex-col items-center justify-center bg-gradient-to-br from-background to-muted/20">
            <div className="w-full flex items-end justify-center gap-1 h-48">
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
                      className={`w-full ${barColor} rounded-t-md transition-all duration-300`}
                      style={{ height: `${(value / maxValue) * 150}px` }}
                    />
                  </div>
                );
              })}
            </div>

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
            <div className="text-sm font-semibold mb-3">Complexity Analysis</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Time Complexity</div>
                <div className="font-mono text-xs space-y-0.5">
                  <div><span className="text-muted-foreground">Best:</span> <span className="text-green-600 dark:text-green-400">{algorithmData.complexity.time.best}</span></div>
                  <div><span className="text-muted-foreground">Avg:</span> <span className="text-yellow-600 dark:text-yellow-400">{algorithmData.complexity.time.average}</span></div>
                  <div><span className="text-muted-foreground">Worst:</span> <span className="text-red-600 dark:text-red-400">{algorithmData.complexity.time.worst}</span></div>
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Space Complexity</div>
                <div className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400">
                  {algorithmData.complexity.space}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Code Editor + Live Execution */}
        <div className="lg:w-[56%] flex flex-col gap-4">
          {/* Code Display */}
          <CodeDisplay
            code={algorithmData.code}
            language={algorithmData.language}
            highlightLines={currentStepData?.highlightLines || []}
          />

          {/* Live Execution Box */}
          <Card className="p-4 bg-muted/30 border-2">
            <div className="flex items-center gap-2 font-semibold mb-3 pb-2 border-b">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-base">Live Execution</span>
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
                    Array State
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border">
                    <div className="flex flex-wrap gap-1">
                      {displayArray.map((val, idx) => {
                        const isComparing = currentStepData?.comparing?.includes(idx);
                        const isSwapping = currentStepData?.swapping?.includes(idx);
                        const isSorted = currentStepData?.sorted?.includes(idx);
                        const isPivot = currentStepData?.pivot === idx;
                        
                        let bgColor = "bg-primary/20";
                        if (isSorted) bgColor = "bg-green-500/30";
                        else if (isSwapping) bgColor = "bg-red-500/30";
                        else if (isComparing) bgColor = "bg-yellow-500/30";
                        else if (isPivot) bgColor = "bg-purple-500/30";
                        
                        return (
                          <div key={idx} className={`${bgColor} px-2 py-1 rounded text-xs font-mono font-semibold`}>
                            {val}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">
                  Click "Visualize" to see live execution
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
