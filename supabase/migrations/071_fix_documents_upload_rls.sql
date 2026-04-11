-- Fix RLS policy for documents bucket uploads
-- Allow employee role (in addition to owner/admin/manager) to upload files.

DROP POLICY IF EXISTS "documents_insert_managers" ON storage.objects;
DROP POLICY IF EXISTS "documents_insert_org_members" ON storage.objects;

CREATE POLICY "documents_insert_org_members" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text
      FROM public.organization_memberships
      WHERE user_id = auth.uid()
        AND is_active = true
        AND role IN ('owner', 'admin', 'manager', 'employee')
    )
  );
