"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BATCH_SECTION_PLACEHOLDER, normalizeBatchSection } from "@/lib/departments";

interface BatchSectionInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

/** Text input for a Batch/Section such as "2A"; uppercases as you type. */
export function BatchSectionInput({ id, value, onChange, disabled, className }: BatchSectionInputProps) {
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(normalizeBatchSection(e.target.value))}
      placeholder={BATCH_SECTION_PLACEHOLDER}
      maxLength={3}
      autoCapitalize="characters"
      autoComplete="off"
      disabled={disabled}
      className={cn("uppercase", className)}
    />
  );
}
