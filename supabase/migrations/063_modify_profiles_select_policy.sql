-- 063_modify_profiles_select_policy.sql
-- Fix profiles_select policy to allow organization members to see teammate profiles.

-- Drop old restrictive policy
DROP POLICY IF EXISTS profiles_select ON public.profiles;

-- Create new policy: Team members can see each other's names
CREATE POLICY profiles_select ON public.profiles
FOR SELECT USING (
  -- 1. Users can see their own profile
  auth.uid() = user_id
  
  -- 2. Platform super admins can see everything
  OR public.app_is_platform_super_admin(auth.uid())
  
  -- 3. Users can see profiles of people who share an active organization membership with them
  -- This allows Owners, Admins, and teammates to see each other's full names in logs/lists.
  OR EXISTS (
    SELECT 1 
    FROM public.organization_memberships my_membership
    JOIN public.organization_memberships teammate_membership 
      ON my_membership.organization_id = teammate_membership.organization_id
    WHERE my_membership.user_id = auth.uid()
      AND teammate_membership.user_id = profiles.user_id
      AND my_membership.is_active = true
      AND my_membership.account_state = 'active'
  )
);

-- Note: We only update SELECT. INSERT/UPDATE/DELETE remain restricted to self/superadmin for security.
