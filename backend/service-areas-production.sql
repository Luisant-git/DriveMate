-- ============================================================
-- DriveMate Service Areas Production Seed Script
-- Table: service_areas
-- Operating Radius: 40 km per city
-- ============================================================

-- Create / Update the 11 Active Service Areas
INSERT INTO "service_areas" ("id", "name", "city", "state", "radius", "latitude", "longitude", "isActive", "createdAt", "updatedAt")
VALUES
  ('sa_delhi', 'Delhi', 'Delhi', 'Delhi', 40, 28.6139, 77.2090, true, NOW(), NOW()),
  ('sa_mumbai', 'Mumbai', 'Mumbai', 'Maharashtra', 40, 19.0760, 72.8777, true, NOW(), NOW()),
  ('sa_kolkata', 'Kolkata', 'Kolkata', 'West Bengal', 40, 22.5726, 88.3639, true, NOW(), NOW()),
  ('sa_bengaluru', 'Bengaluru', 'Bengaluru', 'Karnataka', 40, 12.9716, 77.5946, true, NOW(), NOW()),
  ('sa_chennai', 'Chennai', 'Chennai', 'Tamil Nadu', 40, 13.0827, 80.2707, true, NOW(), NOW()),
  ('sa_hyderabad', 'Hyderabad', 'Hyderabad', 'Telangana', 40, 17.3850, 78.4867, true, NOW(), NOW()),
  ('sa_vijayawada', 'Vijayawada', 'Vijayawada', 'Andhra Pradesh', 40, 16.5062, 80.6480, true, NOW(), NOW()),
  ('sa_ahmedabad', 'Ahmedabad', 'Ahmedabad', 'Gujarat', 40, 23.0225, 72.5714, true, NOW(), NOW()),
  ('sa_surat', 'Surat', 'Surat', 'Gujarat', 40, 21.1702, 72.8311, true, NOW(), NOW()),
  ('sa_pune', 'Pune', 'Pune', 'Maharashtra', 40, 18.5204, 73.8567, true, NOW(), NOW()),
  ('sa_jaipur', 'Jaipur', 'Jaipur', 'Rajasthan', 40, 26.9124, 75.7873, true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "city" = EXCLUDED."city",
  "state" = EXCLUDED."state",
  "radius" = EXCLUDED."radius",
  "latitude" = EXCLUDED."latitude",
  "longitude" = EXCLUDED."longitude",
  "isActive" = EXCLUDED."isActive",
  "updatedAt" = NOW();

-- Verify inserted active areas
SELECT "city", "state", "radius", "latitude", "longitude", "isActive" 
FROM "service_areas" 
ORDER BY "city" ASC;

