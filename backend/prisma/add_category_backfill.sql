-- Add the required category column (nullable-safe for existing rows), backfill
-- categories from existing names, strip legacy "Silver 1/2/3" prefixes, and
-- finally remove the temporary default so the DB matches schema.prisma exactly.
--
-- Run from the backend directory:
--   npx prisma db execute --file ./prisma/add_category_backfill.sql
-- Then:
--   npx prisma db push
--   npx prisma generate

ALTER TABLE "subscription_plans" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'Silver';

UPDATE "subscription_plans"
SET "category" = CASE
  WHEN "name" ILIKE 'Silver%' THEN 'Silver'
  WHEN "name" ILIKE 'Gold%' THEN 'Gold'
  WHEN "name" ILIKE 'Platinum%' THEN 'Platinum'
  WHEN "name" ILIKE 'Diamond%' THEN 'Diamond'
  ELSE 'Silver'
END;

UPDATE "subscription_plans"
SET "name" = regexp_replace("name", '^(Silver|Gold|Platinum|Diamond)\s*\d*\s*', '', 'i');

ALTER TABLE "subscription_plans" ALTER COLUMN "category" DROP DEFAULT;
