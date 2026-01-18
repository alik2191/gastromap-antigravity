-- FIX: 500 Internal Server Error (Infinite Recursion)

-- 1. Create a secure function to check admin status without triggering RLS loops
-- SECURITY DEFINER logic ensures this function runs with higher privileges, bypassing the RLS on 'profiles'.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop the problematic recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
-- (Users can only view their own profile is likely still safe as it uses auth.uid() = id, which is row-based, not table-query based)

-- 3. Re-create Profiles Policies using the safe function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  public.is_admin()
);

CREATE POLICY "Admins can update all profiles" 
ON public.profiles FOR UPDATE
USING (
  public.is_admin()
);

-- 4. Update other policies to use the safe function (Cleaner and safer)
-- Locations
DROP POLICY IF EXISTS "Admins can view all locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can update all locations" ON public.locations;
DROP POLICY IF EXISTS "Admins can delete locations" ON public.locations;

CREATE POLICY "Admins can view all locations" 
ON public.locations FOR SELECT 
USING (
  public.is_admin() OR status = 'published' -- OR existing public access logic
);

CREATE POLICY "Admins can update all locations" 
ON public.locations FOR UPDATE
USING (
  public.is_admin()
);

CREATE POLICY "Admins can delete locations" 
ON public.locations FOR DELETE
USING (
  public.is_admin()
);

-- Reviews
DROP POLICY IF EXISTS "Admins can view all reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admins can update reviews" ON public.reviews;

CREATE POLICY "Admins can view all reviews" 
ON public.reviews FOR SELECT 
USING (
  public.is_admin() OR status = 'approved' OR user_id = auth.uid()
);

CREATE POLICY "Admins can update reviews" 
ON public.reviews FOR UPDATE
USING (
  public.is_admin()
);

-- Subscriptions
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can view all subscriptions" 
ON public.subscriptions FOR SELECT 
USING (
  public.is_admin() OR user_id = auth.uid()
);

-- Feedback
DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback" 
ON public.feedback FOR SELECT 
USING (
  public.is_admin() OR user_id = auth.uid()
);

-- Creator Answers
DROP POLICY IF EXISTS "Admins can view all creator_answers" ON public.creator_answers;
CREATE POLICY "Admins can view all creator_answers" 
ON public.creator_answers FOR SELECT 
USING (
  public.is_admin() OR true -- Currently public read
);
