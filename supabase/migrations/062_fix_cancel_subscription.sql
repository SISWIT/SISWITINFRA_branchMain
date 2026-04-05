-- =============================================================================
-- Migration 062: Fix cancel_subscription to properly downgrade
-- Author: Solanki
-- Date: 2026-04-03
-- Description: The cancel_subscription RPC was not resetting plan_type and
--              module_* flags in organization_subscriptions, causing stale
--              data to show in the frontend.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cancel_subscription(
  p_org_id uuid,
  p_reason text DEFAULT ''
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_plan text;
BEGIN
  -- Get current plan before cancellation
  SELECT plan_type INTO v_old_plan
  FROM public.organization_subscriptions
  WHERE organization_id = p_org_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No subscription found for organization %', p_org_id;
  END IF;

  -- Update subscription: cancel, downgrade plan, and reset module flags
  UPDATE public.organization_subscriptions SET
    status = 'cancelled',
    plan_type = 'foundation',
    cancelled_at = now(),
    cancel_reason = p_reason,
    is_trial = false,
    -- Reset module flags to Foundation tier
    module_crm = true,
    module_cpq = true,
    module_documents = true,
    module_clm = false,
    module_erp = false,
    updated_at = now()
  WHERE organization_id = p_org_id;

  -- Downgrade organization to foundation
  UPDATE public.organizations SET
    plan_type = 'foundation',
    status = 'active',
    max_users = 5,
    max_storage_mb = 1024,
    updated_at = now()
  WHERE id = p_org_id;

  -- Reseed plan limits to foundation
  PERFORM public.seed_plan_limits_for_organization(p_org_id, 'foundation');

  -- Log cancellation event
  INSERT INTO public.subscription_events (
    organization_id,
    event_type,
    plan_type,
    metadata
  ) VALUES (
    p_org_id,
    'subscription_cancelled',
    v_old_plan,
    jsonb_build_object(
      'reason', p_reason,
      'cancelled_at', now(),
      'downgraded_to', 'foundation'
    )
  );

  RETURN json_build_object(
    'success', true,
    'cancelled_plan', v_old_plan,
    'downgraded_to', 'foundation'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_subscription(uuid, text) TO authenticated, service_role;
