"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";
import { CodeDisplay } from "@/components/dsa-visualizer/code-display";
import { loopExamples, Language } from "./examples/loop-examples";
import { toast } from "react-hot-toast";

interface Step {
  variables: Record<string, any>;
  currentLine: number;
  description: string;
  highlightLines: number[];
  output?: string;
  loopIteration?: number;
}

export function LoopsVisualizer() {
  const [language, setLanguage] = useState<Language>("java");
  const [exampleKey, setExampleKey] = useState("forLoop");
  const [inputValue, setInputValue] = useState("5");
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const example = loopExamples[exampleKey];
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
    if (isNaN(input) || input < 1 || input > 15) {
      toast.error("Please enter a valid number between 1 and 15");
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
                  <SelectItem value="forLoop">For Loop</SelectItem>
                  <SelectItem value="whileLoop">While Loop</SelectItem>
                  <SelectItem value="nestedLoop">Nested Loop</SelectItem>
                  <SelectItem value="doWhileLoop">Do-While Loop</SelectItem>
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
              <label className="text-sm font-medium">Input Value (n)</label>
              <Input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter value"
                min="1"
                max="15"
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

        <Card className="flex-1 p-6 bg-gradient-to-br from-background to-muted/20">
          <h3 className="text-lg font-semibold mb-4">Variables</h3>
          
          {currentStepData?.variables && Object.keys(currentStepData.variables).length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
              {Object.entries(currentStepData.variables).map(([key, value]) => (
                <div
                  key={key}
                  className="p-4 rounded-lg border-2 border-primary bg-primary/10 transition-all"
                >
                  <div className="text-sm text-muted-foreground mb-1">{key}</div>
                  <div className="text-2xl font-mono font-bold">{String(value)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No variables to display
            </div>
          )}

          {currentStepData && (
            <div className="mt-6 space-y-3">
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-md">
                <p className="text-sm font-medium">
                  Step {currentStep + 1} of {steps.length}
                  {currentStepData.loopIteration !== undefined && ` - Iteration ${currentStepData.loopIteration}`}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
              
              {currentStepData.output && (
                <div className="bg-green-500/10 border border-green-500/20 px-4 py-3 rounded-md">
                  <p className="text-sm font-semibold mb-2">Output:</p>
                  <pre className="text-xs font-mono text-green-600 dark:text-green-400 whitespace-pre-wrap">
                    {currentStepData.output}
                  </pre>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:w-[600px]">
        <CodeDisplay
          code={currentCode}
          language={language === "cpp" ? "cpp" : language}
          highlightLines={currentStepData?.highlightLines || []}
        />
      </div>
    </div>
  );
}
