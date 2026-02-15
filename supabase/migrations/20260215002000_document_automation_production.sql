-- Production-ready Auto Documentation schema:
-- templates, versions, permissions, e-signatures, and status lifecycle.

-- Extend document status enum for signing lifecycle.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'document_status' AND e.enumlabel = 'sent'
  ) THEN
    ALTER TYPE public.document_status ADD VALUE 'sent';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'document_status' AND e.enumlabel = 'signed'
  ) THEN
    ALTER TYPE public.document_status ADD VALUE 'signed';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'document_status' AND e.enumlabel = 'rejected'
  ) THEN
    ALTER TYPE public.document_status ADD VALUE 'rejected';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'document_status' AND e.enumlabel = 'expired'
  ) THEN
    ALTER TYPE public.document_status ADD VALUE 'expired';
  END IF;
END $$;

DO $$ BEGIN
  CREATE TYPE public.document_esignature_status AS ENUM ('pending', 'signed', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type document_type NOT NULL DEFAULT 'other',
  description TEXT,
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.auto_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  content TEXT,
  file_path TEXT,
  file_name TEXT,
  format document_format,
  file_size BIGINT,
  change_summary TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.auto_documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit', 'comment', 'share')),
  shared_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.document_esignatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.auto_documents(id) ON DELETE CASCADE,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status document_esignature_status NOT NULL DEFAULT 'pending',
  signed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reminder_count INTEGER NOT NULL DEFAULT 0,
  last_reminder_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign key to templates on auto_documents.template_id (if missing).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'auto_documents'
      AND constraint_name = 'auto_documents_template_id_fkey'
  ) THEN
    ALTER TABLE public.auto_documents
    ADD CONSTRAINT auto_documents_template_id_fkey
      FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_document_templates_created_by ON public.document_templates(created_by);
CREATE INDEX IF NOT EXISTS idx_document_templates_is_public ON public.document_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON public.document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_document_id ON public.document_permissions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_permissions_user_id ON public.document_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_document_esignatures_document_id ON public.document_esignatures(document_id);
CREATE INDEX IF NOT EXISTS idx_document_esignatures_status ON public.document_esignatures(status);
CREATE INDEX IF NOT EXISTS idx_document_esignatures_recipient_email ON public.document_esignatures(recipient_email);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'auto_documents'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_documents;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'document_templates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.document_templates;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'document_esignatures'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.document_esignatures;
  END IF;
END $$;

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_esignatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view document templates" ON public.document_templates;
CREATE POLICY "Users can view document templates"
  ON public.document_templates FOR SELECT
  USING (created_by = auth.uid() OR is_public = true);

DROP POLICY IF EXISTS "Users can create document templates" ON public.document_templates;
CREATE POLICY "Users can create document templates"
  ON public.document_templates FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update own document templates" ON public.document_templates;
CREATE POLICY "Users can update own document templates"
  ON public.document_templates FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can delete own document templates" ON public.document_templates;
CREATE POLICY "Users can delete own document templates"
  ON public.document_templates FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view document versions" ON public.document_versions;
CREATE POLICY "Users can view document versions"
  ON public.document_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_versions.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create document versions" ON public.document_versions;
CREATE POLICY "Users can create document versions"
  ON public.document_versions FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_versions.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view document permissions" ON public.document_permissions;
CREATE POLICY "Users can view document permissions"
  ON public.document_permissions FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_permissions.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Document owners can manage permissions" ON public.document_permissions;
CREATE POLICY "Document owners can manage permissions"
  ON public.document_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_permissions.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_permissions.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view document esignatures" ON public.document_esignatures;
CREATE POLICY "Users can view document esignatures"
  ON public.document_esignatures FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_esignatures.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create document esignatures" ON public.document_esignatures;
CREATE POLICY "Users can create document esignatures"
  ON public.document_esignatures FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_esignatures.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can update document esignatures" ON public.document_esignatures;
CREATE POLICY "Users can update document esignatures"
  ON public.document_esignatures FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_esignatures.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_esignatures.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can delete document esignatures" ON public.document_esignatures;
CREATE POLICY "Users can delete document esignatures"
  ON public.document_esignatures FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.auto_documents d
      WHERE d.id = document_esignatures.document_id
        AND (d.owner_id = auth.uid() OR d.created_by = auth.uid())
    )
  );

DROP TRIGGER IF EXISTS update_auto_documents_updated_at ON public.auto_documents;
CREATE TRIGGER update_auto_documents_updated_at
  BEFORE UPDATE ON public.auto_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_templates_updated_at ON public.document_templates;
CREATE TRIGGER update_document_templates_updated_at
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_esignatures_updated_at ON public.document_esignatures;
CREATE TRIGGER update_document_esignatures_updated_at
  BEFORE UPDATE ON public.document_esignatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
