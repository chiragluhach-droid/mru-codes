"use client";

import { useRef, useState } from "react";
import { Film, Loader2, Plus, UploadCloud, X } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatBytes, uploadToCloudinary, type UploadHandle } from "@/lib/cloudinary-upload";

const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

interface LessonUploadDialogProps {
  moduleId: string;
  onCreated: () => void;
}

type Stage = "idle" | "uploading" | "saving";

export function LessonUploadDialog({ moduleId, onCreated }: LessonUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const uploadRef = useRef<UploadHandle | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = stage !== "idle";

  const reset = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setStage("idle");
    setProgress(0);
    uploadRef.current = null;
  };

  const pickFile = (picked: File | undefined) => {
    if (!picked) return;
    if (!picked.type.startsWith("video/")) {
      toast.error("Please choose a video file (MP4, MOV, WebM, MKV).");
      return;
    }
    if (picked.size > MAX_VIDEO_BYTES) {
      toast.error(`That video is ${formatBytes(picked.size)}. The limit is 100 MB per lesson.`);
      return;
    }
    setFile(picked);
    if (!title.trim()) setTitle(picked.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
  };

  const handleSubmit = async () => {
    if (!file) return toast.error("Choose a video to upload");
    if (title.trim().length < 2) return toast.error("Give the lesson a title");

    try {
      setStage("uploading");
      const handle = uploadToCloudinary(moduleId, "video", file, setProgress);
      uploadRef.current = handle;
      const asset = await handle.promise;

      setStage("saving");
      const response = await fetch(`/api/modules/${moduleId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), publicId: asset.publicId }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Failed to save the lesson");

      toast.success("Lesson added");
      reset();
      setOpen(false);
      onCreated();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      if (message !== "Upload cancelled") toast.error(message);
      setStage("idle");
      setProgress(0);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return; // keep the dialog open while uploading
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add lesson
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add a video lesson</DialogTitle>
          <DialogDescription>MP4, MOV, WebM or MKV, up to 100 MB.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {file ? (
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-md bg-primary/10 p-2">
                <Film className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
              </div>
              {!busy && (
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} aria-label="Remove video">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40"
              )}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
              <span className="text-sm font-medium">Drag a video here or click to browse</span>
              <span className="text-xs text-muted-foreground mt-1">Up to 100 MB</span>
            </button>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              pickFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          <div className="space-y-2">
            <Label htmlFor="lesson-title">Lesson title</Label>
            <Input
              id="lesson-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pointer arithmetic"
              disabled={busy}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lesson-description">Notes for students (optional)</Label>
            <Textarea
              id="lesson-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Key points, links, or what to practise after watching"
              disabled={busy}
            />
          </div>

          {stage !== "idle" && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{stage === "uploading" ? "Uploading video…" : "Processing…"}</span>
                <span>{stage === "uploading" ? `${progress}%` : ""}</span>
              </div>
              <Progress value={stage === "uploading" ? progress : 100} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          {stage === "uploading" ? (
            <Button variant="outline" onClick={() => uploadRef.current?.cancel()}>
              Cancel upload
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={busy || !file}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? "Uploading" : "Upload lesson"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
