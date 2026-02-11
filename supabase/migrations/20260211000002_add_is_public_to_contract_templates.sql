-- Add is_public column to contract_templates
-- This allows templates to be shared or private

ALTER TABLE public.contract_templates ADD COLUMN is_public BOOLEAN DEFAULT false;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_is_public ON public.contract_templates(is_public);
