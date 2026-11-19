"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Film,
  ImagePlus,
  Loader2,
  Pencil,
  PlayCircle,
  Trash2,
  Users,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AchievementBadge } from "@/components/modules/achievement-badge";
import { LessonUploadDialog } from "@/components/modules/lesson-upload-dialog";
import { ModuleDetailsForm } from "@/components/modules/module-details-form";
import { uploadToCloudinary } from "@/lib/cloudinary-upload";
import {
  badgeTheme,
  formatClock,
  formatDuration,
  levelLabel,
  percent,
  type ModuleDetails,
} from "@/lib/modules";

export interface ManagerModule extends ModuleDetails {
  id: string;
  status: "draft" | "published" | "archived";
  coverUrl: string | null;
}

export interface ManagerLesson {
  id: string;
  title: string;
  description: string | null;
  durationSec: number;
  thumbnailUrl: string | null;
  videoUrl: string;
}

export interface ManagerLearner {
  studentId: string;
  name: string;
  rollNumber: string | null;
  classLabel: string;
  completedLessons: number;
  lastActivity: string;
  badgeEarnedAt: string | null;
}

interface ModuleManagerProps {
  module: ManagerModule;
  lessons: ManagerLesson[];
  learners: ManagerLearner[];
}

async function sendJson(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Something went wrong");
  return result;
}

