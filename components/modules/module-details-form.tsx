"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODULE_LEVELS, moduleDetailsSchema, type ModuleDetails } from "@/lib/modules";

interface ModuleDetailsFormProps {
  defaultValues?: Partial<ModuleDetails>;
  submitLabel: string;
  onSubmit: (values: ModuleDetails) => Promise<void>;
  onCancel?: () => void;
}

export function ModuleDetailsForm({ defaultValues, submitLabel, onSubmit, onCancel }: ModuleDetailsFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ModuleDetails>({
    resolver: zodResolver(moduleDetailsSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      level: "easy",
      badgeName: "",
      ...defaultValues,
    },
  });

  const title = watch("title");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="module-title">Module title</Label>
        <Input id="module-title" placeholder="e.g. Pointers in C" {...register("title")} />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="module-description">What students will learn</Label>
        <Textarea
          id="module-description"
          rows={4}
          placeholder="A short overview of the module and its outcomes"
          {...register("description")}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="module-category">Topic (optional)</Label>
          <Input id="module-category" placeholder="e.g. Memory, Arrays" {...register("category")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="module-level">Level</Label>
          <Select
            value={watch("level")}
            onValueChange={(value) => setValue("level", value as ModuleDetails["level"], { shouldValidate: true })}
          >
            <SelectTrigger id="module-level">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODULE_LEVELS.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="module-badge">Badge name</Label>
        <Input
          id="module-badge"
          placeholder={title ? `${title} Achiever` : "e.g. Pointer Pro"}
          {...register("badgeName")}
        />
        <p className="text-xs text-muted-foreground">
          Students earn this badge after completing every lesson.
        </p>
        {errors.badgeName && <p className="text-sm text-destructive">{errors.badgeName.message}</p>}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
