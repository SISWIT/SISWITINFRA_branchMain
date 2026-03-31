-- Phase 8: Platform Settings and Feature Flags Domain

CREATE TABLE public.platform_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  description text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only platform super admins can read and write global platform settings
CREATE POLICY "Platform super admins can read settings"
  ON public.platform_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

CREATE POLICY "Platform super admins can insert settings"
  ON public.platform_settings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

CREATE POLICY "Platform super admins can update settings"
  ON public.platform_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

CREATE POLICY "Platform super admins can delete settings"
  ON public.platform_settings FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );


-- Feature flags
CREATE TABLE public.platform_feature_flags (
  key text PRIMARY KEY,
  is_enabled boolean NOT NULL DEFAULT false,
  description text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_feature_flags ENABLE ROW LEVEL SECURITY;

-- Note: feature flags might need to be read by all authenticated users to toggle UI, 
-- but for now we restrict to platform super admins to match settings scoping.
CREATE POLICY "Platform super admins can read feature flags"
  ON public.platform_feature_flags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

CREATE POLICY "Platform super admins can manage feature flags"
  ON public.platform_feature_flags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

-- Seed defaults
INSERT INTO public.platform_settings (key, value, description)
VALUES 
  ('maintenance_mode', 'false', 'Global flag to lock out tenant logins during maintenance windows'),
  ('max_impersonation_duration_hours', '12', 'Default maximum time an impersonation session can stay active'),
  ('audit_log_retention_days', '90', 'Number of days to retain tenant audit logs before archival')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_feature_flags (key, is_enabled, description)
VALUES 
  ('enable_advanced_billing', false, 'Toggle experimental granular usage-based billing features'),
  ('enable_ai_assist', false, 'Toggle beta AI capabilities in the CRM'),
  ('enable_custom_domains', false, 'Allow organizations to map their own domains')
ON CONFLICT (key) DO NOTHING;
