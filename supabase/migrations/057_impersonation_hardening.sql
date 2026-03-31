-- Phase 7: Impersonation sessions hardening

-- Add foreign key constraint to platform_super_admin_user_id so that we can join on it
ALTER TABLE public.impersonation_sessions
  ADD CONSTRAINT impersonation_sessions_admin_user_id_fkey 
  FOREIGN KEY (platform_super_admin_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- We already have started_at and ended_at
-- Add source_ip and user_agent for audit tracking
ALTER TABLE public.impersonation_sessions
  ADD COLUMN IF NOT EXISTS source_ip text,
  ADD COLUMN IF NOT EXISTS user_agent text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- Add index on active sessions for better querying
CREATE INDEX IF NOT EXISTS idx_impersonation_sessions_active 
  ON public.impersonation_sessions (started_at DESC) 
  WHERE ended_at IS NULL;