export function ModuleManager({ module: m, lessons, learners }: ModuleManagerProps) {
  const router = useRouter();
  const [editingDetails, setEditingDetails] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [coverProgress, setCoverProgress] = useState<number | null>(null);
  const [order, setOrder] = useState<string[] | null>(null);
  const [editingLesson, setEditingLesson] = useState<ManagerLesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<ManagerLesson | null>(null);
  const [previewLesson, setPreviewLesson] = useState<ManagerLesson | null>(null);
  const [busyLessonId, setBusyLessonId] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const orderedLessons = order
    ? order.map((id) => lessons.find((l) => l.id === id)).filter((l): l is ManagerLesson => Boolean(l))
    : lessons;
  const totalSec = lessons.reduce((sum, l) => sum + l.durationSec, 0);
  const completions = learners.filter((l) => l.badgeEarnedAt).length;
  const isPublished = m.status === "published";
  const theme = badgeTheme(m.id);

  const refresh = () => {
    setOrder(null);
    router.refresh();
  };

  const saveDetails = async (values: ModuleDetails) => {
    try {
      await sendJson(`/api/modules/${m.id}`, "PATCH", values);
      toast.success("Module updated");
      setEditingDetails(false);
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const toggleStatus = async () => {
    setStatusSaving(true);
    try {
      await sendJson(`/api/modules/${m.id}`, "PATCH", { status: isPublished ? "draft" : "published" });
      toast.success(isPublished ? "Module unpublished. Students can no longer see it." : "Module published to students");
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setStatusSaving(false);
    }
  };

  const deleteModule = async () => {
    setDeleting(true);
    try {
      await sendJson(`/api/modules/${m.id}`, "DELETE");
      toast.success("Module deleted");
      router.push("/teacher/modules");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setDeleting(false);
    }
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Choose a JPG, PNG or WebP image");
    setCoverProgress(0);
    try {
      const asset = await uploadToCloudinary(m.id, "image", file, setCoverProgress).promise;
      await sendJson(`/api/modules/${m.id}`, "PATCH", { coverPublicId: asset.publicId });
      toast.success("Cover updated");
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setCoverProgress(null);
    }
  };

  const removeCover = async () => {
    try {
      await sendJson(`/api/modules/${m.id}`, "PATCH", { coverPublicId: null });
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const moveLesson = async (index: number, direction: -1 | 1) => {
    const ids = orderedLessons.map((l) => l.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setOrder(ids);
    try {
      await sendJson(`/api/modules/${m.id}/lessons`, "PATCH", { order: ids });
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
      setOrder(null);
    }
  };

  const saveLesson = async (lesson: ManagerLesson, title: string, description: string) => {
    setBusyLessonId(lesson.id);
    try {
      await sendJson(`/api/modules/${m.id}/lessons/${lesson.id}`, "PATCH", { title, description });
      toast.success("Lesson updated");
      setEditingLesson(null);
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyLessonId(null);
    }
  };

  const deleteLesson = async (lesson: ManagerLesson) => {
    setBusyLessonId(lesson.id);
    try {
      await sendJson(`/api/modules/${m.id}/lessons/${lesson.id}`, "DELETE");
      toast.success("Lesson removed");
      setDeletingLesson(null);
      refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setBusyLessonId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/teacher/modules"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        All modules
      </Link>

      {/* Header */}
      <Card className="overflow-hidden">
        <div className="grid md:grid-cols-[minmax(0,320px)_1fr]">
          <div
            className="relative aspect-video md:aspect-auto md:min-h-[200px] bg-cover bg-center"
            style={
              m.coverUrl
                ? { backgroundImage: `url(${m.coverUrl})` }
                : { backgroundImage: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }
            }
          >
            {!m.coverUrl && <Film className="absolute inset-0 m-auto h-12 w-12 text-white/80" />}
            <div className="absolute bottom-3 left-3 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => coverInputRef.current?.click()}
                disabled={coverProgress !== null}
              >
                {coverProgress !== null ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <ImagePlus className="h-4 w-4 mr-1.5" />
                )}
                {coverProgress !== null ? `${coverProgress}%` : m.coverUrl ? "Change cover" : "Add cover"}
              </Button>
              {m.coverUrl && coverProgress === null && (
                <Button size="sm" variant="secondary" onClick={removeCover}>
                  Remove
                </Button>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                uploadCover(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </div>

          <div className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    className={
                      isPublished
                        ? "bg-green-600 text-white hover:bg-green-600"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary"
                    }
                  >
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {levelLabel(m.level)}
                    {m.category ? ` · ${m.category}` : ""}
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight">{m.title}</h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingDetails(true)}>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Edit details
                </Button>
                <Button
                  size="sm"
                  variant={isPublished ? "outline" : "default"}
                  onClick={toggleStatus}
                  disabled={statusSaving || (!isPublished && lessons.length === 0)}
                  title={!isPublished && lessons.length === 0 ? "Add a lesson first" : undefined}
                >
                  {statusSaving ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : isPublished ? (
                    <EyeOff className="h-4 w-4 mr-1.5" />
                  ) : (
                    <Eye className="h-4 w-4 mr-1.5" />
                  )}
                  {isPublished ? "Unpublish" : "Publish"}
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete module</span>
                </Button>
              </div>
            </div>

            {m.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-4">{m.description}</p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: PlayCircle, label: "Lessons", value: lessons.length },
                { icon: Clock, label: "Total length", value: formatDuration(totalSec) },
                { icon: Users, label: "Learners", value: learners.length },
                { icon: Award, label: "Badges earned", value: completions },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border bg-muted/30 px-3 py-2">
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <stat.icon className="h-3.5 w-3.5" />
                    {stat.label}
                  </p>
                  <p className="text-lg font-semibold">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {!isPublished && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          This module is a draft, so students can&apos;t see it yet.{" "}
          {lessons.length === 0 ? "Add at least one lesson, then publish it." : "Publish it when you're ready."}
        </div>
      )}

      <Tabs defaultValue="lessons">
        <TabsList>
          <TabsTrigger value="lessons">Lessons ({lessons.length})</TabsTrigger>
          <TabsTrigger value="learners">Learners ({learners.length})</TabsTrigger>
          <TabsTrigger value="badge">Badge</TabsTrigger>
        </TabsList>

        {/* Lessons */}
        <TabsContent value="lessons" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
              <div>
                <CardTitle className="text-lg">Lessons</CardTitle>
                <CardDescription>Students watch these in order. A lesson completes at 90% watched.</CardDescription>
              </div>
              <LessonUploadDialog moduleId={m.id} onCreated={refresh} />
            </CardHeader>
            <CardContent>
              {orderedLessons.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                  <Film className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="font-medium">No lessons yet</p>
                  <p className="text-sm text-muted-foreground">Upload your first video to get started.</p>
                </div>
              ) : (
                <ol className="divide-y rounded-lg border">
                  {orderedLessons.map((lesson, index) => (
                    <li key={lesson.id} className="flex items-center gap-3 p-3">
                      <span className="w-6 shrink-0 text-center text-sm font-medium text-muted-foreground">
                        {index + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewLesson(lesson)}
                        className="relative h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted bg-cover bg-center"
                        style={lesson.thumbnailUrl ? { backgroundImage: `url(${lesson.thumbnailUrl})` } : undefined}
                        aria-label={`Preview ${lesson.title}`}
                      >
                        <PlayCircle className="absolute inset-0 m-auto h-6 w-6 text-white drop-shadow" />
                        <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-white">
                          {formatClock(lesson.durationSec)}
                        </span>
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{lesson.title}</p>
                        {lesson.description && (
                          <p className="truncate text-xs text-muted-foreground">{lesson.description}</p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveLesson(index, -1)}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => moveLesson(index, 1)}
                          disabled={index === orderedLessons.length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingLesson(lesson)}
                          aria-label="Edit lesson"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingLesson(lesson)}
                          aria-label="Delete lesson"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Learners */}
        <TabsContent value="learners" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learner progress</CardTitle>
              <CardDescription>Students who have started this module.</CardDescription>
            </CardHeader>
            <CardContent>
              {learners.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No students have started yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead className="min-w-[160px]">Progress</TableHead>
                        <TableHead>Last active</TableHead>
                        <TableHead>Badge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {learners.map((learner) => {
                        const pct = percent(learner.completedLessons, lessons.length);
                        return (
                          <TableRow key={learner.studentId}>
                            <TableCell>
                              <p className="font-medium">{learner.name}</p>
                              {learner.rollNumber && (
                                <p className="text-xs text-muted-foreground">{learner.rollNumber}</p>
                              )}
                            </TableCell>
                            <TableCell className="text-sm">{learner.classLabel}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={pct} className="h-2" />
                                <span className="w-16 shrink-0 text-xs text-muted-foreground">
                                  {learner.completedLessons}/{lessons.length}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(learner.lastActivity).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {learner.badgeEarnedAt ? (
                                <span className="inline-flex items-center gap-1 text-sm text-green-600 dark:text-green-500">
                                  <CheckCircle2 className="h-4 w-4" />
                                  {new Date(learner.badgeEarnedAt).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-sm text-muted-foreground">In progress</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Badge preview */}
        <TabsContent value="badge" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <AchievementBadge seed={m.id} label={m.badgeName} size={128} />
              <p className="text-lg font-semibold">{m.badgeName}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Awarded automatically when a student completes all {lessons.length} lessons. Each badge gets a
                unique credential ID, ready for certificates later.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit details */}
      <Dialog open={editingDetails} onOpenChange={setEditingDetails}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit module details</DialogTitle>
          </DialogHeader>
          <ModuleDetailsForm
            defaultValues={{
              title: m.title,
              description: m.description ?? "",
              category: m.category ?? "",
              level: m.level,
              badgeName: m.badgeName,
            }}
            submitLabel="Save changes"
            onSubmit={saveDetails}
            onCancel={() => setEditingDetails(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete module */}
      <Dialog open={confirmDelete} onOpenChange={(open) => !deleting && setConfirmDelete(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this module?</DialogTitle>
            <DialogDescription>
              &ldquo;{m.title}&rdquo;, its {lessons.length} video lessons, all student progress and{" "}
              {completions} earned badges will be permanently deleted. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteModule} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit lesson */}
      <LessonEditDialog
        lesson={editingLesson}
        saving={busyLessonId === editingLesson?.id}
        onClose={() => setEditingLesson(null)}
        onSave={saveLesson}
      />

      {/* Delete lesson */}
      <Dialog open={Boolean(deletingLesson)} onOpenChange={(open) => !open && setDeletingLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove this lesson?</DialogTitle>
            <DialogDescription>
              &ldquo;{deletingLesson?.title}&rdquo; and its video will be deleted, along with students&apos;
              progress on it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingLesson(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletingLesson && deleteLesson(deletingLesson)}
              disabled={busyLessonId === deletingLesson?.id}
            >
              {busyLessonId === deletingLesson?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={Boolean(previewLesson)} onOpenChange={(open) => !open && setPreviewLesson(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewLesson?.title}</DialogTitle>
          </DialogHeader>
          {previewLesson && (
            <video
              key={previewLesson.id}
              src={previewLesson.videoUrl}
              poster={previewLesson.thumbnailUrl ?? undefined}
              controls
              autoPlay
              className="aspect-video w-full rounded-md bg-black"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LessonEditDialog({
  lesson,
  saving,
  onClose,
  onSave,
}: {
  lesson: ManagerLesson | null;
  saving: boolean;
  onClose: () => void;
  onSave: (lesson: ManagerLesson, title: string, description: string) => void;
}) {
  return (
    <Dialog open={Boolean(lesson)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {lesson && (
          <LessonEditForm key={lesson.id} lesson={lesson} saving={saving} onClose={onClose} onSave={onSave} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function LessonEditForm({
  lesson,
  saving,
  onClose,
  onSave,
}: {
  lesson: ManagerLesson;
  saving: boolean;
  onClose: () => void;
  onSave: (lesson: ManagerLesson, title: string, description: string) => void;
}) {
  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description ?? "");

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit lesson</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="edit-lesson-title">Title</Label>
          <Input id="edit-lesson-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-lesson-description">Notes for students</Label>
          <Textarea
            id="edit-lesson-description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(lesson, title.trim(), description.trim())} disabled={saving || title.trim().length < 2}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
