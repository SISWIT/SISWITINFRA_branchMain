# Platform Super Admin Implementation Plan

Status: Proposed implementation guide
Date: 2026-03-31
Primary source: `docs/revised_platform_super_admin_architecture.md`
Supporting source: `docs/background-jobs.md`

## 1. Purpose

This document turns the revised platform super admin architecture into an implementation plan that matches the current SISWIT codebase.

It is written against the repository state on 2026-03-31 and focuses on:

- phased delivery
- exact files to change
- new files to create
- database and Edge Function work that should accompany UI work
- code structure rules so the platform area does not become another page-first monolith

## 2. Current Baseline In This Repository

### 2.1 Current platform implementation

The current platform admin workspace already exists, but it is still a light panel-based implementation:

- `src/app/App.tsx`
- `src/workspaces/platform/layout/PlatformAdminLayout.tsx`
- `src/workspaces/platform/layout/ImpersonationBanner.tsx`
- `src/workspaces/platform/pages/PlatformAdminDashboard.tsx`
- `src/workspaces/platform/hooks/usePlatformDashboard.ts`
- `src/workspaces/platform/pages/panels/TenantsPanel.tsx`
- `src/workspaces/platform/pages/panels/UsersPanel.tsx`
- `src/workspaces/platform/pages/panels/BillingPanel.tsx`
- `src/workspaces/platform/pages/panels/AuditLogsPanel.tsx`
- `src/workspaces/platform/pages/panels/SettingsPanel.tsx`

Current platform routes:

- `/platform`
- `/platform/tenants`
- `/platform/users`
- `/platform/billing`
- `/platform/settings`
- `/platform/audit-logs`

### 2.2 Current data model

The repo already has the canonical organization-based model:

- `platform_super_admins`
- `organizations`
- `organization_memberships`
- `organization_subscriptions`
- `audit_logs`
- `impersonation_sessions`
- `background_jobs`
- `billing_customers`
- `plan_limits`
- `usage_tracking`

The repo also keeps legacy compatibility views that should not be the long-term base for new platform work:

- `platform_admins`
- `tenants`
- `tenant_users`
- `tenant_subscriptions`

These compatibility views are created in `supabase/migrations/007_org_native_auth_reset.sql` and appear in generated types under `src/core/api/types.ts`.

### 2.3 Existing support utilities worth reusing

- `src/core/utils/audit.ts`
- `src/core/utils/jobs.ts`
- `src/core/utils/plan-limits.ts`
- `src/core/utils/modules.ts`
- `src/app/providers/AuthProvider.tsx`
- `src/app/providers/OrganizationProvider.tsx`
- `src/app/providers/TenantProvider.tsx`
- `src/app/providers/ImpersonationProvider.tsx`
- `src/core/auth/components/ProtectedRoute.tsx`
- `src/core/auth/components/TenantSlugGuard.tsx`

## 3. High Priority Gaps To Fix Before Expanding Features

These are important because they directly conflict with the revised architecture.

### 3.1 Platform code still mixes tenant-era naming with organization-era data

Examples:

- `src/workspaces/platform/pages/panels/TenantsPanel.tsx`
- `src/workspaces/platform/pages/panels/UsersPanel.tsx`
- `src/workspaces/platform/pages/panels/BillingPanel.tsx`
- `src/app/providers/TenantProvider.tsx`

Implementation rule:

- new platform code should read from canonical `organizations`, `organization_memberships`, and `organization_subscriptions`
- compatibility views should only remain as temporary bridges for older workspace code

### 3.2 Platform admins can still reach tenant routes too easily

Problem files:

- `src/core/auth/components/ProtectedRoute.tsx`
- `src/core/auth/components/TenantSlugGuard.tsx`
- `src/workspaces/platform/pages/PlatformAdminDashboard.tsx`
- `src/workspaces/platform/pages/panels/TenantsPanel.tsx`

Current issue:

