-- =============================================================================
-- 032_fix_qli_select_policy.sql
-- =============================================================================
-- Fix: Migration 029 rewrote qli_select but lost the standalone
-- app_is_platform_super_admin check. This restores it as a top-level OR
-- so super admins can always read quote line items.

DROP POLICY IF EXISTS qli_select ON public.quote_line_items;
CREATE POLICY qli_select ON public.quote_line_items
FOR SELECT USING (
  public.app_is_platform_super_admin(auth.uid())
  OR EXISTS (
    SELECT 1
    FROM public.quotes q
    WHERE q.id = quote_line_items.quote_id
      AND public.app_user_can_select_portal_record(
        COALESCE(q.organization_id, q.tenant_id),
        q.account_id,
        q.contact_id,
        NULL,
        q.owner_id,
        auth.uid(),
        q.customer_email
      )
  )
);
