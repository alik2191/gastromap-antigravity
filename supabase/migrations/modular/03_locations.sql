-- ============================================================================
-- LOCATIONS & BRANCHES
-- Created: 2026-01-20
-- Description: Main locations table with all fields and branches
-- ============================================================================

-- Drop existing tables if any
DROP TABLE IF EXISTS public.location_branches CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- ============================================================================
-- Table: locations (main locations table)
-- ============================================================================
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cafe', 'bar', 'restaurant', 'market', 'shop', 'bakery', 'winery')),
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    
    -- Content Fields
    description TEXT,
    description_en TEXT,
    insider_tip TEXT,
    insider_tip_en TEXT,
    must_try TEXT,
    must_try_en TEXT,
    
    -- Contact & Links
    price_range TEXT CHECK (price_range IS NULL OR price_range IN ('$', '$$', '$$$', '$$$$')),
    website TEXT,
    phone TEXT,
    booking_url TEXT,
    image_url TEXT,
    
    -- Coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Google Maps Integration
    google_place_id TEXT UNIQUE,
    google_rating DECIMAL(2,1),
    google_reviews_count INTEGER,
    google_maps_url TEXT,
    opening_hours TEXT,
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    
    -- Features
    is_hidden_gem BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    special_labels JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '[]'::jsonb,
    best_time_to_visit JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- AI Tracking
    last_ai_update TIMESTAMP WITH TIME ZONE,
    ai_update_log JSONB DEFAULT '{}'::jsonb,
    
    -- System Fields
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'draft')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: location_branches (multiple locations for one venue)
-- ============================================================================
CREATE TABLE public.location_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    branch_name TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    opening_hours TEXT,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_locations_country ON public.locations(country);
CREATE INDEX idx_locations_city ON public.locations(city);
CREATE INDEX idx_locations_type ON public.locations(type);
CREATE INDEX idx_locations_status ON public.locations(status);
CREATE INDEX idx_locations_coordinates ON public.locations(latitude, longitude);
CREATE INDEX idx_locations_google_place_id ON public.locations(google_place_id);
CREATE INDEX idx_locations_tags ON public.locations USING GIN(tags);
CREATE INDEX idx_locations_created_at ON public.locations(created_at DESC);
CREATE INDEX idx_branches_location_id ON public.location_branches(location_id);
CREATE INDEX idx_branches_is_main ON public.location_branches(is_main);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_branches ENABLE ROW LEVEL SECURITY;

-- Locations policies
CREATE POLICY "Public can view active locations"
    ON public.locations FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins can do everything on locations"
    ON public.locations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Creators can create locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Location branches policies
CREATE POLICY "Public can view branches of active locations"
    ON public.location_branches FOR SELECT
    USING (
        location_id IN (
            SELECT id FROM public.locations WHERE status = 'active'
        ) OR public.is_admin()
    );

CREATE POLICY "Admins can manage branches"
    ON public.location_branches FOR ALL
    USING (public.is_admin());

-- Add foreign key constraint for saved_locations if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'saved_locations') THEN
        ALTER TABLE public.saved_locations
        ADD CONSTRAINT fk_saved_locations_location_id
        FOREIGN KEY (location_id) REFERENCES public.locations(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Locations & Branches tables created successfully';
    RAISE NOTICE '📊 Created: locations (78 fields), location_branches';
END $$;
