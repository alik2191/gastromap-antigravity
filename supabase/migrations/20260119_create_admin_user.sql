-- Create admin user for local testing
-- Run this in Supabase SQL Editor or via migration

-- First, create the auth user (you'll need to do this via Supabase Dashboard > Authentication > Users)
-- Email: admin@gastromap.local
-- Password: admin123456

-- Then run this SQL to set the role to admin:
UPDATE public.profiles 
SET role = 'admin', 
    custom_role = 'admin'
WHERE email = 'admin@gastromap.local';

-- If the profile doesn't exist yet, insert it:
INSERT INTO public.profiles (id, email, name, role, custom_role, created_at, updated_at)
VALUES (
    'admin-local-test-id', 
    'admin@gastromap.local', 
    'Local Admin', 
    'admin', 
    'admin',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', 
    custom_role = 'admin';

-- Verify the admin user:
SELECT id, email, name, role, custom_role 
FROM public.profiles 
WHERE email = 'admin@gastromap.local';
