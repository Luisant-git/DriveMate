-- Move all packages previously assigned to 'GENERAL' or unassigned into their proper categories:
-- Diamond, Platinum, Gold, Silver, Monthly

UPDATE "subscription_plans"
SET "category" = 'Diamond'
WHERE ("category" IS NULL OR "category" = '' OR "category" ILIKE 'general' OR "category" ILIKE 'all')
  AND (
    "name" ILIKE '%Diamond%' OR "description" ILIKE '%Diamond%'
    OR "name" ILIKE '%New - 72%' OR "name" ILIKE '%New - 84%' OR "name" ILIKE '%New - 96%'
    OR "name" ILIKE '%New - 9%' OR "name" ILIKE '%New - 11%' OR "name" ILIKE '%New - 23%'
  );

UPDATE "subscription_plans"
SET "category" = 'Platinum'
WHERE ("category" IS NULL OR "category" = '' OR "category" ILIKE 'general' OR "category" ILIKE 'all')
  AND (
    "name" ILIKE '%Platinum%' OR "description" ILIKE '%Platinum%'
    OR "name" ILIKE '%Old - 36%' OR "name" ILIKE '%Old - 52%' OR "name" ILIKE '%Old - 63%'
    OR "name" ILIKE '%Old - 5%' OR "name" ILIKE '%Old - 7%' OR "name" ILIKE '%Old - 17%' OR "name" ILIKE '%Old - 18%'
  );

UPDATE "subscription_plans"
SET "category" = 'Gold'
WHERE ("category" IS NULL OR "category" = '' OR "category" ILIKE 'general' OR "category" ILIKE 'all')
  AND (
    "name" ILIKE '%Gold%' OR "description" ILIKE '%Gold%'
  );

UPDATE "subscription_plans"
SET "category" = 'Silver'
WHERE ("category" IS NULL OR "category" = '' OR "category" ILIKE 'general' OR "category" ILIKE 'all')
  AND (
    "name" ILIKE '%Silver%' OR "description" ILIKE '%Silver%' OR "name" ILIKE '%Spare Driver%'
  );

UPDATE "subscription_plans"
SET "category" = 'Monthly'
WHERE ("category" IS NULL OR "category" = '' OR "category" ILIKE 'general' OR "category" ILIKE 'all')
  AND (
    "name" ILIKE '%Monthly%' OR "type" = 'MONTHLY'
  );
