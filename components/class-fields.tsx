"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BATCH_OPTIONS,
  DEPARTMENT_OPTIONS,
  SECTION_OPTIONS,
  SEMESTER_OPTIONS,
} from "@/lib/departments";

const ALL = "all";

export interface ClassTargetValue {
  department: string;
  batch: string;
  /** "" = all sections */
  section: string;
  /** "" = all semesters */
  semester: string;
}

export const EMPTY_CLASS_TARGET: ClassTargetValue = { department: "", batch: "", section: "", semester: "" };

/** Request-body fields for a teacher's target (matches lib/class-targeting parseClassTarget). */
export function classTargetBody(value: ClassTargetValue) {
  return {
    targetDepartment: value.department,
    targetBatch: value.batch,
    targetSection: value.section || null,
    targetSemester: value.semester ? Number(value.semester) : null,
  };
}

export function classTargetError(value: ClassTargetValue) {
  if (!value.department) return "Choose the target department";
  if (!value.batch) return "Choose the target batch";
  return null;
}

/** Report filter params (?department=&batch=&section=&semester=), skipping "all". */
export function classFilterParams(value: ClassTargetValue, params = new URLSearchParams()) {
  if (value.department) params.set("department", value.department);
  if (value.batch) params.set("batch", value.batch);
  if (value.section) params.set("section", value.section);
  if (value.semester) params.set("semester", value.semester);
  return params;
}

/**
 * Department → Batch → Section → Semester pickers for teachers. By default
 * department and batch are required (assigning work); `allowAll` makes every
 * field optional (report filters).
 */
export function ClassTargetFields({
  value,
  onChange,
  disabled,
  idPrefix = "target",
  className,
  allowAll = false,
}: {
  value: ClassTargetValue;
  onChange: (value: ClassTargetValue) => void;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
  allowAll?: boolean;
}) {
  const set = (patch: Partial<ClassTargetValue>) => onChange({ ...value, ...patch });
  const required = allowAll ? null : <span className="text-destructive">*</span>;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-department`}>Department {required}</Label>
        <Select
          value={value.department || (allowAll ? ALL : "")}
          onValueChange={(v) => set({ department: v === ALL ? "" : v })}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-department`}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            {allowAll && <SelectItem value={ALL}>All departments</SelectItem>}
            {DEPARTMENT_OPTIONS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-batch`}>Batch {required}</Label>
        <Select
          value={value.batch || (allowAll ? ALL : "")}
          onValueChange={(v) => set({ batch: v === ALL ? "" : v })}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-batch`}>
            <SelectValue placeholder="Select batch" />
          </SelectTrigger>
          <SelectContent>
            {allowAll && <SelectItem value={ALL}>All batches</SelectItem>}
            {BATCH_OPTIONS.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-section`}>Section</Label>
        <Select
          value={value.section || ALL}
          onValueChange={(v) => set({ section: v === ALL ? "" : v })}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-section`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All sections</SelectItem>
            {SECTION_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>
                Section {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-semester`}>Semester</Label>
        <Select
          value={value.semester || ALL}
          onValueChange={(v) => set({ semester: v === ALL ? "" : v })}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefix}-semester`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All semesters</SelectItem>
            {SEMESTER_OPTIONS.map((s) => (
              <SelectItem key={s} value={String(s)}>
                Semester {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

/** One labelled select used by the student's own class fields. */
export function ClassSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
  error,
  triggerClassName,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
  error?: string;
  triggerClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

export const SECTION_SELECT_OPTIONS = SECTION_OPTIONS.map((s) => ({ value: s, label: `Section ${s}` }));
export const SEMESTER_SELECT_OPTIONS = SEMESTER_OPTIONS.map((s) => ({ value: String(s), label: `Semester ${s}` }));
export const BATCH_SELECT_OPTIONS = BATCH_OPTIONS.map((b) => ({ value: b, label: b }));
