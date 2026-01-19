-- Create location_views table for analytics
CREATE TABLE IF NOT EXISTS public.location_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID REFERENCES public.locations(id) ON DELETE CASCADE,
    user_email TEXT, -- Can be 'anonymous' or specific email
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.location_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (track view)
CREATE POLICY "Enable insert for all users" ON public.location_views
    FOR INSERT WITH CHECK (true);

-- Allow admins/creators to view
CREATE POLICY "Enable read for admins and creators" ON public.location_views
    FOR SELECT USING (
        (auth.jwt() ->> 'email') IN (
            SELECT created_by FROM locations WHERE id = location_views.location_id
        )
        OR
        public.is_admin()
    );
