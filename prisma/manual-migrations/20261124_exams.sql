-- Exams: timed MCQ + programming exams (applied 2026-11-24).
-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('draft', 'published', 'closed');

-- CreateEnum
CREATE TYPE "ExamQuestionType" AS ENUM ('mcq', 'programming');

-- CreateEnum
CREATE TYPE "ExamAttemptStatus" AS ENUM ('in_progress', 'submitted');

-- CreateTable
CREATE TABLE "exams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "starts_at" TIMESTAMPTZ NOT NULL,
    "ends_at" TIMESTAMPTZ NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'draft',
    "show_results" BOOLEAN NOT NULL DEFAULT true,
    "target_department" TEXT,
    "target_batch" TEXT,
    "target_section" TEXT,
    "target_semester" INTEGER,
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exam_id" UUID NOT NULL,
    "type" "ExamQuestionType" NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "options" JSONB,
    "correct_option_ids" JSONB,
    "languages" JSONB,
    "starter_code" JSONB,
    "time_limit_ms" INTEGER NOT NULL DEFAULT 2000,
    "memory_limit_mb" INTEGER NOT NULL DEFAULT 128,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_test_cases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "input" TEXT NOT NULL,
    "expected_output" TEXT NOT NULL,
    "is_sample" BOOLEAN NOT NULL DEFAULT false,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_test_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exam_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "status" "ExamAttemptStatus" NOT NULL DEFAULT 'in_progress',
    "started_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deadline" TIMESTAMPTZ NOT NULL,
    "submitted_at" TIMESTAMPTZ,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tab_switches" INTEGER NOT NULL DEFAULT 0,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "auto_submitted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "attempt_id" UUID NOT NULL,
    "question_id" UUID NOT NULL,
    "selected_option_ids" JSONB,
    "code" TEXT,
    "language" TEXT,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "test_results" JSONB,
    "graded_code" TEXT,
    "graded_language" TEXT,
    "graded_at" TIMESTAMPTZ,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exams_status_idx" ON "exams"("status");

-- CreateIndex
CREATE INDEX "exams_created_by_idx" ON "exams"("created_by");

-- CreateIndex
CREATE INDEX "exams_target_department_target_batch_idx" ON "exams"("target_department", "target_batch");

-- CreateIndex
CREATE INDEX "exam_questions_exam_id_position_idx" ON "exam_questions"("exam_id", "position");

-- CreateIndex
CREATE INDEX "exam_test_cases_question_id_position_idx" ON "exam_test_cases"("question_id", "position");

-- CreateIndex
CREATE INDEX "exam_attempts_student_id_idx" ON "exam_attempts"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempts_exam_id_student_id_key" ON "exam_attempts"("exam_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answers_attempt_id_question_id_key" ON "exam_answers"("attempt_id", "question_id");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_test_cases" ADD CONSTRAINT "exam_test_cases_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_attempt_id_fkey" FOREIGN KEY ("attempt_id") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answers" ADD CONSTRAINT "exam_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Block direct PostgREST (anon key) access; the app reads these via Prisma only.
ALTER TABLE "exams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_test_cases" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_attempts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exam_answers" ENABLE ROW LEVEL SECURITY;
