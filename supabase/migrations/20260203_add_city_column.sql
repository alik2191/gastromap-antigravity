-- Migration: Add missing city column to locations table
-- Created: 2026-01-20
-- Description: Adds the city column which is required for location imports

-- Add city column if it doesn't exist
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS city TEXT;

-- Add index for city for faster filtering
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);

-- Add comment to document the purpose
COMMENT ON COLUMN locations.city IS 'City where the location is situated';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