- `TenantAdminRoute` still allows platform admins straight through
- `TenantSlugGuard` auto-starts impersonation from route context
- dashboard and tenant cards link directly to `/:slug/app/dashboard`

Revised behavior:

- platform admins should stay inside `/platform/*` by default
- impersonation must be explicit
- impersonation should require reason capture
- tenant workspace access should happen only through an active impersonation session

### 3.3 Current impersonation write payload does not match the canonical table

Problem file:

- `src/app/providers/ImpersonationProvider.tsx`

Current mismatch:

- code writes `platform_admin_user_id`
- canonical table uses `platform_super_admin_user_id`
- code writes only `tenant_id` and `tenant_slug`
- canonical table requires `organization_id` and `organization_slug`

This should be fixed before platform detail pages depend on impersonation flows.

### 3.4 Platform dashboard metrics are still client-computed

Problem file:

- `src/workspaces/platform/hooks/usePlatformDashboard.ts`

Current issue:

- MRR is estimated in the frontend with hard-coded prices
- page-level data access is not domain-owned
- no backend contract defines metric ownership

Revised behavior:

- platform metrics should come from a trusted backend contract
- UI renders metrics, but does not define finance logic

### 3.5 Background job compatibility needs one correction

Problem file:

- `scripts/enqueue-contract-expiry-alerts.mjs`

Current issue:

- `background_jobs` requires `organization_id`
- the enqueue script currently inserts only `tenant_id`

This should be corrected before the future `/platform/health` page uses job data as an operational source of truth.

## 4. Implementation Rules

### 4.1 Use canonical data names in new code

Follow these names in new platform domain files:

- `organization`
- `organizationId`
- `organizationSlug`
- `subscription`
- `membership`
- `platformSuperAdmin`

Do not create new platform domain files around `tenant_*` naming.

### 4.2 Keep pages thin

Page files should only do these jobs:

- read route params
- wire filters and query params
- call domain hooks
- render shared and domain UI components

Page files should not:

- build Supabase queries inline
- calculate finance metrics
- perform dangerous mutations directly

### 4.3 Split domain code by responsibility

Use this pattern inside each domain:

```text
domains/<domain>/
  api/        -> read contracts and query builders
  hooks/      -> React Query hooks
  services/   -> dangerous actions and Edge Function callers
  components/ -> domain UI
  tables/     -> table column definitions and row actions
  types.ts    -> domain-owned types
```

### 4.4 Prefer Edge Functions for dangerous platform mutations

This repo does not have a separate Node backend app. The safest backend layer available in-repo is Supabase Edge Functions plus secured SQL/RPC.

Use Edge Functions for:

- organization suspend/reactivate/cancel/delete
- user suspend/reactivate/role change
- impersonation start/stop if step-up auth is required
- exports
- plan and module changes that affect entitlements

### 4.5 Use typed query access

Prefer:

- `typedFrom(...)`
- typed `supabase.rpc(...)`
- domain hook wrappers

Avoid new platform code that depends on broad `unknown` casts unless absolutely necessary.

### 4.6 Keep compatibility shims during migration

Do not move everything in one PR.

During migration:

- keep old layout/page files as re-export wrappers if needed
- keep legacy route aliases redirecting to canonical platform routes
- move call sites gradually

## 5. Target Platform File Structure

```text
src/workspaces/platform/
  app/
    PlatformAdminLayout.tsx
    PlatformSidebar.tsx
    PlatformTopbar.tsx
    PlatformRouteGuard.tsx
    PlatformAdminRoutes.tsx
  domains/
    organizations/
      api/
      hooks/
      services/
      components/
      tables/
      types.ts
    users/
      api/
      hooks/
      services/
      components/
      tables/
      types.ts
    subscriptions/
      api/
      hooks/
      services/
      components/
      tables/
      types.ts
    plans/
    modules/
    audit/
    security/
    analytics/
    health/
    settings/
  pages/
    PlatformDashboardPage.tsx
    OrganizationsPage.tsx
    OrganizationDetailPage.tsx
    UsersPage.tsx
    UserDetailPage.tsx
    SubscriptionsPage.tsx
    PlansPage.tsx
    ModulesPage.tsx
    AuditLogsPage.tsx
    SecurityPage.tsx
    HealthPage.tsx
    AnalyticsPage.tsx
    SettingsPage.tsx
  shared/
    auth/
    api/
    components/
    filters/
    tables/
    types/
    utils/
```

