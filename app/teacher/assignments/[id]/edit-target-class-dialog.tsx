"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ClassTargetFields,
  classTargetBody,
  classTargetError,
  type ClassTargetValue,
} from "@/components/class-fields";
import toast from "react-hot-toast";

interface EditTargetClassDialogProps {
  assignmentId: string;
  targetDepartment: string | null;
  targetBatch: string | null;
  targetSection: string | null;
  targetSemester: number | null;
}

export function EditTargetClassDialog({
  assignmentId,
  targetDepartment,
  targetBatch,
  targetSection,
  targetSemester,
}: EditTargetClassDialogProps) {
  const router = useRouter();
  const fromProps = (): ClassTargetValue => ({
    department: targetDepartment ?? "",
    batch: targetBatch ?? "",
    section: targetSection ?? "",
    semester: targetSemester ? String(targetSemester) : "",
  });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [target, setTarget] = useState<ClassTargetValue>(fromProps);

  const handleSave = async () => {
    const error = classTargetError(target);
    if (error) {
      toast.error(error);
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classTargetBody(target)),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update target class");
      }

      toast.success("Target class updated");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update target class");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setTarget(fromProps());
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4 mr-2" />
          Edit Target Class
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Target Class</DialogTitle>
          <DialogDescription>
            Choose the department, batch, section and semester who can see this assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ClassTargetFields value={target} onChange={setTarget} disabled={saving} idPrefix="edit-target" />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
