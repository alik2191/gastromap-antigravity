-- ==========================================
-- FINAL CONFIGURATION SCRIPT (Storage + Analytics + Permissions)
-- ==========================================

-- PART 1: SETUP STORAGE (PHOTOS)
-- 1. Create the 'uploads' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Policies for Storage
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'uploads' );

DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Auth Manage" ON storage.objects;
CREATE POLICY "Auth Manage" ON storage.objects FOR ALL USING ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );


-- PART 2: SETUP ANALYTICS (LOCATION VIEWS)
CREATE TABLE IF NOT EXISTS public.location_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    user_email TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.location_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for all users" ON public.location_views;
CREATE POLICY "Enable insert for all users" ON public.location_views FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read for admins and creators" ON public.location_views;
CREATE POLICY "Enable read for admins and creators" ON public.location_views
    FOR SELECT USING (
        (auth.jwt() ->> 'email') IN (
            SELECT created_by FROM locations WHERE id = location_views.location_id
        )
        OR
        public.is_admin()
    );


-- PART 3: PROFILES (FIX AVATAR SAVING)
-- Add missing columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{}'::jsonb;

-- CRITICAL: Allow users to update their own profile (fix for avatar not saving)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);


-- PART 4: LOCATIONS (FIX CREATOR TOOLS)
-- Allow creators to insert new locations
DROP POLICY IF EXISTS "Authenticated users can insert locations" ON public.locations;
CREATE POLICY "Authenticated users can insert locations" ON public.locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow creators to update their own locations (add photos, change text)
DROP POLICY IF EXISTS "Creators can update own locations" ON public.locations;
CREATE POLICY "Creators can update own locations" ON public.locations
    FOR UPDATE USING (
        (auth.jwt() ->> 'email') = created_by
        OR
        public.is_admin()
    );