## 6. Phased Delivery Plan

### Phase 0: Safety And Naming Alignment

Goal:

- fix the auth and impersonation model first
- stop building new platform work on top of tenant-era shortcuts

### Files to change in Phase 0

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/core/auth/components/ProtectedRoute.tsx` | stop automatic platform access into tenant workspace | change the `TenantAdminRoute` branch marked `S-12`; require active impersonation for platform users instead of returning children immediately |
| `src/core/auth/components/TenantSlugGuard.tsx` | remove automatic impersonation bootstrap from route visit | replace the `useEffect` branch that calls `startImpersonation` for platform users; route guard should validate access, not silently create privileged sessions |
| `src/app/providers/ImpersonationProvider.tsx` | align writes with canonical schema | update the `startImpersonation` insert payload to use `platform_super_admin_user_id`, `organization_id`, `organization_slug`; update stop logic and audit metadata accordingly |
| `src/app/providers/impersonation-context.ts` | align context naming | add canonical `organizationId` and `organizationSlug` fields or rename the current `tenantId` and `tenantSlug` state before new platform pages depend on it |
| `src/app/providers/OrganizationProvider.tsx` | load impersonated organization by canonical ID first | adjust the `fetchOrganizationData` branch that checks impersonation; prefer `organizationId`, then fall back to slug only if necessary |
| `src/workspaces/platform/pages/PlatformAdminDashboard.tsx` | remove direct dashboard impersonation links | replace the direct tenant dashboard link with a controlled impersonation action handler |
| `src/workspaces/platform/pages/panels/TenantsPanel.tsx` | remove direct tenant dashboard jump | replace `Impersonate` link with explicit start-impersonation flow and platform-side detail navigation |
| `src/workspaces/platform/layout/ImpersonationBanner.tsx` | show clearer session context | include organization slug, reason, and strong exit action copy |
| `src/core/utils/audit.ts` | extend audit payload shape for platform actions | add support for correlation id, actor type, and impersonation metadata so platform actions are queryable later |
| `scripts/enqueue-contract-expiry-alerts.mjs` | fix background job inserts | include both `organization_id` and `tenant_id` until the compatibility alias is no longer needed |

### Phase 0 code structure rules

- no new route should auto-create impersonation sessions
- all impersonation entry points must collect a reason
- all platform-originated tenant access must be auditable
- new code should use `organization` naming even if compatibility fields still exist

### Phase 0 acceptance

- platform admin cannot browse tenant workspaces without impersonation
- impersonation session writes succeed against canonical DB columns
- impersonation links now start a controlled flow
- contract expiry alert enqueue script writes valid background job rows

### Phase 1: Platform Shell And Routing Refactor

Goal:

- move from panel-first routing to architecture-aligned platform pages

### Files to create in Phase 1

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/app/PlatformRouteGuard.tsx` | dedicated guard for `/platform/*` with platform capability entry point |
| `src/workspaces/platform/app/PlatformAdminLayout.tsx` | canonical layout shell |
| `src/workspaces/platform/app/PlatformSidebar.tsx` | navigation and route grouping |
| `src/workspaces/platform/app/PlatformTopbar.tsx` | title, session state, quick actions |
| `src/workspaces/platform/app/PlatformAdminRoutes.tsx` | owns platform route tree instead of keeping it inline in `App.tsx` |
| `src/workspaces/platform/pages/PlatformDashboardPage.tsx` | canonical dashboard page |
| `src/workspaces/platform/pages/OrganizationsPage.tsx` | replaces tenant list page |
| `src/workspaces/platform/pages/OrganizationDetailPage.tsx` | new detail page |
| `src/workspaces/platform/pages/UsersPage.tsx` | canonical users page |
| `src/workspaces/platform/pages/UserDetailPage.tsx` | new detail page |
| `src/workspaces/platform/pages/SubscriptionsPage.tsx` | replaces billing panel |
| `src/workspaces/platform/pages/AuditLogsPage.tsx` | canonical audit page |

