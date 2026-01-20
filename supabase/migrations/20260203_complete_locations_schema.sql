-- ============================================================================
-- COMPLETE LOCATIONS TABLE SCHEMA FIX
-- Date: 2026-01-20
-- Description: Add ALL missing columns required by ImportWizard and LocationForm
-- ============================================================================

-- Add all base columns that are missing
ALTER TABLE locations 
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'cafe',
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price_range TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS is_hidden_gem BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS insider_tip TEXT,
ADD COLUMN IF NOT EXISTS must_try TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_locations_country ON locations(country);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(type);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_coordinates ON locations(latitude, longitude);

-- Add check constraints
ALTER TABLE locations 
DROP CONSTRAINT IF EXISTS locations_type_check,
ADD CONSTRAINT locations_type_check 
CHECK (type IN ('cafe', 'bar', 'restaurant', 'market', 'shop', 'bakery', 'winery'));

ALTER TABLE locations
DROP CONSTRAINT IF EXISTS locations_price_range_check,
ADD CONSTRAINT locations_price_range_check 
CHECK (price_range IS NULL OR price_range IN ('$', '$$', '$$$', '$$$$'));

ALTER TABLE locations
DROP CONSTRAINT IF EXISTS locations_status_check,
ADD CONSTRAINT locations_status_check 
CHECK (status IN ('pending', 'active', 'rejected', 'draft'));

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
