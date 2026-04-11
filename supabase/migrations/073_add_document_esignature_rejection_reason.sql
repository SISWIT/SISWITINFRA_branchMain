-- Add missing rejection reason field for document e-signatures.
-- Some UI flows already write/read this field during reject actions.

ALTER TABLE public.document_esignatures
ADD COLUMN IF NOT EXISTS rejection_reason text;
