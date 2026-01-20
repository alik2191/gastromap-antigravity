-- ============================================================================
-- CORE FUNCTIONS & HELPERS
-- Created: 2026-01-20
-- Description: Base functions used by all other migrations
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Core functions created successfully';
END $$;
