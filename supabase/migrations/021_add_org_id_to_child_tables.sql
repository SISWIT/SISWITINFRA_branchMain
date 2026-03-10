-- ============================================================================
-- Migration 021: Ensure quote_line_items has organization scope columns
-- ============================================================================

ALTER TABLE public.quote_line_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id);

-- Backfill from parent quote scope.
UPDATE public.quote_line_items qli
SET
  organization_id = q.organization_id,
  tenant_id = q.tenant_id
FROM public.quotes q
WHERE qli.quote_id = q.id
  AND (qli.organization_id IS NULL OR qli.tenant_id IS NULL);

-- Enforce organization scope after backfill.
ALTER TABLE public.quote_line_items
  ALTER COLUMN organization_id SET NOT NULL;
