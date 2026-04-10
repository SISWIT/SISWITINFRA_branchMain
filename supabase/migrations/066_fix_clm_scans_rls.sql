-- Fix RLS Policies for Document Scanning
-- Replace existing restricted INSERT policies for contract_scans table and contract-scans bucket to include Employees

-- 1. contract-scans bucket INSERT policy (org members can upload)
DROP POLICY IF EXISTS "contract_scans_insert_managers" ON storage.objects;
CREATE POLICY "contract_scans_insert_org_members" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'contract-scans'
    AND (storage.foldername(name))[1] IN (
      SELECT organization_id::text FROM public.organization_memberships
      WHERE user_id = auth.uid()
    )
  );

-- 2. contract_scans table INSERT policy (org members can insert)
DROP POLICY IF EXISTS cs_insert ON public.contract_scans;
CREATE POLICY cs_insert ON public.contract_scans
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contracts c
      JOIN public.organization_memberships om ON om.organization_id = COALESCE(c.organization_id, c.tenant_id)
      WHERE c.id = contract_id
      AND om.user_id = auth.uid()
    )
  );