### Existing files to change in Phase 1

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/app/App.tsx` | replace inline platform panel route definitions | update the platform route block in `AppRoutes`; import `PlatformAdminRoutes`; add canonical routes and keep redirects from `/platform/tenants` to `/platform/organizations` and `/platform/billing` to `/platform/subscriptions` |
| `src/core/utils/routes.ts` | add canonical route helpers | add helpers for organization detail, user detail, subscriptions, plans, modules, audit, security, health, analytics, settings |
| `src/workspaces/platform/layout/PlatformAdminLayout.tsx` | convert old layout into a compatibility wrapper | either re-export the new layout or keep a thin wrapper that imports from `app/PlatformAdminLayout.tsx` |
| `src/workspaces/platform/pages/PlatformAdminDashboard.tsx` | convert old page into wrapper or redirect export | keep this file as a temporary re-export to reduce import churn |

### Phase 1 navigation target

Canonical routes to add:

- `/platform`
- `/platform/organizations`
- `/platform/organizations/:id`
- `/platform/users`
- `/platform/users/:id`
- `/platform/subscriptions`
- `/platform/audit-logs`

Canonical routes to defer until Phase 4:

- `/platform/plans`
- `/platform/modules`
- `/platform/security`
- `/platform/health`
- `/platform/settings`
- `/platform/analytics`

Legacy route redirects to keep temporarily:

- `/platform/tenants` -> `/platform/organizations`
- `/platform/billing` -> `/platform/subscriptions`
- `/platform/logs` -> `/platform/audit-logs`

### Phase 1 code structure rules

- `App.tsx` should delegate platform route ownership to `PlatformAdminRoutes.tsx`
- sidebar menu config should live beside platform shell, not inside one large layout file
- page names should use architecture names: `OrganizationsPage`, `SubscriptionsPage`, `HealthPage`

### Phase 1 acceptance

- platform route tree matches the revised architecture naming
- the old route aliases still work
- old panel files are no longer the long-term source of truth

### Phase 2: Shared Platform Infrastructure And Capability Model

Goal:

- create reusable platform scaffolding before rebuilding each page

### Files to create in Phase 2

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/shared/auth/platform-capabilities.ts` | define `PlatformCapability` type and default capability map |
| `src/workspaces/platform/shared/auth/usePlatformPermissions.ts` | platform-only permission hook |
| `src/workspaces/platform/shared/api/queryKeys.ts` | central query key factory for platform React Query usage |
| `src/workspaces/platform/shared/components/PlatformPageHeader.tsx` | shared page title and action area |
| `src/workspaces/platform/shared/components/PlatformMetricCard.tsx` | reusable summary metric card |
| `src/workspaces/platform/shared/components/PlatformDangerActionDialog.tsx` | destructive action confirmation dialog |
| `src/workspaces/platform/shared/components/PlatformAuditMetadataDialog.tsx` | metadata inspector for audit rows |
| `src/workspaces/platform/shared/components/PlatformFilterBar.tsx` | common search and filter shell |
| `src/workspaces/platform/shared/types/pagination.ts` | shared paginated response types |
| `src/workspaces/platform/shared/utils/normalizePlatformError.ts` | common error formatting for platform workflows |

