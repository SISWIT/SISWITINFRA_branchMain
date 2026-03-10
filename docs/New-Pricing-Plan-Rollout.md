# SISWIT New Pricing Plan Rollout (No Payment Gateway Yet)

Date: 2026-03-10  
Source of truth: `C:\Users\Acer\Desktop\SISWIT\Final Pricing For SISWIT.pdf`

## Goal
Implement the new 4-tier pricing model in product behavior (feature access + limits), even before payment integration is built.

## New Plan Model (from PDF)

| Plan Key | Display Name | Price (INR/user/month) | Module Direction | Core Limits |
|---|---|---:|---|---|
| `foundation` | Foundation CRM | 799 | CRM + Documents only | pipelines `1`, custom fields `5`, workflows `5`, docs/month `20`, integrations `0`, storage `5GB`, min users `3` |
| `revenue_growth` | Revenue Growth | 1399 | Foundation + CPQ Lite + integrations | pricing rules `50`, quotes/month `200`, workflows `25`, docs/month `200`, integrations `1`, storage `15GB`, min users `5` |
| `commercial_control` | Commercial Control | 2299 | Growth + Advanced CPQ + CLM Basic | workflows `100`, integrations `3`, storage `40GB`, contracts stored `5000`, min users `10` |
| `enterprise_governance` | Enterprise Governance | 3799 | Commercial + CLM Advanced + security/governance | unlimited workflows/docs/integrations/storage up to `100GB`, min users `20` |

Add-ons (later billing stage): storage top-up, ERP connector, AI pricing assistant, implementation services.

## Why Starter Feels Broken Today

Current codebase gaps:

1. Only 3 plan names exist (`starter`, `professional`, `enterprise`) in both DB checks and TS types.
2. Signup RPC hardcodes `starter` + module flags; it cannot assign the new 4 plans.
3. No centralized limit enforcement exists (pipelines, docs/month, quotes/month, integrations, etc.).
4. `subscription.features` defaults to `{}` and there is no seeded entitlement payload.
5. Website pricing page is static and still shows old plan structure.
6. Product usage UI shows limits (`max_users`, `max_storage_mb`) but most module actions are not blocked by quota checks.

## No-Payment Strategy (Recommended Right Now)

Until payment is integrated:

1. Every new organization starts on `foundation` (status `trial`).
2. Plan upgrades are manual (platform admin action or SQL/RPC), not user self-serve checkout.
3. Entitlements and usage limits must still be enforced in-app now, so behavior matches upcoming paid tiers.
4. Keep billing status simple: `trial`, `active`, `past_due`, `cancelled`, but treat `past_due` as manual admin state for now.

## Implementation Plan

### Phase 1: Schema + Plan Catalog (mandatory first)

Create migration(s) to:

1. Expand/replace plan constraints in:
   - `organizations.plan_type`
   - `organization_subscriptions.plan_type`
2. Add canonical plan tables:
   - `pricing_plans` (`key`, `display_name`, `price_inr`, `is_active`, `sort_order`)
   - `plan_entitlements` (`plan_key`, `entitlements_json`)
3. Add usage tracking table:
   - `organization_usage_counters` (`organization_id`, `month_key`, `quotes_created`, `docs_generated`, `integrations_connected`, `workflows_created`, ...)
4. Backfill mapping:
   - `starter -> foundation`
   - `professional -> revenue_growth`
   - `enterprise -> enterprise_governance` (or map with business confirmation)

### Phase 2: Signup + Plan Assignment

Update organization creation flow:

1. `create_signup_organization` RPC should insert `foundation` instead of `starter`.
2. Seed `features` (or `entitlements_json`) with real limits, not `{}`.
3. Set organization-level caps from plan (at least `max_users`, `max_storage_mb`) on create/update.
4. Add admin-only RPC/API for manual plan change:
   - input: `organization_id`, `new_plan_key`, `effective_at`, `note`
   - output: updated subscription + audit record

### Phase 3: Centralized Entitlement Engine

Add one reusable check path (frontend + backend):

1. `getOrganizationEntitlements(orgId)` -> merged entitlement object.
2. `assertPlanCapability(orgId, capabilityKey)` -> allow/deny.
3. `assertPlanLimit(orgId, limitKey, nextCount)` -> allow/deny with clear error.

Do not scatter hardcoded `if plan === ...` checks across modules.

### Phase 4: Wire Limits to Real Actions

Enforce on create/update operations:

1. CRM:
   - pipeline create limit
   - workflow create limit
   - custom field limit
2. CPQ:
   - quote creation monthly limit
   - pricing rules limit
   - products per quote limit
3. Documents:
   - templates limit
   - docs/month limit
4. CLM:
   - contracts stored limit (Commercial and above)
5. Integrations:
   - connected integrations count
6. Organization seats:
   - block invites/member activation beyond min/max rules decided by business

### Phase 5: UI + API Updates

Update these surfaces to consume live plan config:

1. Public pricing page (`/pricing`) from plan catalog API/table.
2. Organization Plans page to show:
   - current plan
   - limit usage bars from counters
   - blocked reason messages
3. Platform admin billing panel to:
   - manually change plan
   - view over-limit orgs
   - review entitlement payload

## Files/Areas to Change When Implementing

Database/RPC:
- `supabase/migrations/007_org_native_auth_reset.sql` (or newer migration override)
- `supabase/migrations/014_signup_organization_rpc.sql`
- new migration for pricing catalog + entitlements + counters

Types/Providers:
- `src/core/types/organization.ts`
- `src/core/types/tenant.ts`
- `src/app/providers/OrganizationProvider.tsx`
- `src/app/providers/TenantProvider.tsx`

Permissions/Gating:
- `src/core/rbac/usePermissions.ts`
- shared entitlement utility/service (new file)
- module hooks where create actions happen (CRM/CPQ/Documents/CLM/Integrations)

UI:
- `src/workspaces/website/pages/Pricing.tsx`
- `src/workspaces/organization/pages/OrganizationPlansPage.tsx`
- `src/workspaces/platform/pages/panels/BillingPanel.tsx`

## Immediate Stabilization Checklist (Before Full Rollout)

Run this first to stop starter inconsistencies:

1. Ensure each organization has exactly one subscription row.
2. Ensure every subscription has non-empty entitlements JSON.
3. Ensure module booleans are aligned with assigned plan.
4. Ensure signup path and manual org creation path use the same default plan.
5. Add monitoring query for orgs with:
   - missing subscription
   - unknown `plan_type`
   - empty `features`

## Acceptance Criteria

The rollout is done when:

1. New org signup always gets `foundation` entitlements correctly.
2. Manual plan change updates module access and limits immediately.
3. Over-limit actions are blocked with clear user-facing error messages.
4. `/pricing`, org billing page, and platform billing panel show the same plan data source.
5. No path still relies on legacy `starter/professional/enterprise` names.

