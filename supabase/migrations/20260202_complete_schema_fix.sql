-- ============================================================================
-- COMPREHENSIVE DATABASE SCHEMA FIX
-- Date: 2026-02-02
-- Description: Complete cleanup and fix of all RLS policies and functions
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix is_admin() function (remove custom_role reference)
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

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

-- ============================================================================
-- STEP 2: Drop remaining policies that weren't removed by CASCADE
-- ============================================================================
-- CASCADE only removed policies that depended on is_admin()
-- We need to manually drop policies that don't use is_admin()

-- Profiles - policies without is_admin()
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can only view their own profile" ON public.profiles;

-- System Logs
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.system_logs;

-- AI Agents
DROP POLICY IF EXISTS "Authenticated users can read active agents" ON public.ai_agents;

-- Locations
DROP POLICY IF EXISTS "Public can view active locations" ON public.locations;

-- Reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can view all reviews" ON public.reviews;

-- Feedback
DROP POLICY IF EXISTS "Users can create feedback" ON public.feedback;

-- Subscriptions
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;

-- Saved Locations
DROP POLICY IF EXISTS "Users can manage own saved locations" ON public.saved_locations;

-- Chat Sessions
DROP POLICY IF EXISTS "Users can manage own sessions" ON public.chat_sessions;

-- Chat Messages
DROP POLICY IF EXISTS "Users can manage own messages" ON public.chat_messages;

-- ============================================================================
-- STEP 3: Create clean, consistent RLS policies
-- ============================================================================

-- PROFILES TABLE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- SYSTEM_LOGS TABLE
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Anyone can insert logs"
  ON public.system_logs FOR INSERT
  TO public
  WITH CHECK (true);

-- AI_AGENTS TABLE
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_agents"
  ON public.ai_agents FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Authenticated users can read active agents"
  ON public.ai_agents FOR SELECT
  TO authenticated
  USING (is_active = true);

-- LOCATIONS TABLE
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public can view active locations"
  ON public.locations FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Creators can manage own locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (created_by = auth.uid()::text);

-- REVIEWS TABLE
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Public can view reviews"
  ON public.reviews FOR SELECT
  TO public
  USING (true);

-- FEEDBACK TABLE
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all feedback"
  ON public.feedback FOR ALL
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can create feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- SUBSCRIPTIONS TABLE
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- MODERATION_ROUNDS TABLE
ALTER TABLE public.moderation_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage moderation rounds"
  ON public.moderation_rounds FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ============================================================================
-- STEP 4: Add performance indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_locations_status ON public.locations(status);
CREATE INDEX IF NOT EXISTS idx_locations_created_by ON public.locations(created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);

-- ============================================================================
-- STEP 5: Refresh Supabase schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
