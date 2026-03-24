-- Enable pg_cron if not enabled (Note: Supabase manages this, but safe to include)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Daily Reset (Midnight)
SELECT cron.schedule('reset-daily-usage', '0 0 * * *', $$
  UPDATE usage_tracking 
  SET current_count = 0, period_start = now() 
  WHERE resource_type IN (SELECT resource_type FROM plan_limits WHERE period = 'daily')
$$);

-- Monthly Reset (1st of the month at midnight)
SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', $$
  UPDATE usage_tracking 
  SET current_count = 0, period_start = now() 
  WHERE resource_type IN (SELECT resource_type FROM plan_limits WHERE period = 'monthly')
$$);