### Existing files to change in Phase 2

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/core/types/roles.ts` | keep canonical role model but add platform capability support | add exported platform capability types and helper map while keeping legacy normalization only for backward compatibility |
| `src/core/rbac/usePermissions.ts` | stop treating platform admin as a blanket answer to every check | keep tenant permission logic here, but move platform-specific checks into `usePlatformPermissions` |
| `src/core/utils/cache.ts` | optional query defaults | if needed, add platform-friendly stale times for summary endpoints, but do not mix query keys into this file |
| `src/core/api/typed-client.ts` | no structural rewrite needed | continue using this helper for typed table access from platform domain api files |

### Recommended capability shape

Start with a code-based capability map instead of a database table:

```ts
export type PlatformCapability =
  | "platform.organizations.read"
  | "platform.organizations.write"
  | "platform.organizations.suspend"
  | "platform.users.read"
  | "platform.users.write"
  | "platform.billing.read"
  | "platform.billing.write"
  | "platform.audit.read"
  | "platform.security.read"
  | "platform.settings.write"
  | "platform.impersonation.start";
```

Reason:

- there is currently only one real platform role in the repo
- a static capability map keeps implementation smaller in early phases
- the code structure still leaves room for a later `platform_admin_capabilities` table if secondary operators are added

### Phase 2 acceptance

- platform pages use a dedicated permission hook
- shared tables, dialogs, and query keys exist
- platform code no longer depends on ad hoc `useEffect` fetch logic in page files

### Phase 3: Core Phase 1 Pages

Goal:

- deliver the first meaningful platform admin release from the revised architecture

### 3A. Dashboard

#### Files to change

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/workspaces/platform/hooks/usePlatformDashboard.ts` | retire direct client aggregation | either delete after migration or convert into a wrapper around the new analytics hook |
| `src/workspaces/platform/pages/PlatformAdminDashboard.tsx` | retire old page shell | convert into wrapper or remove after route migration |

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/analytics/types.ts` | dashboard and analytics read types |
| `src/workspaces/platform/domains/analytics/api/getPlatformOverview.ts` | reads trusted aggregated dashboard data |
| `src/workspaces/platform/domains/analytics/hooks/usePlatformOverview.ts` | React Query wrapper |
| `src/workspaces/platform/domains/analytics/components/RecentPlatformActivity.tsx` | recent event feed |
| `src/workspaces/platform/domains/analytics/components/PlatformOverviewGrid.tsx` | top summary cards |
| `src/workspaces/platform/pages/PlatformDashboardPage.tsx` | final page |

#### Backend work

Create a new migration:

- `supabase/migrations/056_platform_dashboard_overview.sql`

Recommended contents:

- RPC or secured view for platform dashboard aggregates
- explicit definitions for trusted metrics such as total organizations, active organizations, trial organizations, total users, active subscriptions, MRR display value, failed jobs count, recent suspicious activity count
- indexes if a required query is still slow after EXPLAIN

Important rule:

- do not keep MRR plan-price math inside React code

### 3B. Organizations

#### Files to retire or replace

| File | Replacement |
| --- | --- |
| `src/workspaces/platform/pages/panels/TenantsPanel.tsx` | `src/workspaces/platform/pages/OrganizationsPage.tsx` |

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/organizations/types.ts` | organization list and detail types |
| `src/workspaces/platform/domains/organizations/api/listOrganizations.ts` | paginated list query |
| `src/workspaces/platform/domains/organizations/api/getOrganizationDetail.ts` | summary detail query |
| `src/workspaces/platform/domains/organizations/hooks/usePlatformOrganizations.ts` | list hook |
| `src/workspaces/platform/domains/organizations/hooks/usePlatformOrganizationDetail.ts` | detail hook |
| `src/workspaces/platform/domains/organizations/services/platformOrganizationsService.ts` | suspend/reactivate/cancel/delete/create calls |
| `src/workspaces/platform/domains/organizations/components/OrganizationStatusBadge.tsx` | shared status UI |
| `src/workspaces/platform/domains/organizations/components/OrganizationSummaryTabs.tsx` | detail layout tabs |
| `src/workspaces/platform/domains/organizations/tables/organization-columns.tsx` | table columns and row actions |
| `src/workspaces/platform/pages/OrganizationsPage.tsx` | list page |
| `src/workspaces/platform/pages/OrganizationDetailPage.tsx` | detail page |

