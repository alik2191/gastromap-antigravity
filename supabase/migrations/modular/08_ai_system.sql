-- ============================================================================
-- AI SYSTEM
-- Created: 2026-01-20
-- Description: AI agents, chat sessions, and messages
-- ============================================================================

-- Drop existing tables if any
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.ai_agents CASCADE;

-- ============================================================================
-- Table: ai_agents
-- ============================================================================
CREATE TABLE public.ai_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('helper', 'guide', 'admin', 'system')),
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    model_config JSONB DEFAULT '{"temperature": 0.7, "model": "gemini-pro"}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: chat_sessions
-- ============================================================================
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    agent_key TEXT REFERENCES public.ai_agents(key) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: chat_messages
-- ============================================================================
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_ai_agents_key ON public.ai_agents(key);
CREATE INDEX idx_ai_agents_role ON public.ai_agents(role);
CREATE INDEX idx_ai_agents_is_active ON public.ai_agents(is_active);
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent_key ON public.chat_sessions(agent_key);
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- AI agents policies
CREATE POLICY "Authenticated users can read active agents"
    ON public.ai_agents FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins can manage ai_agents"
    ON public.ai_agents FOR ALL
    USING (public.is_admin());

-- Chat sessions policies
CREATE POLICY "Users can manage own sessions"
    ON public.chat_sessions FOR ALL
    USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Users can manage own messages"
    ON public.chat_messages FOR ALL
    USING (
        session_id IN (
            SELECT id FROM public.chat_sessions WHERE user_id = auth.uid()
        )
    );

-- ============================================================================
-- Seed AI Agents
-- ============================================================================
INSERT INTO public.ai_agents (key, role, name, description, system_prompt, variables, model_config)
VALUES 
    (
        'location_smart_fill',
        'system',
        'Smart Location Filler',
        'Analyzes Google Maps reviews to generate location content',
        'You are a gastronomic expert. Analyze the provided reviews and generate engaging content for a location in a gastronomy guide. Focus on: 1) A concise description highlighting unique features, 2) Insider tips from reviews (best times, hidden menu items, etc.), 3) Must-try dishes or drinks, 4) Best time to visit. Return valid JSON with fields: description, insider_tip, must_try, type, best_time_to_visit (array).',
        '[{"name": "reviews", "description": "Array of Google Maps reviews"}]'::jsonb,
        '{"temperature": 0.6, "model": "gemini-pro"}'::jsonb
    ),
    (
        'content_generator',
        'helper',
        'Content Generator',
        'Generates or improves location content fields',
        'You are an expert copywriter for a gastronomy guide. Generate engaging, concise content that makes readers want to visit the location. Maintain a friendly, informative tone. Focus on unique features and atmosphere.',
        '[{"name": "field", "description": "Field to generate"}, {"name": "location_info", "description": "Location details"}]'::jsonb,
        '{"temperature": 0.7, "model": "gemini-pro"}'::jsonb
    ),
    (
        'translator',
        'system',
        'Content Translator',
        'Translates location content to English with friendly tone',
        'Translate the location data to English with a FRIENDLY, CASUAL tone. Avoid overly formal language. Make it sound natural and inviting, as if recommending to a friend. Preserve all factual information.',
        '[{"name": "text", "description": "Text to translate"}]'::jsonb,
        '{"temperature": 0.3, "model": "gemini-pro"}'::jsonb
    )
ON CONFLICT (key) DO NOTHING;

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ AI System tables created successfully';
    RAISE NOTICE '📊 Created: ai_agents, chat_sessions, chat_messages';
    RAISE NOTICE '🤖 Seeded 3 AI agents';
END $$;
