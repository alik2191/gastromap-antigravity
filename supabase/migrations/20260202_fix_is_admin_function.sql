-- Fix is_admin() function to remove reference to non-existent custom_role column
DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    coalesce(current_setting('request.jwt.claim.app_metadata', true)::json->>'role', '') = 'admin' OR
    coalesce(current_setting('request.jwt.claim.user_metadata', true)::json->>'role', '') = 'admin' OR
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
