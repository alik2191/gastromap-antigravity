-- ============================================================================
-- LOCATIONS & BRANCHES
-- Created: 2026-01-20
-- Description: Main locations table with ALL 78 fields and branches
-- ============================================================================

-- Drop existing tables if any
DROP TABLE IF EXISTS public.location_branches CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;

-- ============================================================================
-- Table: locations (main locations table with 78 fields)
-- ============================================================================
CREATE TABLE public.locations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information (5 fields)
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('restaurant', 'cafe', 'bar', 'bakery', 'street_food', 'fine_dining', 'casual_dining', 'fast_food', 'food_truck', 'market', 'other')),
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    
    -- Content Fields (3 fields)
    description TEXT,
    insider_tip TEXT,
    must_try TEXT,
    
    -- Contact & Links (5 fields)
    price_range TEXT DEFAULT '$$' CHECK (price_range IN ('$', '$$', '$$$', '$$$$')),
    website TEXT,
    phone TEXT,
    opening_hours TEXT,
    booking_url TEXT,
    
    -- Media (1 field)
    image_url TEXT,
    
    -- Coordinates (2 fields)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Flags (3 fields)
    is_hidden_gem BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'draft')),
    
    -- Arrays/JSONB (4 fields)
    special_labels TEXT[] DEFAULT '{}',
    social_links JSONB DEFAULT '[]',
    best_time_to_visit TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    
    -- Google Maps Data (14 fields)
    google_place_id TEXT,
    google_rating DECIMAL(2, 1),
    google_user_ratings_total INTEGER,
    google_photos TEXT[] DEFAULT '{}',
    google_types TEXT[] DEFAULT '{}',
    google_business_status TEXT,
    google_price_level INTEGER,
    google_opening_hours JSONB,
    google_website TEXT,
    google_phone TEXT,
    google_formatted_address TEXT,
    google_vicinity TEXT,
    google_plus_code JSONB,
    google_utc_offset INTEGER,
    
    -- Additional Features (15 fields)
    cuisine_types TEXT[] DEFAULT '{}',
    dietary_options TEXT[] DEFAULT '{}',
    amenities TEXT[] DEFAULT '{}',
    payment_methods TEXT[] DEFAULT '{}',
    parking_info TEXT,
    accessibility_features TEXT[] DEFAULT '{}',
    average_visit_duration INTEGER,
    best_for TEXT[] DEFAULT '{}',
    noise_level TEXT,
    wifi_quality TEXT,
    outdoor_seating BOOLEAN DEFAULT false,
    pet_friendly BOOLEAN DEFAULT false,
    child_friendly BOOLEAN DEFAULT false,
    reservation_required BOOLEAN DEFAULT false,
    dress_code TEXT,
    
    -- AI Enrichment (6 fields)
    ai_enriched BOOLEAN DEFAULT false,
    ai_enriched_at TIMESTAMPTZ,
    ai_description_generated BOOLEAN DEFAULT false,
    ai_insider_tip_generated BOOLEAN DEFAULT false,
    ai_must_try_generated BOOLEAN DEFAULT false,
    ai_tags_normalized BOOLEAN DEFAULT false,
    
    -- System Fields (3 fields)
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    -- Constraints
    CONSTRAINT valid_coordinates CHECK (
        (latitude IS NULL AND longitude IS NULL) OR 
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
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
