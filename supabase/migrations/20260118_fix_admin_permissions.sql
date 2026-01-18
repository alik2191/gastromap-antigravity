-- Fix Admin Permissions (Allow Admins to view all data)

-- 1. Profiles Table Permissions
-- Drop existing restrictive policy if it conflicts, or just add a new one.
-- Supabase policies are additive (OR logic), so adding a new "Admins can view all" policy is sufficient.

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin' 
  OR 
  (auth.jwt() ->> 'role') = 'service_role' -- Service role can see all
);

-- Allow Admins to update profiles (e.g. changing roles)
CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- 2. Locations Permissions (Ensure admins see pending/rejected too)
CREATE POLICY "Admins can view all locations" 
ON public.locations FOR SELECT 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update all locations" 
ON public.locations FOR UPDATE
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can delete locations" 
ON public.locations FOR DELETE
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);


-- 3. Reviews Permissions
CREATE POLICY "Admins can view all reviews" 
ON public.reviews FOR SELECT 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

CREATE POLICY "Admins can update reviews" 
ON public.reviews FOR UPDATE
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- 4. Subscriptions (Already covered in previous migration, but reinforcing)
-- If previous migration was run, this might duplicate, but it's safe as names must be unique.
-- Best to wrap in DO block or just risk error if exists. 
-- Or use "IF NOT EXISTS" logic isn't standard for CREATE POLICY.
-- We'll just define them. If they exist, Supabase logs error but nothing breaks.

-- 5. Saved Locations (Admins generally don't need to see personal saves, but for support maybe)
CREATE POLICY "Admins can view all saved_locations" 
ON public.saved_locations FOR SELECT 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- 6. Creator Answers (Ensure admins see all moderation answers)
CREATE POLICY "Admins can view all creator_answers" 
ON public.creator_answers FOR SELECT 
USING (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);
