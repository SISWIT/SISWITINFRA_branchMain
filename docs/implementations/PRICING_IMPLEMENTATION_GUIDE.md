# SISWIT — Pricing Model Implementation

# Guide

```
Author: Solanki Date: March 2026 Project: SISWIT Platform Status: Ready for Implementation
```
## 1. Overview — Solanki

## What Is Being Built

```
SISWIT is a multi-tenant SaaS platform with 5 business modules: CRM , CPQ , CLM , ERP , and Documents. Currently, module access is gated by boolean flags on
organization_subscriptions (module_crm, module_cpq, etc.), but there are no usage limits enforced within each module. A Foundation CRM plan user can create
unlimited quotes, unlimited contracts, unlimited documents — the same as an Enterprise Governance user.
```
```
This guide implements a complete usage-based pricing model that:
```
```
1. Defines numeric limits per plan (Foundation CRM / Revenue Growth / Commercial Control / Enterprise Governance) for every resource type (contacts, quotes, contracts,
documents, storage, etc.)
2. Tracks real-time usage per organization in the database
3. Enforces limits at the mutation layer (React hooks) before Supabase calls
4. Displays usage meters on the Plans page
5. Shows warning banners when approaching limits and blocks creation when limits are exceeded
6. Offers add-on packs for organizations that need more capacity without upgrading
```
## How Pricing Connects to Existing Codebase

```
The pricing model integrates at three layers:
```
##### ┌─────────────────────────────────────────────────┐

│ UI Layer │
│ OrganizationPlansPage.tsx → usage meters │
│ plan-limit-banner.tsx → warning/blocked banners │
│ upgrade-prompt.tsx → upgrade modal │
├─────────────────────────────────────────────────┤
│ Hook Layer │
│ usePlanLimits.ts → limit-checking hook │
│ useCPQ.ts / useCLM.ts / useDocuments.ts │
│ → pre-mutation limit checks │
├─────────────────────────────────────────────────┤
│ Database Layer │
│ plan_limits table → per-org limits │
│ usage_tracking table → per-org counts │
│ RPC increment/decrement functions │
│ RLS policies on new tables │
└─────────────────────────────────────────────────┘

## What Was Already Done

```
From FIXES.md (17 fixes applied):
```
```
Fix 1 : RLS DELETE policy updated to include manager role (migration 031)
Fix 2 : canDelete() frontend aligned with RLS
Fix 3 : Dashboard activity query fixed (start_time → due_date, assigned_to_id → owner_id)
Fix 4 : QSI SELECT policy restored super admin check (migration 032)
Fix 5 : Audit logs query uses organization_id instead of tenant_id
Fix 6 : Migrated useTenant() → useOrganization() in dashboard hook
Fix 7 : Invalid "user" role checks replaced with "employee"
Fix 8 : Delete buttons role-gated across 13 pages
Fix 9 : Price field validates against NaN/negative values
Fix 10 : Native confirm() replaced with AlertDialog on 3 pages
Fix 11 : Inactive products toggle added to useProducts() and ProductsPage.tsx
```

```
Fix 12 : Fake active sessions replaced with 0
Fix 13 : Platform dashboard migrated from tenants to organizations
Fix 14 : Background refetch disabled when tab is inactive
Fix 15-17 : Delete buttons role-gated on ERP and Documents pages
```
```
From DEBUG_REPORT.md (18 issues found):
```
```
All Phase 1 blockers (B-01, B-02, B-03) are resolved
Security issue S-01 is resolved (migration 032)
Module bugs M-01, M-03, M-04 are resolved
Code quality C-01, C-02, C-03, C-04 are resolved
UI issues U-01, U-02, U-04 are resolved
Performance P-02 is resolved
```
### What Is Remaining

```
8 implementation tasks for the pricing model (detailed in Section 3).
```
### Plan Comparison Table

#### Resource Foundation CRM( ₹ 799/mo) Revenue Growth( ₹ 1,399/mo) Commercial Control( ₹ 2,299/mo) Enterprise Governance( ₹ 3,799/mo)

#### Modules CRM, CPQ, Documents CRM, CPQ, CLM,Documents CRM, CPQ, CLM, ERPDocuments , CRM, CPQ, CLM, ERPDocuments ,

#### Users 5 25 100 Unlimited

#### Contacts 500 5,000 50,000 Unlimited

#### Accounts 100 1,000 10,000 Unlimited

#### Leads 200 2,000 20,000 Unlimited

#### Opportunities 100 1,000 10,000 Unlimited

#### Products 50 500 5,000 Unlimited

#### Quotes 50/month 500/month 5,000/month Unlimited

#### Contracts — 100 1,000 Unlimited

#### Contract

#### Templates —^20200 Unlimited

#### Documents 100 1,000 10,000 Unlimited

#### Document

#### Templates^10100 1,000 Unlimited

#### Suppliers — — 500 Unlimited

#### Purchase Orders — — 1,000 Unlimited

#### Storage 1 GB 10 GB 100 GB 500 GB

#### API Calls 1,000/day 10,000/day 100,000/day Unlimited

#### E-Signatures 10/month 100/month 1,000/month Unlimited

#### Audit Log

#### Retention 30 days 90 days 365 days 365 days

```
Note: "Unlimited" is implemented as 999999999 in the database, not actual infinity.
```
## 2. What Is Already Done — Solanki

### Every Fix Applied (from FIXES.md)

#### Fix

#### # ID File Changed What Changed

#### 1 B-01 supabase/migrations/031_fix_manager_delete_policy.sql New migration — adds RLS policies on all 17 business tablesmanager to DELETE

#### 2 B-02 src/core/rbac/usePermissions.ts canDelete() now includes owner, admin, manager

#### 3 B-03 src/workspaces/organization_admin/hooks/useOrganizationDashboard.tsActivity query: assigned_to_idstart_time → owner_id → due_date,

#### 4 S-01 supabase/migrations/032_fix_qli_select_policy.sql New migration — restoresapp_is_platform_super_admin on qli_select

#### 5 M-03 src/workspaces/organization_admin/hooks/useOrganizationDashboard.tsAudit logs: .eq('organization_id', ...).eq('tenant_id', ...) →

#### 6 C-02 src/workspaces/organization_admin/hooks/useOrganizationDashboard.tsuseTenant() → useOrganization()

#### 7 C-03/C- 04 src/core/rbac/usePermissions.ts role === 'user'locations) → role === 'employee' (

#### 8 U-01 13 pages across CRM/CPQ/CLM/ERP/Documents Delete buttons wrapped with canDelete() guard


#### Fix

#### # ID File Changed What Changed

#### 9 U-02 src/modules/cpq/pages/ProductsPage.tsx Price validation: NaN/negative check with toasterror

#### 10 U-04 ProductsPage.tsx, QuotesListPage.tsx, DocumentTemplatesPage.tsx confirm() → shadcn AlertDialog

#### 11 M-01 src/modules/cpq/hooks/useCPQ.ts, ProductsPage.tsx useProducts()option; toggle UI added accepts { includeInactive }

#### 12 M-04 src/workspaces/platform/hooks/usePlatformDashboard.ts Fake activeSessions → 0

#### 13 C-01 usePlatformDashboard.ts, PlatformAdminDashboard.tsx tenants → organizations table + UI labels

#### 14 P-02 src/workspaces/platform/hooks/usePlatformDashboard.ts Added refetchIntervalInBackground: false

#### 15 U-01-ERP src/modules/erp/pages/ProcurementPage.tsx Delete button role-gated

#### 16 U-01-ERP src/modules/erp/pages/ProductionPage.tsx Delete button role-gated

#### 17 U-01-DOC src/modules/documents/pages/DocumentTemplatesPage.tsx Delete button role-gated

### Bugs Resolved from DEBUG_REPORT.md

```
All issues from phases 1-5 are resolved:
```
```
B-01, B-02, B-03 — Blockers (RLS delete, canDelete alignment, dashboard columns)
S-01 — Security (QSI SELECT super admin check)
M-01, M-03, M-04 — Module bugs (inactive products, audit logs filter, fake sessions)
C-01, C-02, C-03, C-04 — Code quality (tenants→orgs, useTenant→useOrg, user→employee)
U-01, U-02, U-04 — UI fixes (role-gated deletes, price validation, AlertDialog)
P-02 — Performance (background refetch)
```
### Migrations Already Deployed

#### Migration # File Purpose

#### 002 reset_and_seed.sql Core schema + seed data

#### 003 add_platform_admin.sql Platform admin role

#### 004 fix_rls.sql Initial RLS policies

#### 005 create_user_roles.sql User roles table

#### 006 v2_foundation.sql Orgs, memberships, subscriptions

#### 007 org_native_auth_reset.sql Native auth refactor

#### 008 signup_org_lookup_rpc.sql Organization lookup RPCs

#### 009 auth_signup_rls_fixes.sql Signup RLS fixes

#### 010 restore_public_grants.sql Restore public schema grants

#### 011 fix_organization_select_policy.sql Org select policy fix

#### 012 claim_pending_invitations.sql Auto-claim invitation RPC

#### 013 signup_profile_rpc.sql Profile creation RPC

#### 014 signup_organization_rpc.sql Organization creation RPC

#### 015 hardened_rls_policies.sql Comprehensive RLS hardening

#### 016 add_tenant_to_child_tables.sql Add tenant_id to child tables

#### 017 add_crm_columns.sql CRM-specific columns

#### 018 add_missing_columns.sql General missing columns

#### 019 add_more_missing_columns.sql Additional columns

#### 020 add_missing_rpcs.sql Additional RPCs

#### 021 add_org_id_to_child_tables.sql Add organization_id

#### 022 add_accounts_description_and_financial_reference_type.sqlAccount/financial columns

#### 023 add_soft_delete_to_quote_line_items.sql Soft delete for quote items

#### 024 add_cost_price_to_products.sql Product cost price

#### 025 quote_totals_trigger.sql Auto-recompute quote totals

#### 026 enforce_child_scope_not_null.sql NOT NULL constraints

#### 027 add_missing_clm_documents_columns.sql CLM + Documents columns

#### 028 add_is_public_to_contract_templates.sql Public template flag

#### 029 harden_portal_client_select_policies.sql Portal RLS hardening

#### 030 portal_strict_rls_and_signatures.sql Strict portal + signature policies

#### 031 fix_manager_delete_policy.sql Manager DELETE policy fix

#### 032 fix_qli_select_policy.sql QSI SELECT super admin fix

## 3. What Is Remaining — Full Task List — Solanki

