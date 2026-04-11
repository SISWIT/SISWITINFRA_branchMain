-- Allow portal clients to read auto_documents when they are explicit e-sign recipients/signers.
-- This restores document title/content/file_path visibility in the portal signature flow.

CREATE OR REPLACE FUNCTION public.app_user_can_select_auto_document(
  p_document_id uuid,
  p_organization_id uuid,
  p_created_by uuid DEFAULT NULL,
  p_owner_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    public.app_user_can_select_portal_record(
      p_organization_id,
      NULL::text,
      NULL::text,
      p_created_by,
      p_owner_id,
      p_user_id
    )
    OR EXISTS (
      SELECT 1
      FROM public.document_esignatures de
      WHERE de.document_id = p_document_id
        AND COALESCE(de.organization_id, de.tenant_id) = p_organization_id
        AND public.app_user_can_select_portal_record(
          p_organization_id,
          de.recipient_email,
          de.signer_email,
          p_created_by,
          p_owner_id,
          p_user_id
        )
    );
$$;

GRANT EXECUTE ON FUNCTION public.app_user_can_select_auto_document(uuid, uuid, uuid, uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS auto_documents_select ON public.auto_documents;
CREATE POLICY auto_documents_select ON public.auto_documents
FOR SELECT USING (
  public.app_user_can_select_auto_document(
    id,
    COALESCE(organization_id, tenant_id),
    created_by,
    owner_id,
    auth.uid()
  )
);
