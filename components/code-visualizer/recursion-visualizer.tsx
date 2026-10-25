"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";
import { CodeDisplay } from "@/components/dsa-visualizer/code-display";
import { recursionExamples, Language } from "./examples/recursion-examples";
import { toast } from "react-hot-toast";

interface CallStackFrame {
  functionName: string;
  params: Record<string, any>;
  returnValue?: any;
  localVars?: Record<string, any>;
  id: number;
}

interface Step {
  callStack: CallStackFrame[];
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  highlightLines: number[];
  output?: string;
}

export function RecursionVisualizer() {
  const [language, setLanguage] = useState<Language>("java");
  const [exampleKey, setExampleKey] = useState("factorial");
  const [inputValue, setInputValue] = useState("5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const example = recursionExamples[exampleKey];
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
    if (isNaN(input) || input < 0 || input > 10) {
      toast.error("Please enter a valid number between 0 and 10");
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

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel */}
      <div className="flex-1 flex flex-col space-y-4">
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Example</label>
              <Select value={exampleKey} onValueChange={setExampleKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="factorial">Factorial</SelectItem>
                  <SelectItem value="fibonacci">Fibonacci</SelectItem>
                  <SelectItem value="sum">Sum of N</SelectItem>
                  <SelectItem value="power">Power</SelectItem>
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
              <label className="text-sm font-medium">Input Value</label>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value"
                min="0"
                max="10"
              />
            </div>

            <div className="space-y-2 col-span-full">
              <label className="text-sm font-medium">Speed: {speed}ms</label>
              <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={300} max={2000} step={100} />
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

        {/* Call Stack Visualization */}
        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <h3 className="text-lg font-semibold mb-4">Call Stack</h3>
          
          <div className="flex flex-col-reverse gap-2 min-h-[200px]">
            {currentStepData?.callStack && currentStepData.callStack.length > 0 ? (
              currentStepData.callStack.map((frame, index) => (
                <div
                  key={frame.id}
                  className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    index === currentStepData.callStack.length - 1
                      ? "border-primary bg-primary/10 scale-105 shadow-lg"
                      : "border-muted bg-muted/50"
                  }`}
                >
                  <div className="font-mono text-sm">
                    <div className="font-bold text-primary mb-2">
                      {frame.functionName}({Object.entries(frame.params).map(([k, v]) => `${k}=${v}`).join(", ")})
                    </div>
                    {frame.localVars && Object.keys(frame.localVars).length > 0 && (
                      <div className="text-muted-foreground text-xs">
                        Local: {Object.entries(frame.localVars).map(([k, v]) => `${k}=${v}`).join(", ")}
                      </div>
                    )}
                    {frame.returnValue !== undefined && (
                      <div className="text-green-500 text-xs mt-1">Return: {frame.returnValue}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Call stack is empty
              </div>
            )}
          </div>

          {currentStepData && (
            <div className="mt-4 bg-primary/10 text-primary px-4 py-2 rounded-md">
              <p className="text-sm font-medium">
                Step {currentStep + 1} of {steps.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{currentStepData.description}</p>
            </div>
          )}
        </Card>

        {/* Complexity Analysis */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Complexity Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Time:</span>
              <p className="text-sm font-mono font-semibold">{example.complexity?.time || "O(2^n)"}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Space:</span>
              <p className="text-sm font-mono font-semibold">{example.complexity?.space || "O(n)"}</p>
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
                  Line {currentStepData.highlightLines.join(", ")}
                </span>
                <p className="text-sm text-muted-foreground flex-1">
                  {currentStepData.description}
                </p>
              </div>
              {currentStepData.callStack.length > 0 && (
                <div className="text-xs font-mono bg-muted/50 px-3 py-2 rounded">
                  <span className="text-muted-foreground">Current Call: </span>
                  <span className="font-semibold">
                    {currentStepData.callStack[currentStepData.callStack.length - 1].functionName}(
                    {Object.entries(currentStepData.callStack[currentStepData.callStack.length - 1].params)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(", ")}
                    )
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