### Task 1 — Migration 033: plan_limits + usage_tracking tables + RLS + RPC — Solanki


```
Author: Solanki Priority:  Critical Estimated Time: 3 hours Depends On: None (first task) Files To Read First:
supabase/migrations/015_hardened_rls_policies.sql, supabase/migrations/030_portal_strict_rls_and_signatures.sql,
src/core/utils/modules.ts Files To Create: supabase/migrations/033_plan_limits_and_usage_tracking.sql Files To Modify: None
```
#### Why This Is Needed

Without database tables to store plan limits and track usage, the frontend has no source of truth. Every limit check would be hardcoded in TypeScript, meaning limits could be
bypassed by directly calling the Supabase API. The database must be the enforcer.

#### Exactly What To Do

```
1. Create the plan_limits table to store per-organization resource limits
2. Create the usage_tracking table to store current counts per organization per resource type
3. Create RLS policies matching the patterns from migration 015
4. Create RPCs to atomically increment/decrement usage and check limits
5. Seed default plan limits for each plan type
```
#### Complete Code


##### -- =============================================================================

##### -- 033 PLAN LIMITS AND USAGE TRACKING

##### -- =============================================================================

-- Creates tables and RPCs for plan-based resource limits and usage tracking.
--
-- Author: Solanki
-- Date: 2026-03-

SET search_path = public, extensions;

-- =============================================================================
-- 1. PLAN LIMITS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.plan_limits (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
resource_type text NOT NULL,
max_allowed bigint NOT NULL DEFAULT 0,
period text DEFAULT 'total', -- 'total' | 'monthly' | 'daily'
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now(),
UNIQUE(organization_id, resource_type)
);

COMMENT ON TABLE public.plan_limits IS 'Per-organization resource limits based on subscription plan';
COMMENT ON COLUMN public.plan_limits.resource_type IS 'Resource identifier: contacts, accounts, leads, opportunities, products, quote
COMMENT ON COLUMN public.plan_limits.period IS 'Limit period: total (lifetime), monthly (resets each month), daily (resets each day)

-- =============================================================================
-- 2. USAGE TRACKING TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.usage_tracking (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
resource_type text NOT NULL,
current_count bigint NOT NULL DEFAULT 0,
period_start timestamptz,
period_end timestamptz,
last_incremented_at timestamptz,
created_at timestamptz NOT NULL DEFAULT now(),
updated_at timestamptz NOT NULL DEFAULT now(),
UNIQUE(organization_id, resource_type)
);

COMMENT ON TABLE public.usage_tracking IS 'Tracks current resource usage per organization';

-- =============================================================================
-- 3. ENABLE RLS
-- =============================================================================

ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. RLS POLICIES — plan_limits
-- =============================================================================

-- SELECT: org members can see their own limits, super admin sees all
CREATE POLICY plan_limits_select ON public.plan_limits
FOR SELECT USING (
public.app_is_platform_super_admin(auth.uid())
OR public.app_user_has_organization_access(organization_id)
);


-- INSERT: super admin or org owner/admin only
CREATE POLICY plan_limits_insert ON public.plan_limits
FOR INSERT WITH CHECK (
public.app_is_platform_super_admin(auth.uid())
OR public._rls_user_can_write_org(
organization_id,
ARRAY['owner','admin']::public.app_role[]
)
);

-- UPDATE: super admin or org owner/admin only
CREATE POLICY plan_limits_update ON public.plan_limits
FOR UPDATE USING (
public.app_is_platform_super_admin(auth.uid())
OR public._rls_user_can_write_org(
organization_id,
ARRAY['owner','admin']::public.app_role[]
)
) WITH CHECK (
public.app_is_platform_super_admin(auth.uid())
OR public._rls_user_can_write_org(
organization_id,
ARRAY['owner','admin']::public.app_role[]
)
);

-- DELETE: super admin only
CREATE POLICY plan_limits_delete ON public.plan_limits
FOR DELETE USING (
public.app_is_platform_super_admin(auth.uid())
);

-- =============================================================================
-- 5. RLS POLICIES — usage_tracking
-- =============================================================================

CREATE POLICY usage_tracking_select ON public.usage_tracking
FOR SELECT USING (
public.app_is_platform_super_admin(auth.uid())
OR public.app_user_has_organization_access(organization_id)
);

CREATE POLICY usage_tracking_insert ON public.usage_tracking
FOR INSERT WITH CHECK (
public.app_is_platform_super_admin(auth.uid())
OR public.app_user_has_organization_access(organization_id)
);

CREATE POLICY usage_tracking_update ON public.usage_tracking
FOR UPDATE USING (
public.app_is_platform_super_admin(auth.uid())
OR public.app_user_has_organization_access(organization_id)
) WITH CHECK (
public.app_is_platform_super_admin(auth.uid())
OR public.app_user_has_organization_access(organization_id)
);

CREATE POLICY usage_tracking_delete ON public.usage_tracking
FOR DELETE USING (
public.app_is_platform_super_admin(auth.uid())
);

-- =============================================================================
-- 6. RPC: check_plan_limit
-- =============================================================================


