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

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.app_metadata', true)::json->>'role', '') = 'admin' OR
    coalesce(current_setting('request.jwt.claim.user_metadata', true)::json->>'role', '') = 'admin' OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Core functions created successfully';
END $$;