#### Query source of truth

Use:

- `organizations`
- `organization_subscriptions`
- `organization_memberships`
- `billing_customers`
- `plan_limits`
- `usage_tracking`
- `audit_logs`

Do not base new organization management code on the `tenants` view.

#### Dangerous actions

Use Edge Function:

- `supabase/functions/platform-organizations/index.ts`

Suggested actions:

- `create`
- `updateProfile`
- `suspend`
- `reactivate`
- `cancel`
- `archive`

### 3C. Users

#### Files to retire or replace

| File | Replacement |
| --- | --- |
| `src/workspaces/platform/pages/panels/UsersPanel.tsx` | `src/workspaces/platform/pages/UsersPage.tsx` |

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/users/types.ts` | user identity and membership read types |
| `src/workspaces/platform/domains/users/api/listUsers.ts` | global user list query |
| `src/workspaces/platform/domains/users/api/getUserDetail.ts` | user detail query |
| `src/workspaces/platform/domains/users/hooks/usePlatformUsers.ts` | list hook |
| `src/workspaces/platform/domains/users/hooks/usePlatformUserDetail.ts` | detail hook |
| `src/workspaces/platform/domains/users/services/platformUsersService.ts` | suspend/reactivate/role-change actions |
| `src/workspaces/platform/domains/users/tables/user-columns.tsx` | list table config |
| `src/workspaces/platform/pages/UsersPage.tsx` | list page |
| `src/workspaces/platform/pages/UserDetailPage.tsx` | detail page |

#### Query source of truth

Use:

- `organization_memberships`
- `profiles`
- `organizations`
- `audit_logs`

Use the `tenant_users` view only as a temporary adapter while old code is being removed.

#### Important modeling rule

Split user detail into:

- auth/profile identity
- memberships by organization
- account state
- recent audit activity

Do not flatten everything into one generic user row.

### 3D. Subscriptions

#### Files to retire or replace

| File | Replacement |
| --- | --- |
| `src/workspaces/platform/pages/panels/BillingPanel.tsx` | `src/workspaces/platform/pages/SubscriptionsPage.tsx` |

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/subscriptions/types.ts` | subscription and billing read types |
| `src/workspaces/platform/domains/subscriptions/api/listSubscriptions.ts` | list query |
| `src/workspaces/platform/domains/subscriptions/api/getSubscriptionDetail.ts` | detail query |
| `src/workspaces/platform/domains/subscriptions/hooks/usePlatformSubscriptions.ts` | list hook |
| `src/workspaces/platform/domains/subscriptions/services/platformSubscriptionsService.ts` | plan updates and status changes |
| `src/workspaces/platform/domains/subscriptions/tables/subscription-columns.tsx` | list columns |
| `src/workspaces/platform/pages/SubscriptionsPage.tsx` | final page |

#### Query source of truth

Use:

- `organization_subscriptions`
- `organizations`
- `billing_customers`
- `plan_limits`
- `usage_tracking`

Do not keep long-term platform billing logic on the `tenant_subscriptions` view.

### 3E. Audit Logs

#### Files to retire or replace

