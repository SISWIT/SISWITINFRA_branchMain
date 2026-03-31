-- Phase 8: Platform Domain Events for Advanced Analytics
-- This table logs structural platform changes for deep analytics pipelines, separate from purely legal/security audit logs.

CREATE TABLE public.platform_domain_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  actor_user_id uuid, -- Profile or Platform Admin user_id
  target_entity_type text, -- E.g., 'subscription', 'feature_flag', 'tenant'
  target_entity_id text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  processed_at timestamptz -- Used by background jobs picking up the events downstream
);

ALTER TABLE public.platform_domain_events ENABLE ROW LEVEL SECURITY;

-- Only platform super admins can read events directly
CREATE POLICY "Platform super admins can read domain events"
  ON public.platform_domain_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

-- Any authenticated endpoint can insert events (via RPC or Edge fn) or backend jobs
CREATE POLICY "Auth users can insert domain events"
  ON public.platform_domain_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Platform super admins can update events"
  ON public.platform_domain_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_super_admins
      WHERE platform_super_admins.user_id = auth.uid()
      AND platform_super_admins.is_active = true
    )
  );

-- Indexes for performance
CREATE INDEX idx_platform_domain_events_type ON public.platform_domain_events (event_type);
CREATE INDEX idx_platform_domain_events_org ON public.platform_domain_events (organization_id);
CREATE INDEX idx_platform_domain_events_unprocessed ON public.platform_domain_events (created_at) WHERE processed_at IS NULL;
