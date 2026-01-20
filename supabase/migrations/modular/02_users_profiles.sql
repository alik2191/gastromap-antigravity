-- ============================================================================
-- USERS & PROFILES
-- Created: 2026-01-20
-- Description: User profiles, authentication, and wishlist
-- ============================================================================

-- Drop existing tables if any
DROP TABLE IF EXISTS public.saved_locations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

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
-- Table: saved_locations (user wishlist)
-- ============================================================================
CREATE TABLE public.saved_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL, -- Will reference locations table created later
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, location_id)
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_saved_locations_user_id ON public.saved_locations(user_id);
CREATE INDEX idx_saved_locations_location_id ON public.saved_locations(location_id);

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

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

-- Saved locations policies
CREATE POLICY "Users can manage own saved locations"
    ON public.saved_locations FOR ALL
    USING (auth.uid() = user_id);

-- Completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Users & Profiles tables created successfully';
    RAISE NOTICE '📊 Created: profiles, saved_locations';
END $$;
