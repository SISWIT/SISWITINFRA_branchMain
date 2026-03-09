-- ============================================================================
-- Migration 016: Add tenant columns to 9 child tables
-- Fixes: S-01, S-02, S-03, S-04, S-05, X-02
-- ============================================================================

-- ---- contract_esignatures (S-01) ----
ALTER TABLE public.contract_esignatures
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.contract_esignatures ce
  SET organization_id = c.organization_id, tenant_id = c.tenant_id
  FROM public.contracts c WHERE ce.contract_id = c.id AND ce.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_contract_esignatures_org ON public.contract_esignatures(organization_id);

-- ---- contract_scans (S-02) ----
ALTER TABLE public.contract_scans
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.contract_scans cs
  SET organization_id = c.organization_id, tenant_id = c.tenant_id
  FROM public.contracts c WHERE cs.contract_id = c.id AND cs.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_contract_scans_org ON public.contract_scans(organization_id);

-- ---- contract_versions ----
ALTER TABLE public.contract_versions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.contract_versions cv
  SET organization_id = c.organization_id, tenant_id = c.tenant_id
  FROM public.contracts c WHERE cv.contract_id = c.id AND cv.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_contract_versions_org ON public.contract_versions(organization_id);

-- ---- document_esignatures (S-03) ----
ALTER TABLE public.document_esignatures
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.document_esignatures de
  SET organization_id = d.organization_id, tenant_id = d.tenant_id
  FROM public.auto_documents d WHERE de.document_id = d.id AND de.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_document_esignatures_org ON public.document_esignatures(organization_id);

-- ---- document_versions (S-04) ----
ALTER TABLE public.document_versions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.document_versions dv
  SET organization_id = d.organization_id, tenant_id = d.tenant_id
  FROM public.auto_documents d WHERE dv.document_id = d.id AND dv.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_document_versions_org ON public.document_versions(organization_id);

-- ---- document_permissions (S-05) ----
ALTER TABLE public.document_permissions
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.document_permissions dp
  SET organization_id = d.organization_id, tenant_id = d.tenant_id
  FROM public.auto_documents d WHERE dp.document_id = d.id AND dp.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_document_permissions_org ON public.document_permissions(organization_id);

-- ---- quote_line_items ----
ALTER TABLE public.quote_line_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.quote_line_items qli
  SET organization_id = q.organization_id, tenant_id = q.tenant_id
  FROM public.quotes q WHERE qli.quote_id = q.id AND qli.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_quote_line_items_org ON public.quote_line_items(organization_id);

-- ---- purchase_order_items ----
ALTER TABLE public.purchase_order_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.purchase_order_items poi
  SET organization_id = po.organization_id, tenant_id = po.tenant_id
  FROM public.purchase_orders po WHERE poi.purchase_order_id = po.id AND poi.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_org ON public.purchase_order_items(organization_id);

-- ---- production_order_items ----
ALTER TABLE public.production_order_items
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;

UPDATE public.production_order_items proi
  SET organization_id = pro.organization_id, tenant_id = pro.tenant_id
  FROM public.production_orders pro WHERE proi.production_order_id = pro.id AND proi.organization_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_production_order_items_org ON public.production_order_items(organization_id);


-- ============================================================================
-- Add all 9 tables to the sync_scope_ids() trigger
-- ============================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'contract_esignatures', 'contract_scans', 'contract_versions',
    'document_esignatures', 'document_versions', 'document_permissions',
    'quote_line_items', 'purchase_order_items', 'production_order_items'
  ]
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%I_sync_scope_ids ON public.%I;
       CREATE TRIGGER trg_%I_sync_scope_ids
         BEFORE INSERT OR UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.sync_scope_ids();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;


-- ============================================================================
-- RLS policies for all 9 child tables
-- ============================================================================

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'contract_esignatures', 'contract_scans', 'contract_versions',
    'document_esignatures', 'document_versions', 'document_permissions',
    'quote_line_items', 'purchase_order_items', 'production_order_items'
  ]
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);

    EXECUTE format(
      'DROP POLICY IF EXISTS %I_tenant_isolation ON public.%I;
       CREATE POLICY %I_tenant_isolation ON public.%I
         FOR ALL
         USING (
           organization_id IN (
             SELECT om.organization_id FROM public.organization_memberships om
             WHERE om.user_id = auth.uid() AND om.is_active = true
           )
         );',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;