| File | Replacement |
| --- | --- |
| `src/workspaces/platform/pages/panels/AuditLogsPanel.tsx` | `src/workspaces/platform/pages/AuditLogsPage.tsx` |

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/audit/types.ts` | audit row and filter types |
| `src/workspaces/platform/domains/audit/api/listAuditLogs.ts` | paginated audit query |
| `src/workspaces/platform/domains/audit/hooks/usePlatformAuditLogs.ts` | list hook |
| `src/workspaces/platform/domains/audit/components/AuditLogMetadataPanel.tsx` | detail viewer |
| `src/workspaces/platform/domains/audit/tables/audit-columns.tsx` | list columns |
| `src/workspaces/platform/pages/AuditLogsPage.tsx` | final page |

#### Query source of truth

Use:

- `audit_logs`
- `organizations`
- `profiles`
- `impersonation_sessions`

#### Audit rule

Every dangerous platform mutation added in this phase must call audit logging from the backend path, not just from the React page.

### Phase 3 acceptance

- dashboard, organizations, users, subscriptions, and audit pages exist on canonical routes
- page components are thin
- list pages use React Query instead of page-local `useEffect`
- new platform pages read canonical tables

### Phase 4: Platform Controls, Security, Health, And Settings

Goal:

- deliver the revised architecture pages that were intentionally deferred out of the first release

### 4A. Plans And Modules

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/plans/types.ts` | plan and entitlement types |
| `src/workspaces/platform/domains/plans/api/listPlans.ts` | plan list read model |
| `src/workspaces/platform/domains/plans/services/platformPlansService.ts` | plan changes |
| `src/workspaces/platform/domains/modules/types.ts` | module feature model |
| `src/workspaces/platform/domains/modules/api/getModuleOverview.ts` | module usage and enablement |
| `src/workspaces/platform/domains/modules/services/platformModulesService.ts` | module enable/disable operations |
| `src/workspaces/platform/pages/PlansPage.tsx` | plans page |
| `src/workspaces/platform/pages/ModulesPage.tsx` | modules page |

#### Existing files to change

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/core/utils/plan-limits.ts` | keep as shared commercial rules | treat this file as a pricing rule library, not as the platform page data source |
| `src/core/hooks/usePlanLimits.ts` | avoid coupling platform pages to organization-context-only hook | keep tenant workspace usage here, but create separate platform domain hooks for cross-organization views |
| `src/core/utils/modules.ts` | reuse as base module entitlement mapping | keep module constants here, but resolve per-organization entitlements in domain hooks |

### 4B. Security And Impersonation

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/security/types.ts` | security overview types |
| `src/workspaces/platform/domains/security/api/getSecurityOverview.ts` | suspicious login and impersonation summary |
| `src/workspaces/platform/domains/security/hooks/usePlatformSecurityOverview.ts` | React Query hook |
| `src/workspaces/platform/shared/components/StepUpAuthDialog.tsx` | re-auth gate for dangerous actions |
| `src/workspaces/platform/pages/SecurityPage.tsx` | security page |

#### Existing files to change

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/app/providers/ImpersonationProvider.tsx` | enforce stronger lifecycle | add expiration handling, blocked nested impersonation, and better audit linkage |
| `src/workspaces/platform/layout/ImpersonationBanner.tsx` | make session warning impossible to miss | stronger warning styles and action restrictions message |

#### Backend work

Create migration:

- `supabase/migrations/057_platform_impersonation_hardening.sql`

Recommended contents:

- add `expires_at` to `impersonation_sessions`
- add `source_ip`
- add `user_agent`
- add optional `ended_by_user_id`
- add indexes on `started_at` and `ended_at` if needed for investigation queries

Create Edge Function:

- `supabase/functions/platform-impersonation/index.ts`

This function should own:

- start session
- stop session
- optional step-up verification
- audit event write

### 4C. Health

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/health/types.ts` | health summary types |
| `src/workspaces/platform/domains/health/api/getHealthOverview.ts` | background jobs, failures, storage warnings, service summary |
| `src/workspaces/platform/domains/health/hooks/usePlatformHealthOverview.ts` | React Query hook |
| `src/workspaces/platform/pages/HealthPage.tsx` | health page |

#### Existing files and docs to change

| File | What to change | Exact focus |
| --- | --- | --- |
| `docs/background-jobs.md` | update operational contract after health page lands | document the exact fields the health page depends on |
| `scripts/background-worker.mjs` | keep job metadata healthy | ensure `locked_by`, failure payloads, and retry fields remain reliable for UI summaries |
| `scripts/enqueue-contract-expiry-alerts.mjs` | keep compatibility while canonicalizing inserts | maintain both organization and tenant aliases until cleanup completes |

