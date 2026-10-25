"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";
import { CodeDisplay } from "@/components/dsa-visualizer/code-display";
import { arrayExamples, Language } from "./examples/array-examples";
import { toast } from "react-hot-toast";

interface Step {
  array: number[];
  currentIndex?: number;
  highlightIndices: number[];
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  output?: string;
}

export function ArraysVisualizer() {
  const [language, setLanguage] = useState<Language>("java");
  const [exampleKey, setExampleKey] = useState("traversal");
  const [inputValue, setInputValue] = useState("5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const example = arrayExamples[exampleKey as keyof typeof arrayExamples];
  const currentCode = example.code[language];

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

  const visualize = () => {
    const input = parseInt(inputValue);
    if (isNaN(input) || input < 1 || input > 10) {
      toast.error("Please enter a valid number between 1 and 10");
      return;
    }

    const newSteps = example.generateSteps(input);
    setSteps(newSteps);
    setCurrentStep(0);
    setIsPlaying(false);
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

  // Get input label based on example
  const getInputLabel = () => {
    switch (exampleKey) {
      case "traversal":
        return "Array Size";
      case "search":
        return "Array Size";
      case "insertion":
        return "Insert Position";
      case "deletion":
        return "Delete Position";
      case "reversal":
        return "Array Size";
      default:
        return "Input Value";
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel */}
      <div className="lg:w-[44%] flex flex-col space-y-4">
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Operation</label>
              <Select value={exampleKey} onValueChange={setExampleKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="traversal">Traversal</SelectItem>
                  <SelectItem value="search">Linear Search</SelectItem>
                  <SelectItem value="insertion">Insertion</SelectItem>
                  <SelectItem value="deletion">Deletion</SelectItem>
                  <SelectItem value="reversal">Reversal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Language</label>
              <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c">C</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{getInputLabel()}</label>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value"
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2 col-span-full">
              <label className="text-sm font-medium">Speed: {speed}ms</label>
              <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={200} max={1500} step={100} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
          </div>
        </Card>

        {/* Array Visualization */}
        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <h3 className="text-lg font-semibold mb-4">Array Visualization</h3>
          
          {currentStepData?.array && currentStepData.array.length > 0 ? (
            <div className="space-y-6">
              {/* Array elements */}
              <div className="flex justify-center items-end gap-2 min-h-[120px]">
                {currentStepData.array.map((value, index) => (
                  <div key={index} className="flex flex-col items-center gap-2">
                    {/* Index label */}
                    <div className="text-xs text-muted-foreground font-mono">[{index}]</div>
                    
                    {/* Array box */}
                    <div
                      className={`w-14 h-14 flex items-center justify-center border-2 rounded-md font-mono font-bold text-lg transition-all duration-300 ${
                        currentStepData.highlightIndices.includes(index)
                          ? "border-primary bg-primary/20 scale-110 shadow-lg"
                          : currentStepData.currentIndex === index
                          ? "border-yellow-500 bg-yellow-500/20"
                          : "border-muted bg-muted/30"
                      }`}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current step info */}
              {currentStepData && (
                <div className="bg-primary/10 text-primary px-4 py-2 rounded-md">
                  <p className="text-sm font-medium">
                    Step {currentStep + 1} of {steps.length}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{currentStepData.description}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Click "Visualize" to see array operations
            </div>
          )}
        </Card>

        {/* Complexity Analysis */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Complexity Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Time:</span>
              <p className="text-sm font-mono font-semibold">{example.complexity?.time || "O(n)"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Space:</span>
              <p className="text-sm font-mono font-semibold">{example.complexity?.space || "O(1)"}</p>
            </div>
          </div>
          {example.complexity?.description && (
            <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
              {example.complexity.description}
            </p>
          )}
        </Card>
      </div>

      {/* Right Panel - Code */}
      <div className="lg:w-[56%] flex flex-col space-y-4">
        <CodeDisplay
          code={currentCode}
          language={language === "cpp" ? "cpp" : language}
          highlightLines={currentStepData?.highlightLines || []}
        />

        {/* Live Code Explanation */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Live Execution
          </h3>
          {currentStepData ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded">
                  Line {currentStepData.currentLine}
                </span>
                <p className="text-sm text-muted-foreground flex-1">
                  {currentStepData.description}
                </p>
              </div>
              {currentStepData.variables && Object.keys(currentStepData.variables).length > 0 && (
                <div className="text-xs font-mono bg-muted/50 px-3 py-2 rounded">
                  <span className="text-muted-foreground">Variables: </span>
                  <span className="font-semibold">
                    {Object.entries(currentStepData.variables)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                  </span>
                </div>
              )}
              {currentStepData.output && (
                <div className="bg-green-500/10 border border-green-500/20 px-3 py-2 rounded-md">
                  <p className="text-xs font-semibold mb-1">Output:</p>
                  <pre className="text-xs font-mono text-green-600 dark:text-green-400 whitespace-pre-wrap">
                    {currentStepData.output}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Visualize" to start execution
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
