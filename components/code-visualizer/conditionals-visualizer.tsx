"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, SkipBack, RotateCcw, CheckCircle, XCircle, GitBranch } from "lucide-react";
import { CodeDisplay } from "@/components/dsa-visualizer/code-display";
import { conditionalsExamples, Language } from "./examples/conditionals-examples";
import { toast } from "react-hot-toast";

interface Step {
  currentLine: number;
  description: string;
  variables: Record<string, any>;
  highlightLines: number[];
  output?: string;
  condition?: string;
  conditionResult?: boolean;
  pathTaken?: string;
}

export function ConditionalsVisualizer() {
  const [language, setLanguage] = useState<Language>("java");
  const [exampleKey, setExampleKey] = useState("ifElse");
  const [inputValue, setInputValue] = useState("18");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(700);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const example = conditionalsExamples[exampleKey as keyof typeof conditionalsExamples];
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
    if (isNaN(input)) {
      toast.error("Please enter a valid number");
      return;
    }

    // Validate based on example type
    if (exampleKey === "ifElse" && (input < 1 || input > 100)) {
      toast.error("Please enter age between 1 and 100");
      return;
    }
    if (exampleKey === "ifElseIf" && (input < 0 || input > 100)) {
      toast.error("Please enter marks between 0 and 100");
      return;
    }
    if (exampleKey === "switchCase" && (input < 1 || input > 7)) {
      toast.error("Please enter day between 1 and 7");
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

  // Get input label and default value based on example
  const getInputConfig = () => {
    switch (exampleKey) {
      case "ifElse":
        return { label: "Age", defaultValue: "18", placeholder: "Enter age (1-100)" };
      case "ifElseIf":
        return { label: "Marks", defaultValue: "75", placeholder: "Enter marks (0-100)" };
      case "nestedIf":
        return { label: "Number", defaultValue: "12", placeholder: "Enter number" };
      case "switchCase":
        return { label: "Day (1-7)", defaultValue: "3", placeholder: "Enter day (1-7)" };
      case "ternary":
        return { label: "Value A", defaultValue: "10", placeholder: "Enter value" };
      default:
        return { label: "Input", defaultValue: "10", placeholder: "Enter value" };
    }
  };

  // Update input value when example changes
  useEffect(() => {
    const config = getInputConfig();
    setInputValue(config.defaultValue);
    setSteps([]);
    setCurrentStep(-1);
  }, [exampleKey]);

  const inputConfig = getInputConfig();

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* Left Panel */}
      <div className="lg:w-[44%] flex flex-col space-y-4">
        <Card className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Conditional Type</label>
              <Select value={exampleKey} onValueChange={setExampleKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ifElse">If-Else</SelectItem>
                  <SelectItem value="ifElseIf">If-Else-If Ladder</SelectItem>
                  <SelectItem value="nestedIf">Nested If</SelectItem>
                  <SelectItem value="switchCase">Switch-Case</SelectItem>
                  <SelectItem value="ternary">Ternary Operator</SelectItem>
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
              <label className="text-sm font-medium">{inputConfig.label}</label>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputConfig.placeholder}
              />
            </div>

            <div className="space-y-2 col-span-full">
              <label className="text-sm font-medium">Speed: {speed}ms</label>
              <Slider value={[speed]} onValueChange={([v]) => setSpeed(v)} min={300} max={1500} step={100} />
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

        {/* Conditionals Visualization */}
        <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Control Flow
          </h3>
          
          {currentStepData ? (
            <div className="space-y-4">
              {/* Variables Display */}
              {currentStepData.variables && Object.keys(currentStepData.variables).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2 text-muted-foreground">Variables:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(currentStepData.variables).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded-md">
                        <span className="text-sm font-mono text-muted-foreground">{key}:</span>
                        <span className="text-sm font-mono font-bold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Condition Display */}
              {currentStepData.condition && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Condition:</h4>
                  <div className={`p-4 rounded-lg border-2 ${
                    currentStepData.conditionResult
                      ? "border-green-500 bg-green-500/10"
                      : "border-red-500 bg-red-500/10"
                  }`}>
                    <div className="flex items-center gap-2">
                      {currentStepData.conditionResult ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                      <span className="font-mono font-semibold">{currentStepData.condition}</span>
                    </div>
                    <p className={`text-xs mt-2 ${
                      currentStepData.conditionResult ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {currentStepData.conditionResult ? "TRUE ✓" : "FALSE ✗"}
                    </p>
                  </div>
                </div>
              )}

              {/* Path Taken Display */}
              {currentStepData.pathTaken && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Execution Path:</h4>
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-primary" />
                      <span className="text-sm font-mono font-semibold text-primary">
                        {currentStepData.pathTaken.toUpperCase().replace(/-/g, " ")}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Current step info */}
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-md">
                <p className="text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{currentStepData.description}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              Click "Visualize" to see conditional flow
            </div>
          )}
        </Card>

        {/* Complexity Analysis */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold mb-3">Complexity Analysis</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-muted-foreground">Time:</span>
              <p className="text-sm font-mono font-semibold">{example.complexity?.time || "O(1)"}</p>
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
