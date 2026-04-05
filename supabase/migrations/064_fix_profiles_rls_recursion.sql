-- Migration 064: Fix Profiles RLS Recursion
-- Author: Sunny
-- Date: 2026-04-05
-- Description: Implement a security-defined function to check teammate status 
--              and simplify the profiles_select policy to prevent RLS recursion
--              which was likely causing Auth 400 errors.

-- 1. Create a security-defined function to check if two users are teammates.
--    By using SECURITY DEFINER, we bypass RLS on organization_memberships
--    within this check, effectively breaking the recursion loop.
CREATE OR REPLACE FUNCTION public.app_is_teammate(
  p_viewer_id uuid,
  p_target_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.organization_memberships m1
    JOIN public.organization_memberships m2 ON m1.organization_id = m2.organization_id
    WHERE m1.user_id = p_viewer_id 
      AND m2.user_id = p_target_id 
      AND m1.is_active = true
      AND m1.account_state = 'active'
  );
END;
$$;

-- 2. Update the profiles_select policy to use this function.
DROP POLICY IF EXISTS profiles_select ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
FOR SELECT USING (
  -- Always allow viewing own profile
  auth.uid() = user_id
  -- Platform admins can see everyone
  OR public.app_is_platform_super_admin(auth.uid())
  -- Organization teammates can see each other's names
  -- Using the security-definer function here prevents recursion
  OR public.app_is_teammate(auth.uid(), user_id)
);

-- Ensure accurate permissions
GRANT EXECUTE ON FUNCTION public.app_is_teammate(uuid, uuid) TO authenticated;
