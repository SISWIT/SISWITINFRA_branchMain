-- Migration 053: Add indices for billing and usage performance

-- Improve membership count queries
CREATE INDEX IF NOT EXISTS idx_organization_memberships_org_id ON public.organization_memberships(organization_id);

-- Improve subscription lookups
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_org_id ON public.organization_subscriptions(organization_id);

-- Improve billing info lookups
CREATE INDEX IF NOT EXISTS idx_organization_billing_org_id ON public.organization_billing(organization_id);

-- Improve usage lookups
-- Note: organization_usage already exists as a table or is handled via RPC, but indices on the underlying tables help.
-- If there's a specific table tracking resource counts, we should index it too.
-- For now, these are the primary ones for the Subscription page.
