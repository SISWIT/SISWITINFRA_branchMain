-- Platform Dashboard Overview RPC
-- Aggregates platform-wide metrics securely for platform super admins.

CREATE OR REPLACE FUNCTION get_platform_overview()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_orgs INT;
  v_active_orgs INT;
  v_trial_orgs INT;
  v_total_users INT;
  v_failed_jobs INT;
  v_suspicious_activity INT;
  v_estimated_mrr NUMERIC;
BEGIN
  -- 1. Must be a platform_super_admin to run this
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_super_admins
    WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  -- 2. Organizations aggregates
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'trial')
  INTO v_total_orgs, v_active_orgs, v_trial_orgs
  FROM public.organizations;

  -- 3. Users aggregate
  SELECT COUNT(*) INTO v_total_users FROM public.profiles;

  -- 4. Estimated MRR (Monthly Recurring Revenue)
  -- Map plans to standard monthly prices (Foundation=799, Growth=1399, Commercial=2299, Enterprise=3799)
  -- In a real billing system this reads from invoices/subscriptions table, but for MVP it's estimated based on plan limits or hardcoded map.
  -- Here we'll map the known plans from siswit.
  SELECT COALESCE(SUM(
    CASE lower(plan_type)
      WHEN 'foundation' THEN 799
      WHEN 'growth' THEN 1399
      WHEN 'commercial' THEN 2299
      WHEN 'enterprise' THEN 3799
      ELSE 0
    END
  ), 0) INTO v_estimated_mrr
  FROM public.organization_subscriptions
  WHERE status = 'active';

  -- 5. System Health / Failed jobs
  -- Assuming we have a jobs/tasks table, but since we don't have a canonical one yet, we'll return 0 or look at a known table.
  -- For now, return 0 as placeholder for failed background jobs.
  v_failed_jobs := 0;

  -- 6. Recent suspicious activity (failed logins, critical audit events)
  SELECT COUNT(*) INTO v_suspicious_activity
  FROM public.audit_logs
  WHERE created_at >= NOW() - INTERVAL '24 hours'
    AND action IN ('login_failed', 'role_escalation', 'data_export');

  -- Return payload
  RETURN json_build_object(
    'total_organizations', v_total_orgs,
    'active_organizations', v_active_orgs,
    'trial_organizations', v_trial_orgs,
    'total_users', v_total_users,
    'estimated_mrr', v_estimated_mrr,
    'failed_jobs_count', v_failed_jobs,
    'recent_suspicious_activity_count', v_suspicious_activity
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_platform_overview() TO authenticated;
