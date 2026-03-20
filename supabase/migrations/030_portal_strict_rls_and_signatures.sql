-- 030_portal_strict_rls_and_signatures.sql
-- Fix email-only portal scoping by introducing structural contact/account links for clients.
-- Enable clients to securely sign documents.

ALTER TABLE public.organization_memberships
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

ALTER TABLE public.client_invitations
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_memberships_account ON public.organization_memberships(account_id);
CREATE INDEX IF NOT EXISTS idx_memberships_contact ON public.organization_memberships(contact_id);

-- Update the main portal record read policy to rely on account/contact links rather than fallback emails.
CREATE OR REPLACE FUNCTION public.app_user_can_select_portal_record(
  p_organization_id uuid,
  p_account_id uuid DEFAULT NULL,
  p_contact_id uuid DEFAULT NULL,
  p_created_by uuid DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid(),
  p_fallback_email text DEFAULT NULL -- Kept for legacy compatibility during migration
)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT
    public.app_is_platform_super_admin(p_user_id)
    OR public.app_user_has_internal_organization_access(p_organization_id, p_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.organization_memberships om
      WHERE om.user_id = p_user_id
        AND om.organization_id = p_organization_id
        AND om.is_active = true
        AND om.account_state IN ('active', 'pending_verification')
        AND om.role = 'client'
        AND (
          (p_account_id IS NOT NULL AND om.account_id = p_account_id)
          OR (p_contact_id IS NOT NULL AND om.contact_id = p_contact_id)
          -- Fallback email match ONLY if no structural link exists, as a migration transition feature
          OR (p_fallback_email IS NOT NULL AND lower(om.email) = lower(p_fallback_email) AND om.account_id IS NULL AND om.contact_id IS NULL)
          OR (p_created_by IS NOT NULL AND p_created_by = p_user_id)
          OR (p_owner_id IS NOT NULL AND p_owner_id = p_user_id)
        )
    );
$$;

-- Replace existing quotes reading policy
DROP POLICY IF EXISTS quotes_select ON public.quotes;
CREATE POLICY quotes_select ON public.quotes
FOR SELECT USING (
  public.app_user_can_select_portal_record(
    COALESCE(organization_id, tenant_id),
    account_id,
    contact_id,
    NULL,
    owner_id,
    auth.uid(),
    customer_email
  )
);

-- Replace existing contracts reading policy
DROP POLICY IF EXISTS contracts_select ON public.contracts;
CREATE POLICY contracts_select ON public.contracts
FOR SELECT USING (
  public.app_user_can_select_portal_record(
    COALESCE(organization_id, tenant_id),
    NULL,
    NULL,
    NULL,
    owner_id,
    auth.uid(),
    customer_email
  )
);
-- Contracts don't have account_id/contact_id natively yet, we should add them if they don't exist!
ALTER TABLE public.contracts
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL;

-- Redefine contracts reading policy now that columns exist
DROP POLICY IF EXISTS contracts_select ON public.contracts;
CREATE POLICY contracts_select ON public.contracts
FOR SELECT USING (
  public.app_user_can_select_portal_record(
    COALESCE(organization_id, tenant_id),
    account_id,
    contact_id,
    NULL,
    owner_id,
    auth.uid(),
    customer_email
  )
);

-- Quote line items & Contract Versions (No change needed, they rely on quotes_select / contracts_select!)

-- Add specific Client UPDATE policy for contract_esignatures
DROP POLICY IF EXISTS ces_update_client ON public.contract_esignatures;
CREATE POLICY ces_update_client ON public.contract_esignatures
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.organization_memberships om ON om.organization_id = COALESCE(c.organization_id, c.tenant_id)
    WHERE c.id = contract_esignatures.contract_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
      AND om.role = 'client'
      AND (
         (c.account_id IS NOT NULL AND om.account_id = c.account_id) OR
         (c.contact_id IS NOT NULL AND om.contact_id = c.contact_id) OR
         (om.account_id IS NULL AND om.contact_id IS NULL AND lower(om.email) = lower(c.customer_email))
      )
      AND lower(om.email) = lower(contract_esignatures.signer_email)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contracts c
    JOIN public.organization_memberships om ON om.organization_id = COALESCE(c.organization_id, c.tenant_id)
    WHERE c.id = contract_esignatures.contract_id
      AND om.user_id = auth.uid()
      AND om.is_active = true
      AND om.role = 'client'
      AND (
         (c.account_id IS NOT NULL AND om.account_id = c.account_id) OR
         (c.contact_id IS NOT NULL AND om.contact_id = c.contact_id) OR
         (om.account_id IS NULL AND om.contact_id IS NULL AND lower(om.email) = lower(c.customer_email))
      )
      AND lower(om.email) = lower(contract_esignatures.signer_email)
  )
);

-- Contract eSignature reads should also enforce contact/email match properly
DROP POLICY IF EXISTS ces_select ON public.contract_esignatures;
CREATE POLICY ces_select ON public.contract_esignatures
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.id = contract_esignatures.contract_id
      AND public.app_user_can_select_portal_record(
        COALESCE(c.organization_id, c.tenant_id),
        c.account_id,
        c.contact_id,
        NULL,
        c.owner_id,
        auth.uid(),
        c.customer_email
      )
  )
);
