-- ============================================================================
-- SYSTEM LOGS
-- Created: 2026-01-20
-- Description: System-wide logging for errors, warnings, and info
-- ============================================================================

-- Drop existing table if any
DROP TABLE IF EXISTS public.system_logs CASCADE;

-- ============================================================================
-- Table: system_logs
-- ============================================================================
CREATE TABLE public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_component ON public.system_logs(component);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system logs"
    ON public.system_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Anyone can insert logs"
    ON public.system_logs FOR INSERT
    WITH CHECK (true);

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ System Logs table created successfully';
END $$;
