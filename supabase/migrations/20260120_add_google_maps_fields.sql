-- Migration: Add Google Maps enrichment fields to locations table
-- Created: 2026-01-20
-- Description: Adds fields for storing Google Maps API enriched data

-- Add new columns to locations table
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS google_place_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS google_rating DECIMAL(2,1),
ADD COLUMN IF NOT EXISTS google_reviews_count INTEGER,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS opening_hours JSONB,
ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP WITH TIME ZONE;

-- Add index for google_place_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_locations_google_place_id ON locations(google_place_id);

-- Add index for last_enriched_at for cache invalidation queries
CREATE INDEX IF NOT EXISTS idx_locations_last_enriched_at ON locations(last_enriched_at);

-- Add comment to document the purpose of new fields
COMMENT ON COLUMN locations.google_place_id IS 'Unique Google Maps Place ID for this location';
COMMENT ON COLUMN locations.google_rating IS 'Google Maps rating (0.0 to 5.0)';
COMMENT ON COLUMN locations.google_reviews_count IS 'Number of Google Maps reviews';
COMMENT ON COLUMN locations.phone IS 'Phone number from Google Maps';
COMMENT ON COLUMN locations.opening_hours IS 'Opening hours data from Google Maps in JSON format';
COMMENT ON COLUMN locations.last_enriched_at IS 'Timestamp of last Google Maps data enrichment';
