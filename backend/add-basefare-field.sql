-- Min Rate (base fare) for driver packages: the fare for the included min hours,
-- e.g. "MINI 4 HOUR 450" -> baseFare 450. Safe to re-run.
ALTER TABLE "subscription_plans"
  ADD COLUMN IF NOT EXISTS "baseFare" DOUBLE PRECISION DEFAULT 0;
