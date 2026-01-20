-- Query to check actual column names in all tables
-- Run this in Supabase SQL Editor to see the real schema

-- Check profiles table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check locations table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'locations'
ORDER BY ordinal_position;

-- Check system_logs table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'system_logs'
ORDER BY ordinal_position;

-- Check reviews table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'reviews'
ORDER BY ordinal_position;

-- Check feedback table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'feedback'
ORDER BY ordinal_position;

-- Check subscriptions table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'subscriptions'
ORDER BY ordinal_position;
