-- Migration: 043_upgrade_plan_rpc.sql

CREATE OR REPLACE FUNCTION upgrade_organization_plan(
  p_organization_id UUID,
  p_new_plan TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check user permissions
  IF NOT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'platform_super_admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to change subscription plan';
  END IF;

  -- Update subscription
  UPDATE organization_subscriptions
  SET plan_type = p_new_plan, updated_at = now()
  WHERE organization_id = p_organization_id;

  IF NOT FOUND THEN
    INSERT INTO organization_subscriptions (organization_id, plan_type)
    VALUES (p_organization_id, p_new_plan);
  END IF;

  -- Reseed limits
  PERFORM seed_plan_limits_for_organization(p_organization_id, p_new_plan);

  RETURN true;
END;
$$;
