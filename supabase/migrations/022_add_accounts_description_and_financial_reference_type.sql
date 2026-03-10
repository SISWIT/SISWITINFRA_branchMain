-- ============================================================================
-- Migration 022: Add missing semantic columns used by app mappings
-- ============================================================================

-- Accounts: add canonical description column and backfill from legacy ownership.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS description text;

UPDATE public.accounts
SET description = ownership
WHERE description IS NULL
  AND ownership IS NOT NULL;

-- Financial records: add reference_type and backfill from legacy status field.
ALTER TABLE public.financial_records
  ADD COLUMN IF NOT EXISTS reference_type text;

UPDATE public.financial_records
SET reference_type = status
WHERE reference_type IS NULL
  AND status IS NOT NULL;
