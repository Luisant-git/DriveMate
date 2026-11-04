-- Employee job postings — schema alignment for job_requirements.
-- Safe to run multiple times.

ALTER TABLE job_requirements
  ADD COLUMN IF NOT EXISTS "jobType" TEXT NOT NULL DEFAULT 'Full Time Jobs',
  ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'Other',
  ADD COLUMN IF NOT EXISTS "experienceMin" INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "experienceMax" INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "salaryMin" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "salaryMax" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "showContact" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "remoteWork" TEXT NOT NULL DEFAULT 'No',
  ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "company" TEXT,
  ADD COLUMN IF NOT EXISTS "localities" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ALTER COLUMN "contactName" DROP NOT NULL,
  ALTER COLUMN "contactPhone" SET DEFAULT '';

-- Legacy single-value experience column -> min/max pair
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_requirements' AND column_name = 'experienceYears') THEN
    UPDATE job_requirements SET "experienceMin" = "experienceYears" WHERE COALESCE("experienceMin", 0) = 0;
    ALTER TABLE job_requirements DROP COLUMN IF EXISTS "experienceYears";
  END IF;

  -- Old driver-only rows had no category
  UPDATE job_requirements SET category = 'Other' WHERE category IS NULL;
END $$;
