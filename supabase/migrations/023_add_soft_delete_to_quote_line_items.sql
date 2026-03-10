-- ============================================================================
-- Migration 023: Add soft-delete columns to quote_line_items
-- ============================================================================

ALTER TABLE public.quote_line_items
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_quote_line_items_deleted_at
  ON public.quote_line_items(deleted_at);
