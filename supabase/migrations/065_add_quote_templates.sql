-- 065_add_quote_templates.sql
-- Introduce real CPQ quote templates with reusable default line items.

SET search_path = public, extensions;

CREATE TABLE IF NOT EXISTS public.quote_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NULL,
  name text NOT NULL,
  description text NULL,
  category text NULL,
  notes text NULL,
  terms text NULL,
  validity_days integer NOT NULL DEFAULT 30,
  discount_percent numeric(5, 2) NOT NULL DEFAULT 0,
  tax_percent numeric(5, 2) NOT NULL DEFAULT 18,
  estimated_total numeric(15, 2) NOT NULL DEFAULT 0,
  item_count integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_public boolean NOT NULL DEFAULT false,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quote_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_template_id uuid NOT NULL REFERENCES public.quote_templates(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NULL REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NULL,
  description text NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(15, 2) NOT NULL DEFAULT 0,
  discount_percent numeric(5, 2) NOT NULL DEFAULT 0,
  total numeric(15, 2) NOT NULL DEFAULT 0,
  sort_order integer NOT NULL DEFAULT 0,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quote_templates_org ON public.quote_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_quote_templates_active ON public.quote_templates(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_quote_template_items_template ON public.quote_template_items(quote_template_id);
CREATE INDEX IF NOT EXISTS idx_quote_template_items_sort ON public.quote_template_items(quote_template_id, sort_order);

ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_template_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS quote_templates_select ON public.quote_templates;
CREATE POLICY quote_templates_select ON public.quote_templates
FOR SELECT USING (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_templates_insert ON public.quote_templates;
CREATE POLICY quote_templates_insert ON public.quote_templates
FOR INSERT WITH CHECK (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_templates_update ON public.quote_templates;
CREATE POLICY quote_templates_update ON public.quote_templates
FOR UPDATE USING (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
)
WITH CHECK (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_templates_delete ON public.quote_templates;
CREATE POLICY quote_templates_delete ON public.quote_templates
FOR DELETE USING (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_template_items_select ON public.quote_template_items;
CREATE POLICY quote_template_items_select ON public.quote_template_items
FOR SELECT USING (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_template_items_insert ON public.quote_template_items;
CREATE POLICY quote_template_items_insert ON public.quote_template_items
FOR INSERT WITH CHECK (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_template_items_update ON public.quote_template_items;
CREATE POLICY quote_template_items_update ON public.quote_template_items
FOR UPDATE USING (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
)
WITH CHECK (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);

DROP POLICY IF EXISTS quote_template_items_delete ON public.quote_template_items;
CREATE POLICY quote_template_items_delete ON public.quote_template_items
FOR DELETE USING (
  public._rls_user_can_write_org(
    COALESCE(organization_id, tenant_id),
    ARRAY['owner', 'admin', 'manager', 'employee']::public.app_role[]
  )
);
