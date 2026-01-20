-- ============================================================================
-- FEEDBACK
-- Created: 2026-01-20
-- Description: User feedback and support tickets
-- ============================================================================

-- Drop existing table if any
DROP TABLE IF EXISTS public.feedback CASCADE;

-- ============================================================================
-- Table: feedback
-- ============================================================================
CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'question', 'other')),
    message TEXT NOT NULL,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_type ON public.feedback(type);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage feedback"
    ON public.feedback FOR ALL
    USING (public.is_admin());

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Feedback table created successfully';
END $$;
