-- ============================================================================
-- SUBSCRIPTIONS
-- Created: 2026-01-20
-- Description: User subscriptions and payment tracking
-- ============================================================================

-- Drop existing table if any
DROP TABLE IF EXISTS public.subscriptions CASCADE;

-- ============================================================================
-- Table: subscriptions
-- ============================================================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount_paid DECIMAL(10, 2),
    payment_method TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);
CREATE INDEX idx_subscriptions_user_email ON public.subscriptions(user_email);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.is_admin());

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Subscriptions table created successfully';
END $$;
