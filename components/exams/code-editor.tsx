"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Loader2 } from "lucide-react";
import { LANGUAGE_META, type ExamLanguage } from "@/lib/exams";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[200px] items-center justify-center text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Loading editor…
    </div>
  ),
});

export function CodeEditor({
  value,
  onChange,
  language,
  height = "100%",
  readOnly = false,
  /** Exam mode: no copy/paste from outside and no suggestions */
  locked = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  language: ExamLanguage;
  height?: string | number;
  readOnly?: boolean;
  locked?: boolean;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <Monaco
      height={height}
      language={LANGUAGE_META[language].monaco}
      theme={resolvedTheme === "dark" ? "vs-dark" : "light"}
      value={value}
      onChange={(v) => onChange?.(v ?? "")}
      onMount={(editor, monaco) => {
        if (!locked) return;
        // Block pasting code copied from elsewhere during an exam.
        editor.onKeyDown((e) => {
          if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
            e.preventDefault();
            e.stopPropagation();
          }
        });
        editor.getContainerDomNode().addEventListener("paste", (e) => e.preventDefault(), true);
        editor.getContainerDomNode().addEventListener("drop", (e) => e.preventDefault(), true);
      }}
      options={{
        readOnly,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 4,
        wordWrap: "on",
        padding: { top: 12, bottom: 12 },
        renderLineHighlight: "line",
        contextmenu: !locked,
        quickSuggestions: !locked,
        suggestOnTriggerCharacters: !locked,
        wordBasedSuggestions: locked ? "off" : "currentDocument",
        parameterHints: { enabled: !locked },
      }}
    />
  );
}
