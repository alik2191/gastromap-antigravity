-- Setup Storage for Photo Uploads

-- 1. Create the 'uploads' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects (it usually is enabled by default, but good to be sure)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policies

-- Allow Public View (Anyone can see photos)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- Allow Authenticated Users to Upload
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
CREATE POLICY "Auth Upload"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );

-- Allow Authenticated Users to Update/Delete (Simplified for MVP)
DROP POLICY IF EXISTS "Auth Manage" ON storage.objects;
CREATE POLICY "Auth Manage"
ON storage.objects FOR ALL
USING ( bucket_id = 'uploads' AND auth.role() = 'authenticated' );