CREATE OR REPLACE FUNCTION public.check_plan_limit(
p_organization_id uuid,
p_resource_type text
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
v_max_allowed bigint;
v_current_count bigint;
v_period text;
v_allowed boolean;
BEGIN
-- Get the limit for this resource
SELECT max_allowed, period INTO v_max_allowed, v_period
FROM public.plan_limits
WHERE organization_id = p_organization_id
AND resource_type = p_resource_type;

-- If no limit is set, allow (unlimited)
IF v_max_allowed IS NULL THEN
RETURN json_build_object(
'allowed', true,
'current_count', 0,
'max_allowed', 999999999,
'remaining', 999999999
);
END IF;

-- Get current usage
SELECT current_count INTO v_current_count
FROM public.usage_tracking
WHERE organization_id = p_organization_id
AND resource_type = p_resource_type;

v_current_count := COALESCE(v_current_count, 0);
v_allowed := v_current_count < v_max_allowed;

RETURN json_build_object(
'allowed', v_allowed,
'current_count', v_current_count,
'max_allowed', v_max_allowed,
'remaining', GREATEST(0, v_max_allowed - v_current_count)
);
END;
$$;

-- =============================================================================
-- 7. RPC: increment_usage
-- =============================================================================

CREATE OR REPLACE FUNCTION public.increment_usage(
p_organization_id uuid,
p_resource_type text,
p_amount bigint DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
v_max_allowed bigint;
v_current_count bigint;


v_new_count bigint;
BEGIN
-- Get limit
SELECT max_allowed INTO v_max_allowed
FROM public.plan_limits
WHERE organization_id = p_organization_id
AND resource_type = p_resource_type;

-- Get or create usage record
INSERT INTO public.usage_tracking (organization_id, resource_type, current_count, last_incremented_at)
VALUES (p_organization_id, p_resource_type, 0, now())
ON CONFLICT (organization_id, resource_type) DO NOTHING;

SELECT current_count INTO v_current_count
FROM public.usage_tracking
WHERE organization_id = p_organization_id
AND resource_type = p_resource_type
FOR UPDATE;

v_current_count := COALESCE(v_current_count, 0);

-- Check limit (if limit exists)
IF v_max_allowed IS NOT NULL AND v_current_count + p_amount > v_max_allowed THEN
RETURN json_build_object(
'success', false,
'error', 'Plan limit exceeded for ' || p_resource_type,
'current_count', v_current_count,
'max_allowed', v_max_allowed
);
END IF;

-- Increment
v_new_count := v_current_count + p_amount;

UPDATE public.usage_tracking
SET current_count = v_new_count,
last_incremented_at = now(),
updated_at = now()
WHERE organization_id = p_organization_id
AND resource_type = p_resource_type;

RETURN json_build_object(
'success', true,
'current_count', v_new_count,
'max_allowed', COALESCE(v_max_allowed, 999999999)
);
END;
$$;

-- =============================================================================
-- 8. RPC: decrement_usage
-- =============================================================================

CREATE OR REPLACE FUNCTION public.decrement_usage(
p_organization_id uuid,
p_resource_type text,
p_amount bigint DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
UPDATE public.usage_tracking
SET current_count = GREATEST(0, current_count - p_amount),
updated_at = now()


WHERE organization_id = p_organization_id
AND resource_type = p_resource_type;
END;
$$;

-- =============================================================================
-- 9. RPC: get_organization_usage
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_organization_usage(
p_organization_id uuid
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
v_result json;
BEGIN
SELECT json_object_agg(
ut.resource_type,
json_build_object(
'current_count', ut.current_count,
'max_allowed', COALESCE(pl.max_allowed, 999999999),
'period', COALESCE(pl.period, 'total'),
'usage_percent', CASE
WHEN COALESCE(pl.max_allowed, 999999999) = 0 THEN 0
ELSE ROUND((ut.current_count::numeric / COALESCE(pl.max_allowed, 999999999)::numeric) * 100, 1)
END
)
) INTO v_result
FROM public.usage_tracking ut
LEFT JOIN public.plan_limits pl
ON pl.organization_id = ut.organization_id
AND pl.resource_type = ut.resource_type
WHERE ut.organization_id = p_organization_id;

RETURN COALESCE(v_result, '{}'::json);
END;
$$;

-- =============================================================================
-- 10. SEED DEFAULT LIMITS FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION public.seed_plan_limits_for_organization(
p_organization_id uuid,
p_plan_type text DEFAULT 'foundation'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
v_limits jsonb;
BEGIN
-- Define limits per plan
CASE p_plan_type
WHEN 'foundation' THEN
v_limits := '{
"contacts": {"max": 500, "period": "total"},
"accounts": {"max": 100, "period": "total"},
"leads": {"max": 200, "period": "total"},
"opportunities": {"max": 100, "period": "total"},
"products": {"max": 50, "period": "total"},


"quotes": {"max": 50, "period": "monthly"},
"documents": {"max": 100, "period": "total"},
"document_templates": {"max": 10, "period": "total"},
"storage_mb": {"max": 1024, "period": "total"},
"api_calls": {"max": 1000, "period": "daily"},
"esignatures": {"max": 10, "period": "monthly"}
}'::jsonb;
WHEN 'growth' THEN
v_limits := '{
"contacts": {"max": 5000, "period": "total"},
"accounts": {"max": 1000, "period": "total"},
"leads": {"max": 2000, "period": "total"},
"opportunities": {"max": 1000, "period": "total"},
"products": {"max": 500, "period": "total"},
"quotes": {"max": 500, "period": "monthly"},
"contracts": {"max": 100, "period": "total"},
"contract_templates": {"max": 20, "period": "total"},
"documents": {"max": 1000, "period": "total"},
"document_templates": {"max": 100, "period": "total"},
"storage_mb": {"max": 10240, "period": "total"},
"api_calls": {"max": 10000, "period": "daily"},
"esignatures": {"max": 100, "period": "monthly"}
}'::jsonb;
WHEN 'commercial' THEN
v_limits := '{
"contacts": {"max": 50000, "period": "total"},
"accounts": {"max": 10000, "period": "total"},
"leads": {"max": 20000, "period": "total"},
"opportunities": {"max": 10000, "period": "total"},
"products": {"max": 5000, "period": "total"},
"quotes": {"max": 5000, "period": "monthly"},
"contracts": {"max": 1000, "period": "total"},
"contract_templates": {"max": 200, "period": "total"},
"documents": {"max": 10000, "period": "total"},
"document_templates": {"max": 1000, "period": "total"},
"suppliers": {"max": 500, "period": "total"},
"purchase_orders": {"max": 1000, "period": "total"},
"storage_mb": {"max": 102400, "period": "total"},
"api_calls": {"max": 100000, "period": "daily"},
"esignatures": {"max": 1000, "period": "monthly"}
}'::jsonb;
WHEN 'enterprise' THEN
v_limits := '{
"contacts": {"max": 999999999, "period": "total"},
"accounts": {"max": 999999999, "period": "total"},
"leads": {"max": 999999999, "period": "total"},
"opportunities": {"max": 999999999, "period": "total"},
"products": {"max": 999999999, "period": "total"},
"quotes": {"max": 999999999, "period": "monthly"},
"contracts": {"max": 999999999, "period": "total"},
"contract_templates": {"max": 999999999, "period": "total"},
"documents": {"max": 999999999, "period": "total"},
"document_templates": {"max": 999999999, "period": "total"},
"suppliers": {"max": 999999999, "period": "total"},
"purchase_orders": {"max": 999999999, "period": "total"},
"storage_mb": {"max": 512000, "period": "total"},
"api_calls": {"max": 999999999, "period": "daily"},
"esignatures": {"max": 999999999, "period": "monthly"}
}'::jsonb;
ELSE
-- Default to foundation
PERFORM public.seed_plan_limits_for_organization(p_organization_id, 'foundation');
RETURN;
END CASE;

-- Upsert limits


INSERT INTO public.plan_limits (organization_id, resource_type, max_allowed, period)
SELECT
p_organization_id,
key,
(value->>'max')::bigint,
value->>'period'
FROM jsonb_each(v_limits)
ON CONFLICT (organization_id, resource_type)
DO UPDATE SET
max_allowed = EXCLUDED.max_allowed,
period = EXCLUDED.period,
updated_at = now();

-- Initialize usage tracking rows
INSERT INTO public.usage_tracking (organization_id, resource_type, current_count)
SELECT p_organization_id, key, 0
FROM jsonb_each(v_limits)
ON CONFLICT (organization_id, resource_type) DO NOTHING;
END;
$$;

-- =============================================================================
-- 11. GRANT EXECUTE ON RPCs
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.check_plan_limit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_usage(uuid, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_usage(uuid, text, bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_usage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_plan_limits_for_organization(uuid, text) TO authenticated, service_role;

-- Grant table access
GRANT ALL ON public.plan_limits TO authenticated, service_role;
GRANT ALL ON public.usage_tracking TO authenticated, service_role;

#### How To Test

```
1. Run the migration: supabase db push or apply via dashboard SQL editor
2. Call seed_plan_limits_for_organization(org_id, 'foundation') for a test org
3. Verify: SELECT * FROM plan_limits WHERE organization_id = '<org_id>' — should show 11 rows
4. Verify: SELECT * FROM usage_tracking WHERE organization_id = '<org_id>' — should show 11 rows with current_count = 0
5. Test RPC: SELECT check_plan_limit('<org_id>', 'contacts') — should return {"allowed": true, "current_count": 0, "max_allowed": 500,
"remaining": 500}
6. Test RPC: SELECT increment_usage('<org_id>', 'contacts') — should return {"success": true, "current_count": 1, "max_allowed": 500}
7. Test RLS: Log in as employee → SELECT * FROM plan_limits — should only see own org's limits
```
#### Done When

```
plan_limits table exists with RLS enabled
usage_tracking table exists with RLS enabled
All 4 RLS policies exist on each table
check_plan_limit RPC returns correct JSON
increment_usage RPC increments count and blocks when over limit
decrement_usage RPC decrements without going below 0
get_organization_usage RPC returns all usage for an org
seed_plan_limits_for_organization correctly seeds for all 4 plan types
```
### Task 2 — src/core/utils/plan-limits.ts (Types, Constants, Helpers) — Solanki

```
Author: Solanki Priority:  Critical Estimated Time: 2 hours Depends On: Task 1 (migration must exist first for types) Files To Read First: src/core/utils/modules.ts,
src/core/types/organization.ts Files To Create: src/core/utils/plan-limits.ts Files To Modify: None
```
#### Why This Is Needed


The frontend needs TypeScript types, plan limit constants, and helper functions to work with the pricing model. Without this, every file would define its own types and constants,
leading to inconsistency.

#### Exactly What To Do

```
1. Define PlanType, ResourceType, PlanLimitEntry, UsageEntry types
2. Define PLAN_LIMITS constant with all limits for all plans
3. Create helper functions: getLimit(), isUnlimited(), getUsagePercent(), isNearLimit(), isAtLimit(), getUpgradePlanFor()
```
#### Complete Code


// src/core/utils/plan-limits.ts
// Plan limit types, constants, and helper functions for the SISWIT pricing model.
// Author: Solanki

export type PlanType = "foundation" | "growth" | "commercial" | "enterprise";

export type ResourceType =
| "contacts"
| "accounts"
| "leads"
| "opportunities"
| "products"
| "quotes"
| "contracts"
| "contract_templates"
| "documents"
| "document_templates"
| "suppliers"
| "purchase_orders"
| "storage_mb"
| "api_calls"
| "esignatures";

export type LimitPeriod = "total" | "monthly" | "daily";

export interface PlanLimitEntry {
max: number;
period: LimitPeriod;
}

export interface UsageEntry {
current_count: number;
max_allowed: number;
period: LimitPeriod;
usage_percent: number;
}

export interface PlanLimitCheckResult {
allowed: boolean;
current_count: number;
max_allowed: number;
remaining: number;
}

export interface UsageIncrementResult {
success: boolean;
error?: string;
current_count: number;
max_allowed: number;
}

const UNLIMITED = 999999999;

export const PLAN_PRICES: Record<PlanType, number> = {
foundation: 799,
growth: 1399,
commercial: 2299,
enterprise: 3799,
};

export const PLAN_LIMITS: Record<PlanType, Partial<Record<ResourceType, PlanLimitEntry>>> = {
foundation: {
contacts: { max: 500, period: "total" },
accounts: { max: 100, period: "total" },
leads: { max: 200, period: "total" },


opportunities: { max: 100, period: "total" },
products: { max: 50, period: "total" },
quotes: { max: 50, period: "monthly" },
documents: { max: 100, period: "total" },
document_templates: { max: 10, period: "total" },
storage_mb: { max: 1024, period: "total" },
api_calls: { max: 1000, period: "daily" },
esignatures: { max: 10, period: "monthly" },
},
growth: {
contacts: { max: 5000, period: "total" },
accounts: { max: 1000, period: "total" },
leads: { max: 2000, period: "total" },
opportunities: { max: 1000, period: "total" },
products: { max: 500, period: "total" },
quotes: { max: 500, period: "monthly" },
contracts: { max: 100, period: "total" },
contract_templates: { max: 20, period: "total" },
documents: { max: 1000, period: "total" },
document_templates: { max: 100, period: "total" },
storage_mb: { max: 10240, period: "total" },
api_calls: { max: 10000, period: "daily" },
esignatures: { max: 100, period: "monthly" },
},
commercial: {
contacts: { max: 50000, period: "total" },
accounts: { max: 10000, period: "total" },
leads: { max: 20000, period: "total" },
opportunities: { max: 10000, period: "total" },
products: { max: 5000, period: "total" },
quotes: { max: 5000, period: "monthly" },
contracts: { max: 1000, period: "total" },
contract_templates: { max: 200, period: "total" },
documents: { max: 10000, period: "total" },
document_templates: { max: 1000, period: "total" },
suppliers: { max: 500, period: "total" },
purchase_orders: { max: 1000, period: "total" },
storage_mb: { max: 102400, period: "total" },
api_calls: { max: 100000, period: "daily" },
esignatures: { max: 1000, period: "monthly" },
},
enterprise: {
contacts: { max: UNLIMITED, period: "total" },
accounts: { max: UNLIMITED, period: "total" },
leads: { max: UNLIMITED, period: "total" },
opportunities: { max: UNLIMITED, period: "total" },
products: { max: UNLIMITED, period: "total" },
quotes: { max: UNLIMITED, period: "monthly" },
contracts: { max: UNLIMITED, period: "total" },
contract_templates: { max: UNLIMITED, period: "total" },
documents: { max: UNLIMITED, period: "total" },
document_templates: { max: UNLIMITED, period: "total" },
suppliers: { max: UNLIMITED, period: "total" },
purchase_orders: { max: UNLIMITED, period: "total" },
storage_mb: { max: 512000, period: "total" },
api_calls: { max: UNLIMITED, period: "daily" },
esignatures: { max: UNLIMITED, period: "monthly" },
},
};

export function getLimit(plan: PlanType, resource: ResourceType): PlanLimitEntry | null {
return PLAN_LIMITS[plan]?.[resource] ?? null;
}

export function isUnlimited(max: number): boolean {
return max >= UNLIMITED;


##### }

export function getUsagePercent(current: number, max: number): number {
if (isUnlimited(max)) return 0;
if (max <= 0) return 100;
return Math.min(100, Math.round((current / max) * 100));
}

export function isNearLimit(current: number, max: number, thresholdPercent = 80): boolean {
if (isUnlimited(max)) return false;
return getUsagePercent(current, max) >= thresholdPercent;
}

export function isAtLimit(current: number, max: number): boolean {
if (isUnlimited(max)) return false;
return current >= max;
}

export function getUpgradePlanFor(currentPlan: PlanType): PlanType | null {
switch (currentPlan) {
case "foundation":
return "growth";
case "growth":
return "commercial";
case "commercial":
return "enterprise";
case "enterprise":
return null;
}
}

export function formatLimit(max: number): string {
if (isUnlimited(max)) return "Unlimited";
if (max >= 1000) return `${(max / 1000).toFixed(max % 1000 === 0? 0 : 1)}K`;
return max.toString();
}

export function getResourceLabel(resource: ResourceType): string {
const labels: Record<ResourceType, string> = {
contacts: "Contacts",
accounts: "Accounts",
leads: "Leads",
opportunities: "Opportunities",
products: "Products",
quotes: "Quotes",
contracts: "Contracts",
contract_templates: "Contract Templates",
documents: "Documents",
document_templates: "Document Templates",
suppliers: "Suppliers",
purchase_orders: "Purchase Orders",
storage_mb: "Storage (MB)",
api_calls: "API Calls",
esignatures: "E-Signatures",
};
return labels[resource] ?? resource;
}

export const ADD_ONS = {
extra_users_10: {
name: "10 Extra Users",
price: 499,
description: "Add 10 more user seats to your organization",
resource: "users" as const,
amount: 10,
},


```
extra_storage_5gb: {
name: "5 GB Extra Storage",
price: 349,
description: "Add 5 GB of additional file storage",
resource: "storage_mb" as const,
amount: 5120,
},
extra_esignatures_50: {
name: "50 Extra E-Signatures",
price: 699,
description: "Add 50 more e-signature requests per month",
resource: "esignatures" as const,
amount: 50,
},
} as const;
```
```
export type AddOnKey = keyof typeof ADD_ONS;
```
#### How To Test

```
1. Import getLimit('foundation', 'contacts') in a test — should return { max: 500, period: 'total' }
2. isUnlimited(999999999) — should return true
3. isUnlimited(500) — should return false
4. getUsagePercent(400, 500) — should return 80
5. isNearLimit(400, 500) — should return true
6. isAtLimit(500, 500) — should return true
7. formatLimit(999999999) — should return "Unlimited"
8. formatLimit(5000) — should return "5K"
```
#### Done When

```
File exists at src/core/utils/plan-limits.ts
All types are exported
PLAN_LIMITS covers all 4 plans with correct values
All 8 helper functions work correctly
ADD_ONS constant has 3 add-ons
TypeScript compiles without errors
```
### Task 3 — src/core/hooks/usePlanLimits.ts (Full Hook) — Solanki

**Author:** Solanki **Priority:**  Critical **Estimated Time:** 3 hours **Depends On:** Task 1, Task 2 **Files To Read First:** src/core/utils/plan-limits.ts,
src/app/providers/OrganizationProvider.tsx, src/core/hooks/useModuleScope.ts **Files To Create:** src/core/hooks/usePlanLimits.ts **Files To Modify:**
None

#### Why This Is Needed

Module hooks (useCPQ, useCLM, useDocuments) need a single hook to check limits and increment usage. Without this, every module would independently query the database for
limits, duplicating logic.

#### Exactly What To Do

```
1. Create a React hook that fetches plan limits and usage for the current organization
2. Provide checkLimit(resource), incrementUsage(resource), decrementUsage(resource) functions
3. Provide getUsageForResource(resource) for UI display
4. Use React Query for caching, with organization_id in the query key
```
#### Complete Code


// src/core/hooks/usePlanLimits.ts
// React hook for checking and enforcing plan limits.
// Author: Solanki

import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/core/api/client";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import type {
PlanType,
ResourceType,
UsageEntry,
PlanLimitCheckResult,
UsageIncrementResult,
} from "@/core/utils/plan-limits";
import {
isUnlimited,
isNearLimit,
isAtLimit,
getUsagePercent,
getResourceLabel,
formatLimit,
getUpgradePlanFor,
PLAN_LIMITS,
} from "@/core/utils/plan-limits";

interface UsePlanLimitsReturn {
/** Whether the usage data is still loading */
isLoading: boolean;
/** Current plan type for the organization */
planType: PlanType;
/** All usage data keyed by resource type */
usage: Record<string, UsageEntry>;
/** Check if a resource can be created (does not mutate) */
checkLimit: (resource: ResourceType) => Promise<PlanLimitCheckResult>;
/** Increment usage for a resource (call after successful creation) */
incrementUsage: (resource: ResourceType, amount?: number) => Promise<UsageIncrementResult>;
/** Decrement usage for a resource (call after successful deletion) */
decrementUsage: (resource: ResourceType, amount?: number) => Promise<void>;
/** Get current usage info for a resource (from cache) */
getUsageForResource: (resource: ResourceType) => UsageEntry | null;
/** Check if a resource is near its limit (>=80%) */
isResourceNearLimit: (resource: ResourceType) => boolean;
/** Check if a resource is at its limit */
isResourceAtLimit: (resource: ResourceType) => boolean;
/** Refresh usage data */
refreshUsage: () => void;
}

export function usePlanLimits(): UsePlanLimitsReturn {
const { organization, subscription } = useOrganization();
const queryClient = useQueryClient();

const organizationId = organization?.id ?? null;
const planType: PlanType = (subscription?.plan_type as PlanType) ?? (organization?.plan_type as PlanType) ?? "foundation";

// Fetch all usage data for the organization
const { data: usageData, isLoading } = useQuery({
queryKey: ["organization_usage", organizationId],
enabled: !!organizationId,
staleTime: 30_000, // 30 seconds
queryFn: async () => {
if (!organizationId) return {};

const { data, error } = await supabase.rpc("get_organization_usage", {


p_organization_id: organizationId,
});

if (error) {
console.error("Failed to fetch organization usage:", error);
return {};
}

return (data as Record<string, UsageEntry>) ?? {};
},
});

const usage = useMemo(() => usageData ?? {}, [usageData]);

const checkLimit = useCallback(
async (resource: ResourceType): Promise<PlanLimitCheckResult> => {
if (!organizationId) {
return { allowed: false, current_count: 0, max_allowed: 0, remaining: 0 };
}

const { data, error } = await supabase.rpc("check_plan_limit", {
p_organization_id: organizationId,
p_resource_type: resource,
});

if (error) {
console.error("Failed to check plan limit:", error);
// Fail open — allow the operation if we can't check
return { allowed: true, current_count: 0, max_allowed: 999999999, remaining: 999999999 };
}

return data as PlanLimitCheckResult;
},
[organizationId],
);

const incrementUsage = useCallback(
async (resource: ResourceType, amount = 1): Promise<UsageIncrementResult> => {
if (!organizationId) {
return { success: false, error: "No organization", current_count: 0, max_allowed: 0 };
}

const { data, error } = await supabase.rpc("increment_usage", {
p_organization_id: organizationId,
p_resource_type: resource,
p_amount: amount,
});

if (error) {
console.error("Failed to increment usage:", error);
return { success: false, error: error.message, current_count: 0, max_allowed: 0 };
}

// Invalidate cache so UI updates
void queryClient.invalidateQueries({ queryKey: ["organization_usage", organizationId] });

return data as UsageIncrementResult;
},
[organizationId, queryClient],
);

const decrementUsage = useCallback(
async (resource: ResourceType, amount = 1): Promise<void> => {
if (!organizationId) return;

const { error } = await supabase.rpc("decrement_usage", {


p_organization_id: organizationId,
p_resource_type: resource,
p_amount: amount,
});

if (error) {
console.error("Failed to decrement usage:", error);
}

// Invalidate cache so UI updates
void queryClient.invalidateQueries({ queryKey: ["organization_usage", organizationId] });
},
[organizationId, queryClient],
);

const getUsageForResource = useCallback(
(resource: ResourceType): UsageEntry | null => {
const entry = usage[resource];
if (!entry) {
// Fall back to plan defaults
const planLimit = PLAN_LIMITS[planType]?.[resource];
if (planLimit) {
return {
current_count: 0,
max_allowed: planLimit.max,
period: planLimit.period,
usage_percent: 0,
};
}
return null;
}
return entry;
},
[usage, planType],
);

const isResourceNearLimit = useCallback(
(resource: ResourceType): boolean => {
const entry = getUsageForResource(resource);
if (!entry) return false;
return isNearLimit(entry.current_count, entry.max_allowed);
},
[getUsageForResource],
);

const isResourceAtLimit = useCallback(
(resource: ResourceType): boolean => {
const entry = getUsageForResource(resource);
if (!entry) return false;
return isAtLimit(entry.current_count, entry.max_allowed);
},
[getUsageForResource],
);

const refreshUsage = useCallback(() => {
void queryClient.invalidateQueries({ queryKey: ["organization_usage", organizationId] });
}, [organizationId, queryClient]);

return {
isLoading,
planType,
usage,
checkLimit,
incrementUsage,
decrementUsage,
getUsageForResource,


```
isResourceNearLimit,
isResourceAtLimit,
refreshUsage,
};
}
```
#### How To Test

```
1. Render a component that calls usePlanLimits() — should return isLoading: true then false
2. checkLimit('contacts') for a foundation org with 0 contacts — should return { allowed: true, remaining: 500 }
3. Call incrementUsage('contacts') 500 times — checkLimit('contacts') should return { allowed: false }
4. isResourceNearLimit('contacts') when at 400/500 — should return true
5. decrementUsage('contacts') — count should go down by 1
```
#### Done When

```
Hook file exists at src/core/hooks/usePlanLimits.ts
checkLimit queries the database RPC
incrementUsage calls the increment RPC and invalidates cache
decrementUsage calls the decrement RPC and invalidates cache
getUsageForResource falls back to plan defaults when no DB entry
TypeScript compiles without errors
```
### Task 4 — Add Limit Checks to useCPQ.ts, useCLM.ts, useDocuments.ts — Solanki

```
Author: Solanki Priority:  High Estimated Time: 3 hours Depends On: Task 2, Task 3 Files To Read First: src/modules/cpq/hooks/useCPQ.ts,
src/modules/clm/hooks/useCLM.ts, src/modules/documents/hooks/useDocuments.ts, src/core/hooks/usePlanLimits.ts Files To Create: None Files To
Modify: src/modules/cpq/hooks/useCPQ.ts, src/modules/clm/hooks/useCLM.ts, src/modules/documents/hooks/useDocuments.ts
```
#### Why This Is Needed

Without limit checks in the mutation hooks, users can create unlimited resources regardless of their plan. The checks must happen **before** the Supabase insert call to prevent data
from being written and then needing to be rolled back.

#### Exactly What To Do

```
For each create mutation in these 3 hooks:
```
```
1. Import usePlanLimits at the top
2. Call checkLimit(resourceType) before the insert
3. If !allowed, throw an error with a descriptive message
4. After successful insert, call incrementUsage(resourceType)
5. In delete mutations, call decrementUsage(resourceType) after successful deletion
```
#### Changes to src/modules/cpq/hooks/useCPQ.ts

```
Add import at line 16 (after audit import):
```
```
import { usePlanLimits } from "@/core/hooks/usePlanLimits";
```
```
Modify useCreateProduct() (line 103-148) — add limit check before insert:
```

export function useCreateProduct() {
const queryClient = useQueryClient();
const { scope, tenantId, userId } = useModuleScope();
const { checkLimit, incrementUsage } = usePlanLimits();

return useMutation({
mutationFn: async (product: Omit<Partial<Product>, "id" | "created_at" | "updated_at">) => {
// --- PLAN LIMIT CHECK ---
const limitCheck = await checkLimit("products");
if (!limitCheck.allowed) {
throw new Error(
`Product limit reached (${limitCheck.current_count}/${limitCheck.max_allowed}). Please upgrade your plan to create more pro
);
}
// --- END PLAN LIMIT CHECK ---

const payload = buildModuleCreatePayload<ProductInsert>(
{
name: product.name || "",
description: product.description,
category: product.category,
list_price: product.unit_price || 0,
cost_price: product.cost_price,
sku: product.sku || `SKU-${Date.now()}`,
is_active: product.is_active ?? true,
},
scope,
{ ownerColumn: null },
);

const { data, error } = await supabase.from("products").insert(payload).select().single();
if (error) throw error;

// --- INCREMENT USAGE ---
void incrementUsage("products");
// --- END INCREMENT USAGE ---

void safeWriteAuditLog({
action: "product_create",
entityType: "product",
entityId: data.id,
tenantId,
userId,
newValues: data,
});

return {
...data,
unit_price: data.list_price,
} as Product;
},
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["products"] });
toast.success("Product created successfully");
},
onError: (error: unknown) => {
toast.error("Error creating product: " + getErrorMessage(error));
},
});
}

```
Modify useDeleteProduct() (line 201-240) — add decrement after delete:
```

export function useDeleteProduct() {
const queryClient = useQueryClient();
const { scope, tenantId, userId } = useModuleScope();
const { decrementUsage } = usePlanLimits();

return useMutation({
mutationFn: async (id: string) => {
const accessQuery = applyModuleMutationScope(
supabase.from("products").select("id").eq("id", id),
scope,
[],
);
const accessResult = await accessQuery.maybeSingle();
if (accessResult.error || !accessResult.data) {
throw new Error("Product not found or not accessible");
}

const { error: deleteError } = await applyModuleMutationScope(
supabase.from("products").delete().eq("id", id),
scope,
[],
);
if (deleteError) throw deleteError;

// --- DECREMENT USAGE ---
void decrementUsage("products");
// --- END DECREMENT USAGE ---

void safeWriteAuditLog({
action: "product_delete",
entityType: "product",
entityId: id,
tenantId,
userId,
});
},
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["products"] });
toast.success("Product deleted successfully");
},
onError: (error: unknown) => {
toast.error("Error deleting product: " + getErrorMessage(error));
},
});
}

```
Apply the same pattern to useCreateQuote() / useDeleteQuote() with resource "quotes".
```
#### Changes to src/modules/clm/hooks/useCLM.ts

```
Add import at line 18 (after audit import):
```
import { usePlanLimits } from "@/core/hooks/usePlanLimits";

```
Modify useCreateContractTemplate() — add limit check:
```

export function useCreateContractTemplate() {
const queryClient = useQueryClient();
const { scope, tenantId, userId } = useModuleScope();
const { checkLimit, incrementUsage } = usePlanLimits();

return useMutation({
mutationFn: async (template: Omit<Partial<ContractTemplate>, "id" | "created_at" | "updated_at">) => {
// --- PLAN LIMIT CHECK ---
const limitCheck = await checkLimit("contract_templates");
if (!limitCheck.allowed) {
throw new Error(
`Contract template limit reached (${limitCheck.current_count}/${limitCheck.max_allowed}). Please upgrade your plan.`
);
}
// --- END PLAN LIMIT CHECK ---

const payload = buildModuleCreatePayload<ContractTemplateInsert>(
{
name: template.name || "",
type: template.type || "",
content: template.content || "",
is_active: template.is_active ?? true,
is_public: template.is_public ?? false,
},
scope,
{ ownerColumn: "created_by", createdByColumn: "created_by" },
);

const { data, error } = await supabase.from("contract_templates").insert(payload).select().single();
if (error) throw error;

// --- INCREMENT USAGE ---
void incrementUsage("contract_templates");
// --- END INCREMENT USAGE ---

void safeWriteAuditLog({
action: "contract_template_create",
entityType: "contract_template",
entityId: data.id,
tenantId,
userId,
newValues: data,
});

return data as ContractTemplate;
},
onSuccess: () => {
queryClient.invalidateQueries({ queryKey: ["contract_templates"] });
toast.success("Contract template created successfully");
},
onError: (error: unknown) => {
toast.error("Error creating contract template: " + getErrorMessage(error));
},
});
}

```
Apply the same pattern to:
```
```
useCreateContract() with resource "contracts" / useDeleteContract() with decrement
useDeleteContractTemplate() with decrement "contract_templates"
```
#### Changes to src/modules/documents/hooks/useDocuments.ts

```
Add import at line 17 (after module-scope import):
```

```
import { usePlanLimits } from "@/core/hooks/usePlanLimits";
```
```
Modify useCreateDocumentTemplate() — add limit check with resource "document_templates". Modify useCreateAutoDocument() — add limit check with
resource "documents". Modify useDeleteDocumentTemplate() — add decrement "document_templates". Modify useDeleteAutoDocument() — add decrement
"documents".
```
```
The pattern is identical to the CPQ and CLM examples above.
```
#### How To Test

```
1. Set a Foundation CRM org's products limit to 2 via seed_plan_limits_for_organization
2. Create 2 products — both should succeed
3. Try creating a 3rd product — should get toast error "Product limit reached (2/2)"
4. Delete a product — usage should go to 1
5. Create another product — should succeed (now at 2 again)
6. Repeat for quotes, contracts, contract templates, documents, document templates
```
#### Done When

```
All 3 hook files import usePlanLimits
Every useCreate* mutation checks limits before insert
Every useCreate* mutation increments usage after success
Every useDelete* mutation decrements usage after success
Error messages include current count and max allowed
TypeScript compiles without errors
```
### Task 5 — src/ui/plan-limit-banner.tsx (Warning and Blocked States) — Solanki

```
Author: Solanki Priority:  High Estimated Time: 2 hours Depends On: Task 2, Task 3 Files To Read First: src/core/utils/plan-limits.ts,
src/core/hooks/usePlanLimits.ts Files To Create: src/ui/plan-limit-banner.tsx Files To Modify: None
```
#### Why This Is Needed

Users need visual feedback when they are approaching or have reached their plan limits. Without this, they would only discover the limit when they try to create something and get an
error toast — a terrible UX.

#### Exactly What To Do

```
1. Create a banner component that shows two states: warning (near limit, 80%+) and blocked (at limit, 100%)
2. The warning state shows an amber banner with current usage and a "Upgrade" link
3. The blocked state shows a red banner with a message that creation is disabled
4. Accept resource prop and internally use usePlanLimits() to get data
```
#### Complete Code


// src/ui/plan-limit-banner.tsx
// Displays warning/blocked banners when approaching or reaching plan limits.
// Author: Solanki

import { AlertTriangle, Ban, ArrowUpRight } from "lucide-react";
import { usePlanLimits } from "@/core/hooks/usePlanLimits";
import type { ResourceType } from "@/core/utils/plan-limits";
import {
getResourceLabel,
formatLimit,
getUsagePercent,
isUnlimited,
} from "@/core/utils/plan-limits";
import { Button } from "@/ui/shadcn/button";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

interface PlanLimitBannerProps {
resource: ResourceType;
className?: string;
}

export function PlanLimitBanner({ resource, className = "" }: PlanLimitBannerProps) {
const navigate = useNavigate();
const { organization } = useOrganization();
const { getUsageForResource, isResourceNearLimit, isResourceAtLimit } = usePlanLimits();

const usage = getUsageForResource(resource);

if (!usage || isUnlimited(usage.max_allowed)) {
return null;
}

const isBlocked = isResourceAtLimit(resource);
const isWarning = isResourceNearLimit(resource) && !isBlocked;

if (!isWarning && !isBlocked) {
return null;
}

const label = getResourceLabel(resource);
const percent = getUsagePercent(usage.current_count, usage.max_allowed);
const maxFormatted = formatLimit(usage.max_allowed);

const handleUpgrade = () => {
if (organization?.slug) {
navigate("/organization/plans");
}
};

if (isBlocked) {
return (
<div
className={`flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm ${className}
role="alert"
>
<Ban className="h-5 w-5 shrink-0 text-destructive" />
<div className="flex-1">
<p className="font-medium text-destructive">
{label} limit reached ({usage.current_count}/{maxFormatted})
</p>
<p className="mt-0.5 text-xs text-destructive/80">
You cannot create more {label.toLowerCase()} on your current plan. Upgrade to increase your limit.
</p>
</div>


<Button
size="sm"
variant="destructive"
onClick={handleUpgrade}
className="shrink-0"
>
<ArrowUpRight className="mr-1 h-3.5 w-3.5" />
Upgrade Plan
</Button>
</div>
);
}

return (
<div
className={`flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm ${className}`}
role="status"
>
<AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
<div className="flex-1">
<p className="font-medium text-warning">
{label} usage at {percent}% ({usage.current_count}/{maxFormatted})
</p>
<p className="mt-0.5 text-xs text-warning/80">
You are approaching your plan limit. Consider upgrading for more capacity.
</p>
</div>
<Button
size="sm"
variant="outline"
onClick={handleUpgrade}
className="shrink-0 border-warning/50 text-warning hover:bg-warning/10"
>
<ArrowUpRight className="mr-1 h-3.5 w-3.5" />
View Plans
</Button>
</div>
);
}

#### How To Test

```
1. Set a resource limit to 10, set usage to 8 → should show amber warning banner
2. Set usage to 10 → should show red blocked banner
3. Set usage to 5 → should show nothing
4. Enterprise Governance plan (unlimited) → should show nothing
5. Click "Upgrade Plan" → should navigate to /organization/plans
```
#### Done When

```
File exists at src/ui/plan-limit-banner.tsx
Warning state shows at 80%+ usage
Blocked state shows at 100% usage
No banner for unlimited resources
Upgrade button navigates to plans page
TypeScript compiles without errors
```
### Task 6 — src/ui/upgrade-prompt.tsx (Modal with Plan Comparison) — Solanki

```
Author: Solanki Priority:  Medium Estimated Time: 3 hours Depends On: Task 2 Files To Read First: src/core/utils/plan-limits.ts Files To Create:
src/ui/upgrade-prompt.tsx Files To Modify: None
```
#### Why This Is Needed

```
When a user hits a limit, they need to see what upgrading gives them. A modal with side-by-side plan comparison converts limit-blocked users into paying upgraders.
```

#### Exactly What To Do

1. Create a dialog/modal component showing all 4 plans side by side
2. Highlight the recommended upgrade plan
3. Show all limits in a comparison table
4. Include pricing and a "Contact Sales" / "Upgrade" CTA

#### Complete Code


// src/ui/upgrade-prompt.tsx
// Modal dialog showing plan comparison and upgrade options.
// Author: Solanki

import {
Dialog,
DialogContent,
DialogHeader,
DialogTitle,
DialogDescription,
} from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";
import { Badge } from "@/ui/shadcn/badge";
import { Check, X, Crown, ArrowRight } from "lucide-react";
import type { PlanType, ResourceType } from "@/core/utils/plan-limits";
import {
PLAN_LIMITS,
PLAN_PRICES,
formatLimit,
getResourceLabel,
getUpgradePlanFor,
ADD_ONS,
} from "@/core/utils/plan-limits";

interface UpgradePromptProps {
open: boolean;
onOpenChange: (open: boolean) => void;
currentPlan: PlanType;
triggeredByResource?: ResourceType;
}

const ALL_RESOURCES: ResourceType[] = [
"contacts",
"accounts",
"leads",
"opportunities",
"products",
"quotes",
"contracts",
"contract_templates",
"documents",
"document_templates",
"suppliers",
"purchase_orders",
"storage_mb",
"api_calls",
"esignatures",
];

const PLAN_NAMES: Record<PlanType, string> = {
foundation: "Foundation CRM",
growth: "Revenue Growth",
commercial: "Commercial Control",
enterprise: "Enterprise Governance",
};

const PLAN_DESCRIPTIONS: Record<PlanType, string> = {
foundation: "For small teams getting started with CRM and basic sales tools",
growth: "For growing teams that need contract management and more capacity",
commercial: "For large organizations needing full ERP and advanced control",
enterprise: "For enterprises needing unlimited resources and governance",
};

const PLAN_ORDER: PlanType[] = ["foundation", "growth", "commercial", "enterprise"];


export function UpgradePrompt({
open,
onOpenChange,
currentPlan,
triggeredByResource,
}: UpgradePromptProps) {
const recommendedPlan = getUpgradePlanFor(currentPlan);

return (
<Dialog open={open} onOpenChange={onOpenChange}>
<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
<DialogHeader>
<DialogTitle className="text-2xl font-bold">
Upgrade Your Plan
</DialogTitle>
<DialogDescription>
{triggeredByResource
? `You've reached your ${getResourceLabel(triggeredByResource).toLowerCase()} limit. Upgrade to get more.`
: "Compare plans and choose the right one for your team."}
</DialogDescription>
</DialogHeader>

{/* Plan Cards */}
<div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
{PLAN_ORDER.map((plan) => {
const isCurrent = plan === currentPlan;
const isRecommended = plan === recommendedPlan;

return (
<div
key={plan}
className={`relative rounded-xl border-2 p-5 transition-all ${
isRecommended
? "border-primary bg-primary/5 shadow-lg"
: isCurrent
? "border-muted-foreground/30 bg-muted/30"
: "border-border"
}`}
>
{isRecommended && (
<Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
<Crown className="mr-1 h-3 w-3" /> Recommended
</Badge>
)}

<h3 className="text-lg font-semibold capitalize">
{PLAN_NAMES[plan]}
</h3>
<p className="mt-1 text-xs text-muted-foreground">
{PLAN_DESCRIPTIONS[plan]}
</p>

<div className="mt-4">
<span className="text-3xl font-bold">
₹{PLAN_PRICES[plan]}
</span>
<span className="text-sm text-muted-foreground">/month</span>
</div>

<div className="mt-4">
{isCurrent? (
<Button variant="outline" className="w-full" disabled>
Current Plan
</Button>
) : (
<Button


className={`w-full ${isRecommended? "" : "variant-outline"}`}
variant={isRecommended? "default" : "outline"}
onClick={() => onOpenChange(false)}
>
{plan === "enterprise"? "Contact Sales" : "Upgrade"}
<ArrowRight className="ml-1 h-4 w-4" />
</Button>
)}
</div>
</div>
);
})}
</div>

{/* Comparison Table */}
<div className="mt-8">
<h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
Detailed Comparison
</h4>
<div className="overflow-x-auto rounded-lg border">
<table className="w-full text-sm">
<thead>
<tr className="border-b bg-muted/50">
<th className="px-4 py-3 text-left font-medium">Feature</th>
{PLAN_ORDER.map((plan) => (
<th
key={plan}
className={`px-4 py-3 text-center font-medium capitalize ${
plan === currentPlan? "bg-primary/5" : ""
}`}
>
{PLAN_NAMES[plan]}
{plan === currentPlan && (
<span className="ml-1 text-xs text-muted-foreground">
(current)
</span>
)}
</th>
))}
</tr>
</thead>
<tbody>
{ALL_RESOURCES.map((resource) => {
const isTriggered = resource === triggeredByResource;
return (
<tr
key={resource}
className={`border-b ${isTriggered? "bg-warning/5" : ""}`}
>
<td className="px-4 py-2.5 font-medium">
{getResourceLabel(resource)}
{isTriggered && (
<Badge variant="outline" className="ml-2 text-[10px] border-warning text-warning">
Limit hit
</Badge>
)}
</td>
{PLAN_ORDER.map((plan) => {
const limit = PLAN_LIMITS[plan]?.[resource];
return (
<td
key={plan}
className={`px-4 py-2.5 text-center ${
plan === currentPlan? "bg-primary/5" : ""
}`}
>


{limit? (
<span className="font-mono text-xs">
{formatLimit(limit.max)}
{limit.period !== "total" && (
<span className="text-muted-foreground">
/{limit.period === "monthly"? "mo" : "day"}
</span>
)}
</span>
) : (
<X className="mx-auto h-4 w-4 text-muted-foreground/40" />
)}
</td>
);
})}
</tr>
);
})}
{/* Modules row */}
<tr className="border-b bg-muted/30">
<td className="px-4 py-2.5 font-medium">Modules</td>
<td className="px-4 py-2.5 text-center text-xs">CRM, CPQ, Docs</td>
<td className="px-4 py-2.5 text-center text-xs">+ CLM</td>
<td className="px-4 py-2.5 text-center text-xs">+ ERP (All 5)</td>
<td className="px-4 py-2.5 text-center text-xs">All 5 + Governance</td>
</tr>
<tr className="border-b">
<td className="px-4 py-2.5 font-medium">Users</td>
<td className="px-4 py-2.5 text-center font-mono text-xs">5</td>
<td className="px-4 py-2.5 text-center font-mono text-xs">25</td>
<td className="px-4 py-2.5 text-center font-mono text-xs">100</td>
<td className="px-4 py-2.5 text-center font-mono text-xs">Unlimited</td>
</tr>
<tr>
<td className="px-4 py-2.5 font-medium">Audit Log Retention</td>
<td className="px-4 py-2.5 text-center text-xs">30 days</td>
<td className="px-4 py-2.5 text-center text-xs">90 days</td>
<td className="px-4 py-2.5 text-center text-xs">365 days</td>
<td className="px-4 py-2.5 text-center text-xs">365 days</td>
</tr>
</tbody>
</table>
</div>
</div>

{/* Add-ons */}
<div className="mt-6">
<h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
Add-Ons (Available on any plan)
</h4>
<div className="grid gap-3 sm:grid-cols-3">
{Object.values(ADD_ONS).map((addon) => (
<div
key={addon.name}
className="rounded-lg border p-4"
>
<p className="font-medium">{addon.name}</p>
<p className="mt-1 text-xs text-muted-foreground">
{addon.description}
</p>
<p className="mt-2 text-lg font-bold">
${addon.price}
<span className="text-xs font-normal text-muted-foreground">
/month
</span>
</p>


</div>
))}
</div>
</div>
</DialogContent>
</Dialog>
);
}

#### How To Test

```
1. Open the modal with currentPlan="foundation" — Revenue Growth should be marked "Recommended"
2. Open with triggeredByResource="contacts" — Contacts row should be highlighted
3. Enterprise Governance plan — "Upgrade" button should say "Contact Sales"
4. All limits should render correctly in the table
5. Add-ons section should show 3 cards
```
#### Done When

```
File exists at src/ui/upgrade-prompt.tsx
Shows 4 plan cards with pricing
Recommended plan is highlighted
Comparison table shows all resources
Triggered resource is highlighted
Add-ons section shows 3 add-on cards
TypeScript compiles without errors
```
### Task 7 — OrganizationPlansPage.tsx Enhancement — Solanki

```
Author: Solanki Priority:  Medium Estimated Time: 3 hours Depends On: Task 2, Task 3, Task 5, Task 6 Files To Read First:
src/workspaces/organization/pages/OrganizationPlansPage.tsx, src/core/hooks/usePlanLimits.ts Files To Create: None Files To Modify:
src/workspaces/organization/pages/OrganizationPlansPage.tsx
```
#### Why This Is Needed

```
The current Plans page only shows 2 usage rows (Users and Storage) and has disabled "Change Plan" / "Manage Billing" buttons. It needs full usage meters for every resource,
progress bars with color coding, and the add-ons section.
```
#### Exactly What To Do

```
1. Import usePlanLimits and plan-limits utilities
2. Add usage meters for all tracked resources
3. Color-code progress bars: green (<60%), amber (60-80%), red (>80%)
4. Add an add-ons section showing available add-on packs
5. Wire the "Change Plan" button to open the UpgradePrompt modal
```
#### Complete Code


// src/workspaces/organization/pages/OrganizationPlansPage.tsx
// Full replacement with usage meters, progress bars, and add-ons.
// Author: Solanki

import { useState } from "react";
import { Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { useOrganizationOwnerData } from "@/workspaces/organization/hooks/useOrganizationOwnerData";
import { usePlanLimits } from "@/core/hooks/usePlanLimits";
import { UpgradePrompt } from "@/ui/upgrade-prompt";
import type { PlanType, ResourceType } from "@/core/utils/plan-limits";
import {
getResourceLabel,
formatLimit,
isUnlimited,
getUsagePercent,
ADD_ONS,
PLAN_PRICES,
} from "@/core/utils/plan-limits";

function statusBadgeClass(status: string): string {
switch (status) {
case "active":
return "bg-success/15 text-success";
case "trial":
return "bg-info/15 text-info";
case "past_due":
return "bg-warning/15 text-warning";
case "cancelled":
case "suspended":
return "bg-destructive/15 text-destructive";
default:
return "bg-muted text-muted-foreground";
}
}

function progressBarColor(percent: number): string {
if (percent >= 90) return "bg-destructive";
if (percent >= 70) return "bg-warning";
return "bg-primary";
}

interface UsageRowProps {
label: string;
used: number;
limit: number;
unit?: string;
period?: string;
}

function UsageRow({ label, used, limit, unit = "", period }: UsageRowProps) {
if (isUnlimited(limit)) {
return (
<div className="space-y-2">
<div className="flex items-center justify-between text-sm">
<span>{label}</span>
<span className="font-mono text-xs text-muted-foreground">
{used} / Unlimited {unit}
</span>
</div>
<div className="h-2 overflow-hidden rounded-full bg-muted">
<div className="h-full rounded-full bg-primary/30" style={{ width: "5%" }} />
</div>
</div>
);


##### }

const safeLimit = Math.max(1, limit);
const ratio = Math.min(100, Math.round((used / safeLimit) * 100));

return (
<div className="space-y-2">
<div className="flex items-center justify-between text-sm">
<span>
{label}
{period && period !== "total" && (
<span className="ml-1 text-xs text-muted-foreground">
({period === "monthly"? "per month" : "per day"})
</span>
)}
</span>
<span className="font-mono text-xs text-muted-foreground">
{used} / {formatLimit(limit)} {unit}
</span>
</div>
<div className="h-2 overflow-hidden rounded-full bg-muted">
<div
className={`h-full rounded-full transition-all ${progressBarColor(ratio)}`}
style={{ width: `${ratio}%` }}
/>
</div>
</div>
);
}

const TRACKED_RESOURCES: ResourceType[] = [
"contacts",
"accounts",
"leads",
"opportunities",
"products",
"quotes",
"contracts",
"contract_templates",
"documents",
"document_templates",
"esignatures",
"storage_mb",
];

export default function OrganizationPlansPage() {
const { organization, subscription, loading, stats } = useOrganizationOwnerData();
const { getUsageForResource, planType } = usePlanLimits();
const [showUpgrade, setShowUpgrade] = useState(false);

if (loading && !organization) {
return (
<div className="flex min-h-[50vh] items-center justify-center">
<Loader2 className="h-7 w-7 animate-spin text-primary" />
</div>
);
}

if (!organization) {
return (
<section className="org-panel">
<h2 className="text-lg font-semibold">No organization found</h2>
<p className="mt-1 text-sm text-muted-foreground">
Sign in with an organization owner or admin account.
</p>
</section>


##### );

##### }

const modules = [
{ name: "CRM", enabled: Boolean(subscription?.module_crm) },
{ name: "CPQ", enabled: Boolean(subscription?.module_cpq) },
{ name: "CLM", enabled: Boolean(subscription?.module_clm) },
{ name: "ERP", enabled: Boolean(subscription?.module_erp) },
{ name: "Documents", enabled: Boolean(subscription?.module_documents) },
];

const status = subscription?.status ?? organization.status ?? "unknown";
const plan = subscription?.plan_type ?? organization.plan_type ?? "foundation";
const price = PLAN_PRICES[planType] ?? 799;

return (
<div className="space-y-5">
<section>
<h1 className="text-3xl font-semibold tracking-tight">Plans and Billing</h1>
<p className="mt-1 text-sm text-muted-foreground">
Review plan status, usage limits, and available add-ons.
</p>
</section>

<section className="grid gap-4 xl:grid-cols-2">
{/* Plan Info Card */}
<article className="org-panel space-y-4">
<div className="flex items-start justify-between gap-3">
<div>
<p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
Current Plan
</p>
<h2 className="mt-2 text-2xl font-semibold capitalize">{plan}</h2>
<p className="mt-1 text-lg font-bold text-primary">
₹{price}
<span className="text-sm font-normal text-muted-foreground">/month</span>
</p>
</div>
<span
className={`rounded-full px-2 py-1 text-xs font-medium capitalize ${statusBadgeClass(status)}`}
>
{status.replace("_", " ")}
</span>
</div>

<div className="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
<UsageRow label="Users" used={stats.totalMembers} limit={organization?.max_users ?? 1} />
<UsageRow label="Storage" used={0} limit={organization?.max_storage_mb ?? 1024} unit="MB" />
</div>

<div className="flex flex-wrap gap-2">
<Button type="button" onClick={() => setShowUpgrade(true)}>
<ArrowUpRight className="mr-1 h-4 w-4" />
Change Plan
</Button>
<Button type="button" variant="outline" disabled>
Manage Billing (Soon)
</Button>
</div>
</article>

{/* Modules Card */}
<article className="org-panel">
<h2 className="text-lg font-semibold">Enabled Modules</h2>
<p className="mt-1 text-xs text-muted-foreground">
Module access is determined by your subscription plan.


</p>
<div className="mt-4 grid gap-2 sm:grid-cols-2">
{modules.map((module) => (
<div
key={module.name}
className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-3.5 py-3"
>
<span className="text-sm font-medium">{module.name}</span>
<span
className={`rounded-full px-2 py-1 text-xs font-medium ${
module.enabled
? "bg-success/15 text-success"
: "bg-muted text-muted-foreground"
}`}
>
{module.enabled? "Enabled" : "Disabled"}
</span>
</div>
))}
</div>
</article>
</section>

{/* Usage Meters */}
<section className="org-panel">
<h2 className="text-lg font-semibold">Resource Usage</h2>
<p className="mt-1 text-xs text-muted-foreground">
Current usage across all tracked resources.
</p>
<div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
{TRACKED_RESOURCES.map((resource) => {
const entry = getUsageForResource(resource);
if (!entry) return null;
return (
<div key={resource} className="rounded-xl border border-border/70 bg-background/70 p-4">
<UsageRow
label={getResourceLabel(resource)}
used={entry.current_count}
limit={entry.max_allowed}
period={entry.period}
unit={resource === "storage_mb"? "MB" : ""}
/>
</div>
);
})}
</div>
</section>

{/* Add-ons */}
<section className="org-panel">
<h2 className="text-lg font-semibold">Available Add-Ons</h2>
<p className="mt-1 text-xs text-muted-foreground">
Extend your plan with additional capacity.
</p>
<div className="mt-4 grid gap-4 sm:grid-cols-3">
{Object.values(ADD_ONS).map((addon) => (
<div
key={addon.name}
className="rounded-xl border border-border/70 bg-background/70 p-4"
>
<h3 className="font-medium">{addon.name}</h3>
<p className="mt-1 text-xs text-muted-foreground">{addon.description}</p>
<p className="mt-3 text-xl font-bold">
₹{addon.price}
<span className="text-xs font-normal text-muted-foreground">/month</span>
</p>


<Button variant="outline" size="sm" className="mt-3 w-full" disabled>
Add (Coming Soon)
</Button>
</div>
))}
</div>
</section>

{/* Upgrade Modal */}
<UpgradePrompt
open={showUpgrade}
onOpenChange={setShowUpgrade}
currentPlan={planType}
/>
</div>
);
}

#### How To Test

```
1. Navigate to /organization/plans → should see plan info, usage meters, modules, add-ons
2. Usage bars should be green (<60%), amber (60-80%), red (>80%)
3. Click "Change Plan" → should open the UpgradePrompt modal
4. Unlimited resources should show "X / Unlimited" with minimal bar fill
5. Monthly resources should show "(per month)" label
```
#### Done When

```
OrganizationPlansPage.tsx is fully replaced
Usage meters show for all tracked resources
Progress bars are color-coded
Add-ons section displays 3 cards
"Change Plan" button opens UpgradePrompt modal
TypeScript compiles without errors
```
### Task 8 — 3 Remaining Bug Fixes in ProductsPage.tsx — Solanki

```
Author: Solanki Priority:  Medium Estimated Time: 1 hour Depends On: None (can be done independently) Files To Read First:
src/modules/cpq/pages/ProductsPage.tsx, FIXES.md (Fix 9, 10, 11) Files To Create: None Files To Modify: src/modules/cpq/pages/ProductsPage.tsx
```
#### Why This Is Needed

```
These fixes were applied in FIXES.md already but represent the pattern for future similar fixes. This task documents the verification that all 3 fixes remain correctly applied:
```
```
FIX 9 : Price validation against NaN/negative values
FIX 10 : AlertDialog instead of native confirm()
FIX 11 : Inactive products toggle
```
#### Exactly What To Do

```
Verify these 3 fixes are still in place. If working on a fresh branch, ensure these code patterns exist:
```
```
1. Price validation in handleSubmit:
```
const parsedPrice = parseFloat(formUnitPrice || "0");
if (isNaN(parsedPrice) || parsedPrice < 0) {
toast.error("Please enter a valid price");
return;
}

```
2. AlertDialog for delete confirmation:
```
const [productToDelete, setProductToDelete] = useState<Product | null>(null);
// ... AlertDialog component wrapping delete button

```
3. Inactive toggle :
```

```
const [showInactive, setShowInactive] = useState(false);
const { data: products, isLoading } = useProducts({ includeInactive: showInactive });
// ... Switch UI for toggling
```
#### How To Test

```
1. Enter "abc" as price → should show "Please enter a valid price" toast
2. Enter -5 as price → should show "Please enter a valid price" toast
3. Click delete on a product → should show AlertDialog, not browser confirm()
4. Toggle "Show inactive products" → inactive products should appear/disappear
```
#### Done When

```
Price validation catches NaN and negative values
Delete uses AlertDialog (not confirm())
Inactive products toggle works
All 3 fixes verified in the current codebase
```
## 4. Plan Limits Reference Table — Solanki

#### Resource Type PeriodFoundation CRMRevenue GrowthCommercial ControlEnterprise Governance

#### contacts Total 500 5,000 50,000 Unlimited

#### accounts Total 100 1,000 10,000 Unlimited

#### leads Total 200 2,000 20,000 Unlimited

#### opportunities Total 100 1,000 10,000 Unlimited

#### products Total 50 500 5,000 Unlimited

#### quotes Monthly 50 500 5,000 Unlimited

#### contracts Total — 100 1,000 Unlimited

#### contract_templatesTotal — 20 200 Unlimited

#### documents Total 100 1,000 10,000 Unlimited

#### document_templatesTotal 10 100 1,000 Unlimited

#### suppliers Total — — 500 Unlimited

#### purchase_orders Total — — 1,000 Unlimited

#### storage_mb Total 1,024 10,240 102,400 512,000

#### api_calls Daily 1,000 10,000 100,000 Unlimited

#### esignatures Monthly 10 100 1,000 Unlimited

#### Users — 5 25 100 Unlimited

#### Modules — CRM, CPQ, Docs+ CLM + ERP (All 5) All 5

#### Price Monthly₹ 799 ₹1,399 ₹2,299 ₹3,799

#### Audit Retention — 30 days 90 days 365 days 365 days

```
"—" means the resource is not available on that plan (module not included).
```
## 5. Add-Ons Reference — Solanki

#### Add-On Price What It Adds Implementation

#### 10 Extra Users ₹499/month10 additional user seats Update increment the column directlyorganizations.max_users. by +10. No new table needed —

#### 5 GB Extra

#### Storage ₹349/month

#### 5,120 MB additional

#### storage

#### Update plan_limits.max_allowed for storage_mb by +5120 for the

#### organization.

#### 50 Extra E-

#### Signatures ₹699/month

#### 50 more e-signature

#### requests/month

#### Update plan_limits.max_allowed for esignatures by +50 for the

#### organization.

### How To Implement Add-Ons

```
1. When an org purchases an add-on, call supabase.from('plan_limits').update({ max_allowed: currentMax + addon.amount
}).eq('organization_id', orgId).eq('resource_type', addon.resource)
2. For the user seats add-on, also update organizations.max_users
3. Track purchased add-ons in organization_subscriptions.features JSON field (e.g., { "addon_extra_users_10": true, "addon_extra_storage_5gb":
true })
4. On plan downgrade, add-ons should persist unless explicitly cancelled
```

## 6. Database Schema — Solanki

### New Tables

#### plan_limits

#### Column Type Nullable Default Notes

#### id uuid NO gen_random_uuid()Primary key

#### organization_iduuid NO — FK → organizations.id ON DELETE CASCADE

#### resource_type text NO — Resource identifier

#### max_allowed bigint NO 0 Maximum allowed count

#### period text YES 'total' total / monthly / daily

#### created_at timestamptzNO now() —

#### updated_at timestamptzNO now() —

```
Unique constraint: (organization_id, resource_type)
```
#### usage_tracking

#### Column Type Nullable Default Notes

#### id uuid NO gen_random_uuid()Primary key

#### organization_id uuid NO — FK → organizations.id ON DELETE CASCADE

#### resource_type text NO — Resource identifier

#### current_count bigint NO 0 Current usage count

#### period_start timestamptzYES — For monthly/daily reset tracking

#### period_end timestamptzYES — For monthly/daily reset tracking

#### last_incremented_attimestamptzYES — Timestamp of last increment

#### created_at timestamptzNO now() —

#### updated_at timestamptzNO now() —

```
Unique constraint: (organization_id, resource_type)
```
### New RPCs

#### RPC Arguments Returns Purpose

#### check_plan_limit p_organization_id uuid, p_resource_type text json Check if a resource can be created

#### increment_usage p_organization_id uuid, p_resource_type text,p_amount bigint json Atomically increment usage, returns

#### success/error

#### decrement_usage p_organization_id uuid, p_resource_type text,p_amount bigint void Decrement usage (floors at 0)

#### get_organization_usage p_organization_id uuid json Get all usage for an org

#### seed_plan_limits_for_organizationp_organization_id uuid, p_plan_type text void Seed default limits for a plan type

### RLS Policies

```
Each new table gets 4 policies (SELECT, INSERT, UPDATE, DELETE) following the same patterns as migration 015. See Task 1 for the full SQL.
```
## 7. File Structure After Implementation — Solanki

### New Files

```
supabase/migrations/033_plan_limits_and_usage_tracking.sql ← Task 1
src/core/utils/plan-limits.ts ← Task 2
src/core/hooks/usePlanLimits.ts ← Task 3
src/ui/plan-limit-banner.tsx ← Task 5
src/ui/upgrade-prompt.tsx ← Task 6
```
### Modified Files

```
src/modules/cpq/hooks/useCPQ.ts ← Task 4 (limit checks)
src/modules/clm/hooks/useCLM.ts ← Task 4 (limit checks)
src/modules/documents/hooks/useDocuments.ts ← Task 4 (limit checks)
src/workspaces/organization/pages/OrganizationPlansPage.tsx ← Task 7 (full rewrite)
src/modules/cpq/pages/ProductsPage.tsx ← Task 8 (verify fixes)
```

## 8. Deployment Steps — Solanki

```
Execute in this exact order:
```
```
# Step 1: Apply database migration
supabase db push
# OR if using remote: supabase db push --db-url <your-db-url>
# This creates plan_limits, usage_tracking, RPCs, and RLS policies.
```
```
# Step 2: Regenerate TypeScript types (so the new tables appear in Database type)
npm run db:types
```
```
# Step 3: Seed plan limits for all existing organizations
# Run this SQL in the Supabase SQL editor:
# SELECT seed_plan_limits_for_organization(id, COALESCE(plan_type, 'foundation'))
# FROM organizations;
```
```
# Step 4: Build and verify TypeScript compiles
npm run build
```
```
# Step 5: Run dev server and test
npm run dev
```
```
# Step 6: Test each role (manager, admin, owner, employee)
# See Testing Checklist in Section 9
```
```
# Step 7: Deploy to production
npm run build && npm run preview
# OR deploy to your hosting provider
```
```
IMPORTANT: Step 3 (seeding) must be done AFTER Step 1 (migration) but can be done at any time. If you deploy the frontend before seeding, limit checks will fail open
(allow everything) because there are no rows in plan_limits.
```
## 9. Full Testing Checklist — Solanki

#### # Test Case Role Expected Result

#### 1 Create product on Foundation CRM plan (under limit) admin Product created successfully

#### 2 Create product when at limit (50/50) admin Toast error: "Product limit reached"

#### 3 Delete a product when at limit admin Product deleted, usage decrements to 49

#### 4 Create product after deletion (49/50) admin Product created successfully, usage goes to 50

#### 5 Create quote on Foundation CRM plan (under monthly limit)manager Quote created successfully

#### 6 Create quote when at monthly limit (50/50) manager Toast error: "Quote limit reached"

#### 7 Create contract on Foundation CRM plan admin Toast error (CLM not in Foundation CRM plan)

#### 8 Create contract on Revenue Growth plan (under limit) admin Contract created successfully

#### 9 Create document on Foundation CRM plan (under limit) employee Document created successfully

#### 10 Create document template at limit (10/10) admin Toast error: "Document template limit reached"

#### 11 View Plans page as owner owner Usage meters visible for all resources

#### 12 View Plans page — usage at 85% owner Progress bar is amber for that resource

#### 13 View Plans page — usage at 100% owner Progress bar is red for that resource

#### 14 Click "Change Plan" owner UpgradePrompt modal opens

#### 15 View plan-limit-banner on Products page at 80% admin Amber warning banner visible

#### 16 View plan-limit-banner on Products page at 100% admin Red blocked banner visible

#### 17 View plan-limit-banner on Products page at 50% admin No banner shown

#### 18 Enterprise Governance plan — create unlimited resources admin No limit errors, no banners

#### 19 Platform super admin — view any org's plans platform_super_adminCan see all usage data

#### 20 Employee tries to modify plan_limits employee RLS blocks INSERT/UPDATE/DELETE

#### 21 Run check_plan_limit RPC directly authenticated Returns correct JSON

#### 22 Run increment_usage RPC past limit authenticated Returns success: false

#### 23 Run decrement_usage below 0 authenticated Usage stays at 0

#### 24 Verify FIX 9: Enter "abc" price any Toast: "Please enter a valid price"


#### # Test Case Role Expected Result

#### 25 Verify FIX 10: Delete product admin AlertDialog appears

#### 26 Verify FIX 11: Toggle inactive products admin Inactive products appear/disappear

## 10. Rules For Developer — Solanki

### DO NOT

```
1. DO NOT touch existing migrations (001–032). Never modify a deployed migration. Always create new migration files with the next sequential number.
2. DO NOT hardcode limits in frontend components. Always use usePlanLimits() hook or PLAN_LIMITS constant from plan-limits.ts.
3. DO NOT use any type. Use proper TypeScript types from plan-limits.ts.
4. DO NOT skip the limit check before insert. Even if the UI disables the button, the hook must still check — defense in depth.
5. DO NOT use confirm() or globalThis.confirm(). Use shadcn AlertDialog for all confirmation dialogs.
6. DO NOT query tenants view. Always use organizations table.
7. DO NOT use useTenant(). Use useOrganization() instead.
8. DO NOT use the "user" role string anywhere. The correct role is "employee".
9. DO NOT assume all orgs have seeded limits. Always handle the case where plan_limits has no rows for an org (fail open — allow the operation).
10. DO NOT use 999999999 directly in code. Use isUnlimited() helper function.
```
### DO

```
1. DO follow the existing patterns in useCPQ.ts, useCLM.ts, useDocuments.ts for mutations.
2. DO use safeWriteAuditLog() after every mutation (create, update, delete).
3. DO invalidate React Query cache after mutations using queryClient.invalidateQueries().
4. DO use toast.success() and toast.error() for user feedback.
5. DO use applyModuleReadScope() and applyModuleMutationScope() for all Supabase queries.
6. DO run npm run db:types after any migration to regenerate TypeScript types.
7. DO test with all 6 roles : platform_super_admin, owner, admin, manager, employee, client.
8. DO use SECURITY DEFINER on RPCs that need to bypass RLS for cross-table operations.
9. DO document every new file with a comment header including author and purpose.
10. DO add "— Solanki" suffix to section headings in documentation files.
```
### File Naming Conventions

```
Migrations: 033_descriptive_name.sql (snake_case, sequential number)
Hooks: use[Feature].ts (camelCase, starts with use)
Components: [feature-name].tsx (kebab-case)
Types/Utils: [feature-name].ts (kebab-case)
```
### Import Conventions

```
Use @/ path alias for all imports (maps to ./src)
Import types with import type { ... } syntax
Group imports: external libs → core → modules → ui
```
```
End of PRICING_IMPLEMENTATION_GUIDE.md — Solanki
```