### 4D. Settings

#### Recommended new database objects

Create migration:

- `supabase/migrations/058_platform_settings_and_flags.sql`

Recommended tables:

- `platform_settings`
- `platform_feature_flags`

Suggested minimum fields:

- `key`
- `value`
- `description`
- `updated_by`
- `updated_at`

#### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/settings/types.ts` | settings and feature flag types |
| `src/workspaces/platform/domains/settings/api/getPlatformSettings.ts` | read model |
| `src/workspaces/platform/domains/settings/services/platformSettingsService.ts` | update actions |
| `src/workspaces/platform/pages/SettingsPage.tsx` | final settings page |

#### File to retire or replace

| File | Replacement |
| --- | --- |
| `src/workspaces/platform/pages/panels/SettingsPanel.tsx` | `src/workspaces/platform/pages/SettingsPage.tsx` |

### Phase 4 acceptance

- plans, modules, security, health, and settings pages exist
- dangerous platform actions use secured backend paths
- impersonation has clearer lifecycle controls
- health page reads real job and audit signals

### Phase 5: Advanced Analytics And Event-Driven Platform Work

Goal:

- finish the architecture with better analytics, events, and background automation

### Recommended database addition

Create migration:

- `supabase/migrations/059_platform_domain_events.sql`

Recommended table:

- `platform_domain_events`

Suggested fields:

- `id`
- `event_type`
- `organization_id`
- `actor_user_id`
- `target_entity_type`
- `target_entity_id`
- `payload`
- `created_at`
- `processed_at`

### Files to create

| File | Purpose |
| --- | --- |
| `src/workspaces/platform/domains/analytics/api/getAnalyticsOverview.ts` | richer analytics read model |
| `src/workspaces/platform/domains/analytics/hooks/usePlatformAnalytics.ts` | analytics page hook |
| `src/workspaces/platform/pages/AnalyticsPage.tsx` | analytics page |
| `src/workspaces/platform/shared/api/platform-events.ts` | client-side event viewer helpers if needed |

### Existing files to change

| File | What to change | Exact focus |
| --- | --- | --- |
| `src/core/utils/audit.ts` | optionally emit both audit logs and domain events | keep audit append-only and add event emission path for backend services |
| `src/core/utils/jobs.ts` | support event-driven follow-up jobs | enqueue analytics refresh, notifications, or export jobs from platform events |
| `scripts/background-worker.mjs` | add additional handlers only after event contracts are stable | do not over-expand job handlers before event types are defined |

### Phase 5 acceptance

- analytics page uses aggregated read models
- platform actions can trigger downstream jobs without page-level side effects
- audit and event concerns are separated cleanly

## 7. Recommended PR Sequence

Use small PRs in this order:

1. Phase 0 safety and canonical naming fixes
2. Phase 1 route and layout refactor
3. Phase 2 shared platform scaffolding
4. Phase 3 dashboard and organizations
5. Phase 3 users and subscriptions
6. Phase 3 audit logs
7. Phase 4 security and impersonation hardening
8. Phase 4 plans, modules, health, and settings
9. Phase 5 analytics and events

## 8. Verification Checklist For Every Phase

After each phase:

- run `npm run typecheck`
- run `npm run lint`
- run `npm run test`
- run `npm run db:types` after any migration changes
- manually test both platform route access and tenant workspace protection
- verify audit logs for every destructive platform action added in that phase

## 9. Implementation Summary

The most important implementation decision is this:

- keep the platform workspace domain-first
- use canonical organization-based tables
- move dangerous actions into secured backend paths
- treat impersonation as a privileged workflow, not a navigation shortcut

If this plan is followed, the platform super admin area will grow from the current panel-based starter implementation into a safer, more scalable control surface without forcing a risky big-bang rewrite.
