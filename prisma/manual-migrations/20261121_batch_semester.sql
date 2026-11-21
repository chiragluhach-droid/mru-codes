-- Batch (admission year, e.g. 2K26) and semester for students, and matching
-- targeting on assignments and discussions (applied 2026-11-21).
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "batch" TEXT,
  ADD COLUMN IF NOT EXISTS "semester" INTEGER;
ALTER TABLE "assignments" ADD COLUMN IF NOT EXISTS "target_batch" TEXT,
  ADD COLUMN IF NOT EXISTS "target_semester" INTEGER;
ALTER TABLE "discussion_threads" ADD COLUMN IF NOT EXISTS "target_batch" TEXT,
  ADD COLUMN IF NOT EXISTS "target_semester" INTEGER;
CREATE INDEX IF NOT EXISTS "profiles_batch_idx" ON "profiles"("batch");

-- Backfill existing students' batch from their university email (name_25@mru.ac.in)
-- or, failing that, their roll number (2K25...). The two never disagreed.
UPDATE "profiles"
SET "batch" = '2K' || COALESCE(
  substring(lower("email") from '(\d\d)@mru\.ac\.in$'),
  substring(upper(replace(coalesce("roll_number", ''), ' ', '')) from '^2K(\d\d)')
)
WHERE "role" = 'student' AND "batch" IS NULL
  AND COALESCE(
    substring(lower("email") from '(\d\d)@mru\.ac\.in$'),
    substring(upper(replace(coalesce("roll_number", ''), ' ', '')) from '^2K(\d\d)')
  ) IS NOT NULL;

-- Everything assigned before the 2K26 batch could sign up (11 Nov 2026) was for 2K25.
UPDATE "assignments" SET "target_batch" = '2K25'
WHERE "target_batch" IS NULL AND "created_at" < '2026-11-11';
UPDATE "discussion_threads" SET "target_batch" = '2K25'
WHERE "target_batch" IS NULL AND "created_at" < '2026-11-11';

-- Current semester follows from the batch in the Nov 2026 (odd) term.
UPDATE "profiles" SET "semester" = CASE "batch"
  WHEN '2K26' THEN 1 WHEN '2K25' THEN 3 WHEN '2K24' THEN 5 WHEN '2K23' THEN 7 END
WHERE "role" = 'student' AND "semester" IS NULL AND "batch" IN ('2K26', '2K25', '2K24', '2K23');
