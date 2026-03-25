-- Migration 051: Update Plan Names
-- Description: Update starter -> foundation, professional -> growth and update constraints

-- 1. Update organizations table
ALTER TABLE public.organizations DROP CONSTRAINT IF EXISTS organizations_plan_type_check;
UPDATE public.organizations SET plan_type = 'foundation' WHERE plan_type = 'starter';
UPDATE public.organizations SET plan_type = 'growth' WHERE plan_type = 'professional';
ALTER TABLE public.organizations ADD CONSTRAINT organizations_plan_type_check 
  CHECK (plan_type IN ('foundation', 'growth', 'enterprise', 'commercial'));

-- 2. Update organization_subscriptions table
ALTER TABLE public.organization_subscriptions DROP CONSTRAINT IF EXISTS organization_subscriptions_plan_type_check;
UPDATE public.organization_subscriptions SET plan_type = 'foundation' WHERE plan_type = 'starter';
UPDATE public.organization_subscriptions SET plan_type = 'growth' WHERE plan_type = 'professional';
ALTER TABLE public.organization_subscriptions ADD CONSTRAINT organization_subscriptions_plan_type_check 
  CHECK (plan_type IN ('foundation', 'growth', 'enterprise', 'commercial'));
