-- =========================================================================
-- 070: Enable Realtime for Documents Tables
-- =========================================================================
-- Ensure document-related tables are in the `supabase_realtime` publication
-- so dashboard counters and history views update immediately on INSERT/UPDATE/DELETE.

DO $$
DECLARE
  tbl text;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'auto_documents',
    'document_templates',
    'document_esignatures',
    'document_versions',
    'document_permissions'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
