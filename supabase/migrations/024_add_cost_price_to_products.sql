-- ============================================================================
-- Migration 024: Add cost_price column to products
-- ============================================================================

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price numeric(15,2);

-- Backfill from legacy cost column where available.
UPDATE public.products
SET cost_price = cost
WHERE cost_price IS NULL
  AND cost IS NOT NULL;
