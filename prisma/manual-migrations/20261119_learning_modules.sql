-- Learning modules: video courses, lessons, progress and badges (applied 2026-11-19).
-- Generated with: prisma migrate diff --from-schema <previous> --to-schema prisma/schema.prisma --script

-- CreateTable
CREATE TABLE "learning_modules" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "level" "DifficultyLevel" NOT NULL DEFAULT 'easy',
    "cover_url" TEXT,
    "badge_name" TEXT NOT NULL,
    "status" "CourseStatus" NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_lessons" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "video_url" TEXT NOT NULL,
    "video_public_id" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "duration_sec" INTEGER NOT NULL DEFAULT 0,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_progress" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lesson_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "watched_sec" INTEGER NOT NULL DEFAULT 0,
    "last_position_sec" INTEGER NOT NULL DEFAULT 0,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module_badges" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "module_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "credential_id" TEXT NOT NULL,
    "earned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "module_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_modules_status_idx" ON "learning_modules"("status");

-- CreateIndex
CREATE INDEX "learning_modules_created_by_idx" ON "learning_modules"("created_by");

-- CreateIndex
CREATE INDEX "module_lessons_module_id_position_idx" ON "module_lessons"("module_id", "position");

-- CreateIndex
CREATE INDEX "lesson_progress_student_id_idx" ON "lesson_progress"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_progress_lesson_id_student_id_key" ON "lesson_progress"("lesson_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_badges_credential_id_key" ON "module_badges"("credential_id");

-- CreateIndex
CREATE INDEX "module_badges_student_id_idx" ON "module_badges"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "module_badges_module_id_student_id_key" ON "module_badges"("module_id", "student_id");

-- AddForeignKey
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_lessons" ADD CONSTRAINT "module_lessons_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "module_lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_progress" ADD CONSTRAINT "lesson_progress_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_badges" ADD CONSTRAINT "module_badges_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "learning_modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module_badges" ADD CONSTRAINT "module_badges_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Block direct access through Supabase's REST API (anon key). The app uses Prisma, which bypasses RLS.
ALTER TABLE "learning_modules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "module_badges" ENABLE ROW LEVEL SECURITY;
