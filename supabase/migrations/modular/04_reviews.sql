-- ============================================================================
-- REVIEWS
-- Created: 2026-01-20
-- Description: User reviews for locations
-- ============================================================================

-- Drop existing table if any
DROP TABLE IF EXISTS public.reviews CASCADE;

-- ============================================================================
-- Table: reviews
-- ============================================================================
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    images JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_reviews_location_id ON public.reviews(location_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view approved reviews"
    ON public.reviews FOR SELECT
    USING (status = 'approved' OR public.is_admin() OR auth.uid() = user_id);

CREATE POLICY "Users can create reviews"
    ON public.reviews FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON public.reviews FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
    ON public.reviews FOR ALL
    USING (public.is_admin());

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Reviews table created successfully';
END $$;
