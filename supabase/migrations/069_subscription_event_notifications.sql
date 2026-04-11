-- =============================================================================
-- Migration 069: Subscription Event Notifications
-- Date: 2026-04-11
-- Description:
--   1) Broadcast subscription-related notifications to owner/admin members
--      whenever a row is inserted into subscription_events.
--   2) Update upgrade_organization_plan to emit subscription_events so plan
--      changes trigger notifications consistently.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enqueue_subscription_event_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_slug text;
  v_link text;
  v_title text;
  v_message text;
  v_plan_label text;
BEGIN
  SELECT o.slug
  INTO v_workspace_slug
  FROM public.organizations o
  WHERE o.id = NEW.organization_id;

  IF v_workspace_slug IS NOT NULL AND v_workspace_slug <> '' THEN
    v_link := '/' || v_workspace_slug || '/app/subscription';
  ELSE
    v_link := NULL;
  END IF;

  v_plan_label := COALESCE(initcap(NEW.plan_type), 'Subscription');

  CASE NEW.event_type
    WHEN 'subscription_created' THEN
      v_title := 'Subscription Activated';
      v_message := v_plan_label || ' plan is now active.';
    WHEN 'subscription_cancelled' THEN
      v_title := 'Subscription Cancelled';
      v_message := 'Subscription was cancelled and downgraded to Foundation.';
    WHEN 'plan_upgraded' THEN
      v_title := 'Plan Upgraded';
      v_message := 'Plan has been upgraded to ' || v_plan_label || '.';
    WHEN 'plan_downgraded' THEN
      v_title := 'Plan Downgraded';
      v_message := 'Plan has been downgraded to ' || v_plan_label || '.';
    WHEN 'payment_success' THEN
      v_title := 'Payment Successful';
      v_message := CASE
        WHEN NEW.amount IS NOT NULL
          THEN 'Payment of INR ' || trim(to_char((NEW.amount::numeric / 100), 'FM999999990.00')) || ' was successful.'
        ELSE 'Subscription payment was successful.'
      END;
    WHEN 'payment_failed' THEN
      v_title := 'Payment Failed';
      v_message := CASE
        WHEN NEW.amount IS NOT NULL
          THEN 'Payment of INR ' || trim(to_char((NEW.amount::numeric / 100), 'FM999999990.00')) || ' failed. Please update billing.'
        ELSE 'Subscription payment failed. Please update billing.'
      END;
    WHEN 'trial_started' THEN
      v_title := 'Trial Started';
      v_message := v_plan_label || ' trial has started.';
    WHEN 'trial_ended' THEN
      v_title := 'Trial Ended';
      v_message := 'Trial period ended. Choose a plan to continue.';
    ELSE
      v_title := 'Subscription Update';
      v_message := 'Subscription event: ' || NEW.event_type;
  END CASE;

  INSERT INTO public.notifications (
    organization_id,
    user_id,
    type,
    title,
    message,
    link,
    metadata
  )
  SELECT
    NEW.organization_id,
    om.user_id,
    NEW.event_type,
    v_title,
    v_message,
    v_link,
    jsonb_strip_nulls(
      COALESCE(NEW.metadata, '{}'::jsonb)
      || jsonb_build_object(
        'subscription_event_id', NEW.id,
        'event_type', NEW.event_type,
        'plan_type', NEW.plan_type,
        'amount', NEW.amount,
        'razorpay_payment_id', NEW.razorpay_payment_id,
        'razorpay_subscription_id', NEW.razorpay_subscription_id
      )
    )
  FROM public.organization_memberships om
  WHERE om.organization_id = NEW.organization_id
    AND om.is_active = true
    AND om.account_state = 'active'
    AND om.role IN ('owner', 'admin');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_subscription_event_notifications ON public.subscription_events;
CREATE TRIGGER trg_subscription_event_notifications
  AFTER INSERT ON public.subscription_events
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_subscription_event_notification();

CREATE OR REPLACE FUNCTION public.upgrade_organization_plan(
  p_organization_id uuid,
  p_new_plan text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max_users integer;
  v_max_storage bigint;
  v_module_crm boolean := true;
  v_module_cpq boolean := true;
  v_module_docs boolean := true;
  v_module_clm boolean := false;
  v_module_erp boolean := false;
  v_old_plan text;
  v_event_type text;
  v_old_rank integer := 0;
  v_new_rank integer := 0;
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

  SELECT os.plan_type
  INTO v_old_plan
  FROM public.organization_subscriptions os
  WHERE os.organization_id = p_organization_id;

  -- 2. Determine limits and modules based on plan
  IF p_new_plan = 'foundation' THEN
    v_max_users := 5;
    v_max_storage := 1024;
  ELSIF p_new_plan = 'growth' THEN
    v_max_users := 25;
    v_max_storage := 10240;
    v_module_clm := true;
  ELSIF p_new_plan = 'commercial' THEN
    v_max_users := 100;
    v_max_storage := 102400;
    v_module_clm := true;
    v_module_erp := true;
  ELSIF p_new_plan = 'enterprise' THEN
    v_max_users := 999999;
    v_max_storage := 512000;
    v_module_clm := true;
    v_module_erp := true;
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

  -- 6. Emit subscription event for notifications/history
  IF v_old_plan IS NULL THEN
    v_event_type := 'subscription_created';
  ELSIF v_old_plan <> p_new_plan THEN
    v_old_rank := CASE v_old_plan
      WHEN 'foundation' THEN 1
      WHEN 'growth' THEN 2
      WHEN 'commercial' THEN 3
      WHEN 'enterprise' THEN 4
      ELSE 0
    END;

    v_new_rank := CASE p_new_plan
      WHEN 'foundation' THEN 1
      WHEN 'growth' THEN 2
      WHEN 'commercial' THEN 3
      WHEN 'enterprise' THEN 4
      ELSE 0
    END;

    IF v_new_rank > v_old_rank THEN
      v_event_type := 'plan_upgraded';
    ELSE
      v_event_type := 'plan_downgraded';
    END IF;
  END IF;

  IF v_event_type IS NOT NULL THEN
    INSERT INTO public.subscription_events (
      organization_id,
      event_type,
      plan_type,
      metadata
    )
    VALUES (
      p_organization_id,
      v_event_type,
      p_new_plan,
      jsonb_build_object(
        'previous_plan', v_old_plan,
        'new_plan', p_new_plan,
        'changed_by', auth.uid(),
        'changed_at', now()
      )
    );
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upgrade_organization_plan(uuid, text) TO authenticated, service_role;
