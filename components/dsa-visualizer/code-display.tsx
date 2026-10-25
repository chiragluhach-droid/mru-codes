"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useRef } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface CodeDisplayProps {
  code: string;
  language: string;
  highlightLines?: number[];
}

export function CodeDisplay({ code, language, highlightLines = [] }: CodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightedLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const highlightedLine = highlightedLineRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const lineRect = highlightedLine.getBoundingClientRect();
      
      const scrollTop = lineRect.top - containerRect.top + container.scrollTop - containerRect.height / 2 + lineRect.height / 2;
      
      container.scrollTo({
        top: scrollTop,
        behavior: "smooth",
      });
    }
  }, [highlightLines]);

  const lines = code.split("\n");

  return (
    <Card className="overflow-hidden flex flex-col h-[500px]">
      <div className="bg-muted/50 px-4 py-2 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-sm font-mono ml-2">{language}</span>
        </div>
        <span className="text-xs text-muted-foreground">Real-time Code Highlighting</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-auto p-4 bg-[#1e1e1e] relative">
        <div className="font-mono text-sm">
          {lines.map((line, index) => {
            const lineNumber = index + 1;
            const isHighlighted = highlightLines.includes(lineNumber);
            
            return (
              <div
                key={index}
                ref={isHighlighted && index === highlightLines[0] - 1 ? highlightedLineRef : null}
                className={`flex transition-all duration-300 ${
                  isHighlighted
                    ? "bg-primary/20 border-l-4 border-primary shadow-lg shadow-primary/20"
                    : "hover:bg-muted/5"
                }`}
              >
                <span className="select-none text-muted-foreground text-right pr-4 pl-2 min-w-[3rem]">
                  {lineNumber}
                </span>
                <pre className="flex-1 overflow-visible">
                  <code className={`language-${language}`}>
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: 0,
                        background: "transparent",
                        fontSize: "0.875rem",
                      }}
                      codeTagProps={{
                        style: {
                          background: "transparent",
                          fontFamily: "inherit",
                        },
                      }}
                    >
                      {line || " "}
                    </SyntaxHighlighter>
                  </code>
                </pre>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
