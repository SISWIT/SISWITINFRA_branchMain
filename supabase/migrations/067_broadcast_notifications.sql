-- =========================================================================
-- 067: Broadcast Notifications to Organization Role Members
-- =========================================================================
-- Creates a function that inserts a notification for every active member
-- holding one of the specified roles within the organization, plus
-- optionally for a specific user (the actor), de-duplicated.

CREATE OR REPLACE FUNCTION public.broadcast_notification(
  p_organization_id UUID,
  p_actor_user_id   UUID,          -- the user who triggered the event (always notified)
  p_target_roles    TEXT[],        -- e.g. ARRAY['owner','admin']
  p_type            TEXT,
  p_title           TEXT,
  p_message         TEXT,
  p_link            TEXT DEFAULT NULL,
  p_metadata        JSONB DEFAULT '{}'::jsonb
)
RETURNS SETOF UUID AS $$
DECLARE
  v_user_id UUID;
  v_inserted_id UUID;
BEGIN
  -- Iterate over every unique active member whose role matches the target list
  -- OR the actor themselves (so the creator also receives the notification).
  FOR v_user_id IN
    SELECT DISTINCT om.user_id
    FROM public.organization_memberships om
    WHERE om.organization_id = p_organization_id
      AND om.is_active = true
      AND om.account_state = 'active'
      AND (
        om.role::text = ANY(p_target_roles)
        OR om.user_id = p_actor_user_id
      )
  LOOP
    INSERT INTO public.notifications (
      organization_id,
      user_id,
      type,
      title,
      message,
      link,
      metadata
    ) VALUES (
      p_organization_id,
      v_user_id,
      p_type,
      p_title,
      p_message,
      p_link,
      p_metadata
    ) RETURNING id INTO v_inserted_id;

    RETURN NEXT v_inserted_id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow INSERT on notifications for authenticated users via the RPC
-- (the existing RLS only allows SELECT/UPDATE/DELETE for own rows;
-- the SECURITY DEFINER on the function bypasses RLS for inserts.)
