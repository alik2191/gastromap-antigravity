-- ============================================================================
-- REGIONS
-- Created: 2026-01-20
-- Description: Region status tracking
-- ============================================================================

-- Drop existing table if any
DROP TABLE IF EXISTS public.region_statuses CASCADE;

-- ============================================================================
-- Table: region_statuses
-- ============================================================================
CREATE TABLE public.region_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    region_name TEXT UNIQUE NOT NULL,
    country TEXT NOT NULL,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'active', 'paused')),
    locations_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_region_statuses_country ON public.region_statuses(country);
CREATE INDEX idx_region_statuses_status ON public.region_statuses(status);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_region_statuses_updated_at
    BEFORE UPDATE ON public.region_statuses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.region_statuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view region statuses"
    ON public.region_statuses FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage region statuses"
    ON public.region_statuses FOR ALL
    USING (public.is_admin());

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Region statuses table created successfully';
END $$;
