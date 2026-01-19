-- Migration: Fix Admin RLS Permissions
-- Date: 2026-02-02
-- Description: Ensures users with role='admin' have access to all necessary tables for the Admin Dashboard and AI Tab.

-- Helper function to check for admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.app_metadata', true)::json->>'role', '') = 'admin' OR
    coalesce(current_setting('request.jwt.claim.user_metadata', true)::json->>'role', '') = 'admin' OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' OR
    (SELECT custom_role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. AI Agents Permissions
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all ai agents" ON public.ai_agents;
CREATE POLICY "Admins can view all ai agents"
  ON public.ai_agents FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update ai agents" ON public.ai_agents;
CREATE POLICY "Admins can update ai agents"
  ON public.ai_agents FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- 2. Moderation Rounds Permissions
ALTER TABLE public.moderation_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all moderation rounds" ON public.moderation_rounds;
CREATE POLICY "Admins can view all moderation rounds"
  ON public.moderation_rounds FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update moderation rounds" ON public.moderation_rounds;
CREATE POLICY "Admins can update moderation rounds"
  ON public.moderation_rounds FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- 3. System Logs Permissions
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view system logs" ON public.system_logs;
CREATE POLICY "Admins can view system logs"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 4. Locations Permissions (Enhance existing)
DROP POLICY IF EXISTS "Admins can do everything with locations" ON public.locations;
CREATE POLICY "Admins can do everything with locations"
  ON public.locations FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 5. Reviews Permissions
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
CREATE POLICY "Admins can view all reviews"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 6. Feedback Permissions
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- 7. Subscriptions Permissions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Force refresh schema cache in Supabase Dashboard (optional hint)
NOTIFY pgrst, 'reload schema';
