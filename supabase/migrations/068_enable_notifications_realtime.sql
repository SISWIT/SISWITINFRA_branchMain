-- =========================================================================
-- 068: Enable Realtime for Notifications Table
-- =========================================================================
-- The Supabase realtime functionality requires a table to be explicitly
-- added to the `supabase_realtime` publication for WebSockets to receive
-- INSERT/UPDATE/DELETE events.

DO $$
BEGIN
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
