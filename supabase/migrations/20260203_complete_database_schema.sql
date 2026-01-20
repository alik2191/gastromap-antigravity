-- ============================================================================
-- GASTROMAP COMPLETE DATABASE SCHEMA
-- Created: 2026-01-20
-- Description: Full database schema recreation from scratch
-- WARNING: This will DROP ALL existing tables and data!
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop existing tables (in correct order due to foreign keys)
-- ============================================================================

DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.chat_sessions CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.saved_locations CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.location_branches CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.region_statuses CASCADE;
DROP TABLE IF EXISTS public.locations CASCADE;
DROP TABLE IF EXISTS public.ai_agents CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- STEP 2: Create helper functions
-- ============================================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
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
-- STEP 3: Create main tables
-- ============================================================================

-- ============================================================================
-- Table: profiles (user profiles)
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'creator', 'admin')),
    points INTEGER DEFAULT 0,
    bio TEXT,
    notification_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: locations (main locations table)
-- ============================================================================
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('cafe', 'bar', 'restaurant', 'market', 'shop', 'bakery', 'winery')),
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    address TEXT,
    
    -- Content Fields
    description TEXT,
    description_en TEXT,
    insider_tip TEXT,
    insider_tip_en TEXT,
    must_try TEXT,
    must_try_en TEXT,
    
    -- Contact & Links
    price_range TEXT CHECK (price_range IS NULL OR price_range IN ('$', '$$', '$$$', '$$$$')),
    website TEXT,
    phone TEXT,
    booking_url TEXT,
    image_url TEXT,
    
    -- Coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Google Maps Integration
    google_place_id TEXT UNIQUE,
    google_rating DECIMAL(2,1),
    google_reviews_count INTEGER,
    google_maps_url TEXT,
    opening_hours TEXT,
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    
    -- Features
    is_hidden_gem BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    special_labels JSONB DEFAULT '[]'::jsonb,
    social_links JSONB DEFAULT '[]'::jsonb,
    best_time_to_visit JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    
    -- AI Tracking
    last_ai_update TIMESTAMP WITH TIME ZONE,
    ai_update_log JSONB DEFAULT '{}'::jsonb,
    
    -- System Fields
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'draft')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Table: location_branches (multiple locations for one venue)
-- ============================================================================
CREATE TABLE public.location_branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    branch_name TEXT,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone TEXT,
    opening_hours TEXT,
    is_main BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- Table: saved_locations (user wishlist)
-- ============================================================================
CREATE TABLE public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, location_id)
);

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
-- STEP 4: Create indexes for performance
-- ============================================================================

-- Profiles indexes
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Locations indexes
CREATE INDEX idx_locations_country ON public.locations(country);
CREATE INDEX idx_locations_city ON public.locations(city);
CREATE INDEX idx_locations_type ON public.locations(type);
CREATE INDEX idx_locations_status ON public.locations(status);
CREATE INDEX idx_locations_coordinates ON public.locations(latitude, longitude);
CREATE INDEX idx_locations_google_place_id ON public.locations(google_place_id);
CREATE INDEX idx_locations_tags ON public.locations USING GIN(tags);
CREATE INDEX idx_locations_created_at ON public.locations(created_at DESC);

-- Location branches indexes
CREATE INDEX idx_branches_location_id ON public.location_branches(location_id);
CREATE INDEX idx_branches_is_main ON public.location_branches(is_main);

-- Reviews indexes
CREATE INDEX idx_reviews_location_id ON public.reviews(location_id);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_reviews_status ON public.reviews(status);
CREATE INDEX idx_reviews_created_at ON public.reviews(created_at DESC);

-- Subscriptions indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_end_date ON public.subscriptions(end_date);

-- Feedback indexes
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_created_at ON public.feedback(created_at DESC);

-- Saved locations indexes
CREATE INDEX idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX idx_saved_locations_location_id ON public.saved_locations(location_id);

-- AI agents indexes
CREATE INDEX idx_ai_agents_key ON public.ai_agents(key);
CREATE INDEX idx_ai_agents_role ON public.ai_agents(role);
CREATE INDEX idx_ai_agents_is_active ON public.ai_agents(is_active);

-- Chat sessions indexes
CREATE INDEX idx_chat_sessions_user_id ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_agent_key ON public.chat_sessions(agent_key);

-- Chat messages indexes
CREATE INDEX idx_chat_messages_session_id ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at DESC);

-- System logs indexes
CREATE INDEX idx_system_logs_level ON public.system_logs(level);
CREATE INDEX idx_system_logs_component ON public.system_logs(component);
CREATE INDEX idx_system_logs_created_at ON public.system_logs(created_at DESC);

-- ============================================================================
-- STEP 5: Create triggers for updated_at
-- ============================================================================

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
    BEFORE UPDATE ON public.feedback
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_region_statuses_updated_at
    BEFORE UPDATE ON public.region_statuses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_agents_updated_at
    BEFORE UPDATE ON public.ai_agents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at
    BEFORE UPDATE ON public.chat_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 6: Enable Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.region_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: Create RLS Policies
-- ============================================================================

-- Profiles policies
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can do everything on profiles"
    ON public.profiles FOR ALL
    USING (public.is_admin());

-- Locations policies
CREATE POLICY "Public can view active locations"
    ON public.locations FOR SELECT
    USING (status = 'active' OR public.is_admin());

CREATE POLICY "Admins can do everything on locations"
    ON public.locations FOR ALL
    USING (public.is_admin());

CREATE POLICY "Creators can create locations"
    ON public.locations FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Location branches policies
CREATE POLICY "Public can view branches of active locations"
    ON public.location_branches FOR SELECT
    USING (
        location_id IN (
            SELECT id FROM public.locations WHERE status = 'active'
        ) OR public.is_admin()
    );

CREATE POLICY "Admins can manage branches"
    ON public.location_branches FOR ALL
    USING (public.is_admin());

-- Reviews policies
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

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions"
    ON public.subscriptions FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage subscriptions"
    ON public.subscriptions FOR ALL
    USING (public.is_admin());

-- Feedback policies
CREATE POLICY "Users can create feedback"
    ON public.feedback FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own feedback"
    ON public.feedback FOR SELECT
    USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Admins can manage feedback"
    ON public.feedback FOR ALL
    USING (public.is_admin());

-- Saved locations policies
CREATE POLICY "Users can manage own saved locations"
    ON public.saved_locations FOR ALL
    USING (auth.uid() = user_id);

-- Region statuses policies
CREATE POLICY "Public can view region statuses"
    ON public.region_statuses FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage region statuses"
    ON public.region_statuses FOR ALL
    USING (public.is_admin());

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

-- System logs policies
CREATE POLICY "Admins can view system logs"
    ON public.system_logs FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Anyone can insert logs"
    ON public.system_logs FOR INSERT
    WITH CHECK (true);

-- ============================================================================
-- STEP 8: Seed initial data
-- ============================================================================

-- Seed AI agents
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

-- ============================================================================
-- STEP 9: Refresh PostgREST schema cache
-- ============================================================================

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ GastroMap database schema created successfully!';
    RAISE NOTICE '📊 Created 12 tables with full indexes, constraints, and RLS policies';
    RAISE NOTICE '🔄 Please wait 10-15 seconds for PostgREST to reload the schema cache';
    RAISE NOTICE '🚀 You can now use the Admin panel to import locations!';
END $$;
