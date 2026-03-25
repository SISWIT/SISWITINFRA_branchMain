-- Migration 052: Fix Upgrade Plan RPC
-- Description: Update upgrade_organization_plan to also update organizations 
--              and organization_subscriptions modules

CREATE OR REPLACE FUNCTION public.upgrade_organization_plan(
  p_organization_id UUID,
  p_new_plan TEXT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_users INTEGER;
  v_max_storage BIGINT;
  v_module_crm BOOLEAN := TRUE;
  v_module_cpq BOOLEAN := TRUE;
  v_module_docs BOOLEAN := TRUE;
  v_module_clm BOOLEAN := FALSE;
  v_module_erp BOOLEAN := FALSE;
BEGIN
  -- 1. Check user permissions
  IF NOT EXISTS (
    SELECT 1 FROM organization_memberships
    WHERE organization_id = p_organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin', 'platform_super_admin')
  ) THEN
    RAISE EXCEPTION 'Not authorized to change subscription plan';
  END IF;

  -- 2. Determine limits and modules based on plan
  IF p_new_plan = 'foundation' THEN
    v_max_users := 5;
    v_max_storage := 1024;
  ELSIF p_new_plan = 'growth' THEN
    v_max_users := 25;
    v_max_storage := 10240;
    v_module_clm := TRUE;
  ELSIF p_new_plan = 'commercial' THEN
    v_max_users := 100;
    v_max_storage := 102400;
    v_module_clm := TRUE;
    v_module_erp := TRUE;
  ELSIF p_new_plan = 'enterprise' THEN
    v_max_users := 999999;
    v_max_storage := 512000;
    v_module_clm := TRUE;
    v_module_erp := TRUE;
  ELSE
    RAISE EXCEPTION 'Invalid plan type: %', p_new_plan;
  END IF;

  -- 3. Update organizations table
  UPDATE public.organizations
  SET 
    plan_type = p_new_plan,
    max_users = v_max_users,
    max_storage_mb = v_max_storage,
    updated_at = now()
  WHERE id = p_organization_id;

  -- 4. Update organization_subscriptions table (upsert)
  INSERT INTO public.organization_subscriptions (
    organization_id, 
    plan_type, 
    module_crm, 
    module_cpq, 
    module_clm, 
    module_erp, 
    module_documents,
    updated_at
  )
  VALUES (
    p_organization_id, 
    p_new_plan, 
    v_module_crm, 
    v_module_cpq, 
    v_module_clm, 
    v_module_erp, 
    v_module_docs,
    now()
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    plan_type = EXCLUDED.plan_type,
    module_crm = EXCLUDED.module_crm,
    module_cpq = EXCLUDED.module_cpq,
    module_clm = EXCLUDED.module_clm,
    module_erp = EXCLUDED.module_erp,
    module_documents = EXCLUDED.module_documents,
    updated_at = EXCLUDED.updated_at;

  -- 5. Reseed limits in plan_limits table
  PERFORM public.seed_plan_limits_for_organization(p_organization_id, p_new_plan);

  RETURN true;
END;
$$;
