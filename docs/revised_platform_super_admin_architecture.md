# Super Admin (Platform Super Admin) - Revised Architectural Plan

## Executive Summary

This document defines the revised architecture (main/docs/super-admin-architecture.md) for the **Platform Super Admin** area in the SISWIT SaaS platform.

The goal of this revision is to keep the original (main/docs/super-admin-architecture.md) vision strong while making the architecture more practical, safer, more scalable, and easier to implement in phases.

This revision makes the following major corrections:

- reduces over-scoping in early phases
- separates platform administration from internal operations tooling
- strengthens the security model around high-risk actions
- moves from a page-first structure toward a domain-first architecture
- clarifies data ownership, computed metrics, and backend responsibilities
- introduces event-driven patterns for audit, analytics, and async workflows

The platform super admin remains the highest-level role in the system and is intended only for the SaaS platform operator, not tenant users.

---

## 1. Purpose and Scope

The Platform Super Admin area is responsible for **platform-level administration**, not day-to-day infrastructure engineering.

It should allow authorized platform operators to:

- manage tenant organizations
- manage users across organizations
- manage subscriptions, plans, and platform entitlements
- manage global platform configuration
- review audit logs and security activity
- view high-level health and analytics for business and platform oversight

It should **not** become a full DevOps console, database administration panel, or raw infrastructure management interface inside the main SaaS product.

Those responsibilities should be separated into internal engineering tools and external monitoring systems.

---

## 2. Core Architectural Decisions

### 2.1 Architectural Direction

The super admin area should follow these architectural principles:

1. **Multi-tenant safety first**
   Platform-level actions must never accidentally bypass tenant isolation without explicit, audited design.

2. **Domain-first organization**
   The codebase should be organized around business domains such as organizations, users, billing, security, and audit rather than only page names.

3. **Thin frontend, controlled backend**
   The UI should focus on presentation, filtering, and workflow control. Sensitive business logic must run in secure backend layers.

4. **Event-driven side effects**
   Important actions should emit domain events that feed audit logging, notifications, metrics, and async jobs.

5. **Phased delivery**
   The first implementation should cover only the highest-value admin capabilities and avoid trying to ship the whole universe in one release.

---

## 3. Role Model and Access Control

### 3.1 Role Hierarchy

```text
platform_super_admin (Level 100) ──── SaaS Platform Operator
    │
    ├── owner (Level 80) ──── Organization Owner
    │   ├── admin (Level 70) ──── Organization Admin
    │   │   ├── manager (Level 60) ──── Manager
    │   │   │   └── employee (Level 50) ──── Employee
    │   │   └── client (Level 20) ──── Client
```

### 3.2 Access Rules

The `platform_super_admin` role must be treated as a **separate platform domain role**, not just “a stronger tenant admin.”

That means:

- tenant-level permission checks must not be reused blindly for platform-level actions
- platform routes must have dedicated route guards
- platform backend actions must require platform-admin authorization on the server side
- platform admin sessions should be more restricted and more heavily audited than normal user sessions

### 3.3 Permission Model

Instead of relying only on role checks, the revised architecture should support **capability-based permissions** for platform admin functions.

Example capability groups:

- `platform.organizations.read`
- `platform.organizations.write`
- `platform.organizations.suspend`
- `platform.users.read`
- `platform.users.write`
- `platform.billing.read`
- `platform.billing.write`
- `platform.audit.read`
- `platform.security.read`
- `platform.settings.write`
- `platform.impersonation.start`

This makes future expansion easier if you ever add secondary platform admins with limited scope.

### 3.4 Permission Enforcement Pattern

```typescript
const isPlatformAdmin = user.role === "platform_super_admin";

if (!isPlatformAdmin) {
  throw new Error("Unauthorized");
}

assertPlatformCapability(user, "platform.organizations.write");
```

Important rule: **frontend checks are only UX helpers**.  
Real authorization must happen in backend services or secured server-side procedures.

---

## 4. Revised Scope Boundaries

### 4.1 What belongs in Platform Admin

These belong in the main platform admin product area:

- organization lifecycle management
- user lifecycle management across tenants
- subscription and plan administration
- module and entitlement control
- platform-wide settings
- platform audit review
- platform security review
- business/platform overview analytics
- limited operational status summaries

### 4.2 What should stay outside Platform Admin

These should not be primary responsibilities of the platform admin dashboard:

- raw database management tools
- SQL execution interfaces
- low-level backup controls
- full job queue internals for engineering teams
- infrastructure deployment controls
- deep server metrics debugging tools
- cloud resource consoles

Those should live in:

- internal engineering tools
- monitoring platforms
- database admin tools
- deployment systems

This keeps the SaaS product clean and avoids exposing dangerous power in the main app UI.

---

## 5. Recommended Navigation Structure

### 5.1 Main Routes

```text
/platform
/platform/organizations
/platform/users
/platform/subscriptions
/platform/plans
/platform/modules
/platform/audit-logs
/platform/security
/platform/analytics
/platform/settings
```

### 5.2 Routes Deferred to Later or Moved Out

The original `system` route should be reduced or delayed.

Instead of building a full `/platform/system` DevOps-style page immediately, use a lighter version in early phases:

```text
/platform/health
```

This page should show:

- service availability summary
- background job summary
- recent critical failures
- storage threshold warnings
- API health summary

It should **not** attempt to replace real monitoring infrastructure.

---

## 6. Revised Information Architecture

### 6.1 Dashboard Overview

The overview page should stay focused on platform decision-making, not on dumping every metric possible.

Recommended sections:

#### Top Summary Cards
- total organizations
- active organizations
- trial organizations
- total users
- active subscriptions
- MRR
- churn snapshot
- platform alerts count

#### Growth and Revenue
- MRR trend
- organization growth
- plan distribution

#### Operational Snapshot
- recent critical alerts
- failed background jobs count
- recent suspicious login events
- storage threshold warnings

#### Recent Platform Activity
- new organizations
- subscription changes
- user suspensions
- platform setting changes
- impersonation sessions started or ended

This keeps the dashboard useful instead of turning it into a monster page.

---

## 7. Domain-First Module Design

The original document organized code mostly by pages.  
The revised architecture should organize most logic by domain.

### 7.1 Recommended Domain Modules

```text
src/workspaces/platform/
├── app/
│   ├── PlatformAdminLayout.tsx
│   ├── PlatformAdminRoutes.tsx
│   └── PlatformRouteGuard.tsx
├── domains/
│   ├── organizations/
│   ├── users/
│   ├── subscriptions/
│   ├── plans/
│   ├── modules/
│   ├── audit/
│   ├── security/
│   ├── analytics/
│   ├── settings/
│   └── health/
├── shared/
│   ├── api/
│   ├── components/
│   ├── tables/
│   ├── filters/
│   ├── utils/
│   └── types/
└── pages/
    ├── PlatformDashboardPage.tsx
    ├── OrganizationsPage.tsx
    ├── OrganizationDetailPage.tsx
    ├── UsersPage.tsx
    ├── UserDetailPage.tsx
    ├── SubscriptionsPage.tsx
    ├── PlansPage.tsx
    ├── ModulesPage.tsx
    ├── AuditLogsPage.tsx
    ├── SecurityPage.tsx
    ├── AnalyticsPage.tsx
    ├── SettingsPage.tsx
    └── HealthPage.tsx
```

### 7.2 Why this structure is better

This structure is better because:

- pages remain thin
- hooks and queries stay close to their domain
- types stay domain-owned
- tables, filters, and common UI can still be shared
- scaling later becomes easier without giant page files doing everything badly like a stressed intern

---

## 8. Backend Responsibility Split

This is one of the most important changes.

### 8.1 Frontend Responsibilities

The frontend should handle:

- rendering platform pages
- search, filters, pagination UI
- form input and validation
- confirmation flows
- presenting metrics and statuses
- showing audit results and warnings
- handling safe user workflows

The frontend should **not** be trusted for:

- final authorization
- dangerous mutations
- impersonation token creation
- platform-wide state changes
- billing-critical calculations

### 8.2 Backend Responsibilities

A secured backend layer should handle:

- platform authorization checks
- high-risk mutations
- impersonation session issuance
- audit log writing
- event publishing
- billing logic
- plan entitlement updates
- organization lifecycle transitions
- platform security enforcement

### 8.3 RPC Usage Guidance

RPCs can still be used, but they should be limited to carefully controlled cases.

Use RPCs when:

- the operation is simple and tightly scoped
- authorization is fully enforced server-side
- the action is audited
- the database is the best place for the logic

Avoid using direct client-triggered RPCs for complex platform workflows such as:

- multi-step organization provisioning
- impersonation start/stop
- plan migration with entitlement recalculation
- user suspension with cascading session invalidation
- billing-sensitive state changes

For those, prefer a backend admin service or protected server-side API.

---

## 9. Revised Data and Metrics Model

The original plan included many metrics but did not clearly define their ownership model.

### 9.1 Metric Categories

Metrics should be divided into three categories:

#### Operational Raw Metrics
Directly sourced from system tables or services.
Examples:
- organization count
- active subscription count
- failed job count
- recent security alerts count

#### Derived Business Metrics
Calculated using defined business rules.
Examples:
- MRR
- ARR
- churn rate
- ARPU
- expansion revenue

#### Product Usage Metrics
Aggregated from usage events.
Examples:
- module adoption
- feature usage
- active users by period
- API calls by tenant
- e-signatures processed

### 9.2 Source of Truth Rules

Each important metric must document:

- source tables or event streams
- calculation logic
- refresh frequency
- caching strategy
- whether it is display-only or finance-trusted

Example:

```text
Metric: MRR
Source: active subscription billing records
Calculation: sum of normalized monthly recurring charges for active paid subscriptions
Refresh: every 15 minutes
Use: dashboard display and management reporting
Finance-grade: only if based on billing source of truth, not UI aggregation
```

### 9.3 Recommended Data Strategy

For high-value dashboard metrics:

- use backend aggregation endpoints
- cache results briefly
- use materialized tables/views if needed
- avoid recalculating heavy platform-wide metrics on every page load

---

## 10. Event-Driven Architecture Additions

The revised design should introduce domain events for critical platform actions.

### 10.1 Example Events

- `platform.organization.created`
- `platform.organization.suspended`
- `platform.organization.deleted`
- `platform.user.role_changed`
- `platform.user.suspended`
- `platform.subscription.updated`
- `platform.plan.changed`
- `platform.impersonation.started`
- `platform.impersonation.ended`
- `platform.security.alert_detected`
- `platform.settings.updated`

### 10.2 Why events matter

Events make it easier to support:

- audit logging
- analytics updates
- notifications
- asynchronous workflows
- reporting pipelines
- alerting

Without events, side effects get scattered everywhere and the code starts behaving like it was assembled during a power cut.

### 10.3 Event Consumers

Possible consumers:

- audit service
- notification service
- analytics aggregation jobs
- webhook dispatchers
- background job processor
- security monitoring service

---

## 11. Organization Management Architecture

### 11.1 Core Responsibilities

The organization management domain should support:

- list and search organizations
- view organization details
- create organizations
- update organization profile and status
- suspend and reactivate organizations
- cancel organizations
- soft-delete organizations
- review organization usage and subscription summary

### 11.2 Important Design Rules

#### Use state transitions, not random status edits
Do not let the UI directly flip any organization status to any other value.

Use explicit state transitions like:

- `trial -> active`
- `active -> suspended`
- `suspended -> active`
- `active -> cancelled`
- `cancelled -> archived`

This prevents broken business states.

#### Separate business status from operational status
For example:

- organization lifecycle status
- subscription status
- payment status
- data retention status

These should not be smashed into one confusing field.

### 11.3 Recommended Organization Detail Tabs

- Overview
- Users
- Subscription
- Usage
- Activity
- Settings

This is still close to the original plan, but “Usage” is clearer than mixing everything into generic detail tabs.

---

## 12. User Management Architecture

### 12.1 Core Responsibilities

The user management domain should support:

- global user search
- user detail view
- membership review across organizations
- role changes
- suspension and reactivation
- verification state review
- invitation history visibility
- account state review

### 12.2 Important User Model Correction

In a multi-tenant system, platform user identity and tenant membership are different concerns.

Keep separate concepts for:

- user identity
- platform auth account
- organization membership
- role within each organization
- account lifecycle status
- invitation state

This prevents messy logic where one person appears “active” in one place and “pending” in another and everyone starts blaming the database.

### 12.3 Dangerous Actions Requiring Special Workflow

These actions should require stricter handling:

- changing owner-level roles
- suspending owner/admin accounts
- deleting users with active memberships
- merging duplicate accounts
- manually verifying email
- resetting credentials

Use confirmation plus backend authorization plus audit.

---

## 13. Subscription, Plans, and Modules Architecture

### 13.1 Split the Domains Properly

The original document grouped subscriptions, plans, and modules reasonably, but the revised architecture should treat them as distinct domains:

#### Subscriptions
Tracks organization billing status and current purchased plan state.

#### Plans
Defines reusable commercial packages, entitlements, limits, and pricing configuration.

#### Modules
Defines platform capabilities that can be enabled by entitlement or configuration.

This separation matters because “plan”, “subscription”, and “module access” are related but not the same thing.

### 13.2 Plan Model

Each plan should define:

- display name
- billing interval
- base price
- module entitlements
- resource limits
- feature flags
- minimum user count if applicable
- overage policy if applicable

### 13.3 Subscription Model

Each subscription should track:

- organization id
- plan id
- billing status
- lifecycle status
- start date
- renewal date
- cancellation date
- overrides
- seat counts
- add-ons if later supported

### 13.4 Entitlements Strategy

Avoid sprinkling plan checks all over the app.

Instead, create a clear entitlement resolution layer:

```typescript
type OrganizationEntitlements = {
  modules: {
    crm: boolean;
    cpq: boolean;
    clm: boolean;
    erp: boolean;
    documents: boolean;
  };
  limits: {
    users: number | null;
    storageMb: number | null;
    contacts: number | null;
    quotesPerMonth: number | null;
    apiCallsPerMonth: number | null;
  };
  featureFlags: string[];
};
```

The app should consume resolved entitlements, not raw plan rows everywhere.

---

## 14. Audit Architecture

### 14.1 Audit Logging Principles

Audit logs must be:

- append-only
- immutable for normal admins
- queryable with filters
- exportable only with strong permissions
- generated from backend-trusted actions
- consistent across domains

### 14.2 Required Fields for Audit Entries

Each audit record should ideally include:

- event id
- timestamp
- actor id
- actor type
- target entity type
- target entity id
- action type
- organization context if applicable
- IP address
- user agent
- correlation id / request id
- metadata payload
- impersonation context if applicable

### 14.3 Special Audit Cases

The following actions must always be auditable:

- impersonation start and end
- organization suspension
- organization deletion
- user suspension
- role changes
- subscription changes
- plan changes
- security configuration changes
- export actions
- manual verification actions

---

## 15. Impersonation Security Architecture

This section needs much stricter definition than the original draft.

### 15.1 Impersonation Rules

Impersonation must be treated as a high-risk privileged workflow.

Required controls:

- allowed only for authorized platform admins
- requires recent re-authentication
- requires reason capture
- must create an explicit impersonation session record
- session must expire automatically
- UI must show an unmistakable banner
- all actions during impersonation must be linked to the real actor
- sensitive actions may still be blocked during impersonation

### 15.2 Recommended Restrictions

Consider blocking these while impersonating:

- changing billing/payment methods
- deleting organizations
- promoting roles to owner/platform admin
- changing global security settings
- exporting large datasets
- starting nested impersonation

### 15.3 Impersonation Audit Data

Each session should capture:

- real admin id
- impersonated user id
- start time
- end time
- reason
- source IP
- session token id
- actions performed during the session

This feature needs paranoia. Healthy paranoia. Enterprise-flavored paranoia.

---

## 16. Security Architecture

### 16.1 Platform Route Protection

All `/platform/*` routes must require a dedicated platform route guard.

### 16.2 Backend Security Controls

Required backend security features:

- server-side platform authorization
- stricter session TTL for platform admins
- forced logout on critical role changes
- audit on all dangerous actions
- rate limiting for sensitive operations
- protection against IDOR and cross-tenant leakage
- optional step-up auth for dangerous actions

### 16.3 Sensitive Actions Requiring Step-Up Auth

Recommended examples:

- start impersonation
- suspend organization
- delete organization
- change platform settings
- export audit logs
- process refunds
- promote platform admins

### 16.4 Data Protection

Use:

- encryption in transit
- encryption at rest
- soft-delete where required
- secure export flows
- limited retention policies
- masked display for sensitive data when not needed

---

## 17. Health and Operations Summary

The original plan included heavy system operations. The revised design keeps a lighter operational summary page.

### 17.1 Health Page Scope

The health page should show:

- API availability summary
- database connectivity summary
- failed job count
- recent job failures
- storage threshold warnings
- email service health
- recent severe errors

### 17.2 What this page should not do

It should not provide:

- raw DB tooling
- query execution
- schema changes
- infrastructure deployment controls
- direct worker process control
- cloud console replacement

This page should be about **visibility**, not unrestricted power.

---

## 18. Revised Page Set

### 18.1 Phase 1 Page Set

Build first:

- Dashboard
- Organizations
- Organization Detail
- Users
- User Detail
- Subscriptions
- Audit Logs

### 18.2 Phase 2 Page Set

Add after phase 1 stabilizes:

- Plans
- Modules
- Security
- Health
- Settings

### 18.3 Phase 3 Page Set

Add after domain maturity and stable metrics:

- Analytics
- advanced exports
- advanced automation
- approval workflows if needed

This phased cut is one of the biggest improvements over the original document.

---

## 19. Revised Route Configuration

```typescript
<Route
  path="/platform"
  element={
    <PlatformRouteGuard>
      <PlatformAdminLayout />
    </PlatformRouteGuard>
  }
>
  <Route index element={<PlatformDashboardPage />} />
  <Route path="organizations" element={<OrganizationsPage />} />
  <Route path="organizations/:id" element={<OrganizationDetailPage />} />
  <Route path="users" element={<UsersPage />} />
  <Route path="users/:id" element={<UserDetailPage />} />
  <Route path="subscriptions" element={<SubscriptionsPage />} />
  <Route path="plans" element={<PlansPage />} />
  <Route path="modules" element={<ModulesPage />} />
  <Route path="audit-logs" element={<AuditLogsPage />} />
  <Route path="security" element={<SecurityPage />} />
  <Route path="health" element={<HealthPage />} />
  <Route path="analytics" element={<AnalyticsPage />} />
  <Route path="settings" element={<SettingsPage />} />
</Route>
```

---

## 20. Revised Query and Data Access Guidance

### 20.1 Query Strategy

Avoid giant admin pages loading everything at once.

Use:

- paginated lists
- server-side filters
- debounced search
- stable sort options
- small summary aggregations
- cached dashboard endpoints

### 20.2 Recommended Loading Patterns

#### List Pages
Use paginated server-side queries.

#### Detail Pages
Load detail summary first, then related tabs lazily.

#### Dashboard
Use aggregated backend endpoints with short-lived caching.

### 20.3 Avoid

- full table scans from the client
- giant joins for every render
- direct frontend-controlled broad platform queries
- expensive dashboard calculations on every refresh

---

## 21. Suggested API / Service Layer Design

Instead of binding pages directly to mixed RPCs, use domain service contracts.

### 21.1 Example Service Boundaries

```typescript
platformOrganizationsService.list()
platformOrganizationsService.getById()
platformOrganizationsService.create()
platformOrganizationsService.suspend()
platformOrganizationsService.reactivate()

platformUsersService.list()
platformUsersService.getById()
platformUsersService.changeRole()
platformUsersService.suspend()

platformSubscriptionsService.list()
platformSubscriptionsService.update()

platformAuditService.list()
platformSecurityService.getOverview()
platformHealthService.getOverview()
```

These may be backed by:

- server routes
- protected server actions
- backend services
- tightly scoped RPCs

The point is to stop UI pages from becoming the architects of the whole backend.

---

## 22. UI / UX Guidance

### 22.1 Design Priorities

The super admin interface should feel:

- powerful
- clear
- fast to scan
- safe for destructive actions
- visually distinct from normal tenant workspaces

### 22.2 UX Rules for Dangerous Actions

For suspend, cancel, delete, refund, impersonate, or export actions:

- show exact target name
- explain impact
- require explicit confirmation
- show success/failure clearly
- never hide destructive actions behind vague button labels

### 22.3 Required UI Elements

Recommended platform-wide shared components:

- metric cards
- status badges
- paginated tables
- filter bars
- activity timelines
- warning callouts
- confirmation dialogs
- impersonation banner
- audit metadata viewer

---

## 23. Revised Technical File Structure

```text
src/workspaces/platform/
├── app/
│   ├── PlatformAdminLayout.tsx
│   ├── PlatformSidebar.tsx
│   ├── PlatformTopbar.tsx
│   ├── PlatformRouteGuard.tsx
│   └── PlatformAdminRoutes.tsx
├── domains/
│   ├── organizations/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── tables/
│   │   └── types.ts
│   ├── users/
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── tables/
│   │   └── types.ts
│   ├── subscriptions/
│   ├── plans/
│   ├── modules/
│   ├── audit/
│   ├── security/
│   ├── analytics/
│   ├── health/
│   └── settings/
├── pages/
│   ├── PlatformDashboardPage.tsx
│   ├── OrganizationsPage.tsx
│   ├── OrganizationDetailPage.tsx
│   ├── UsersPage.tsx
│   ├── UserDetailPage.tsx
│   ├── SubscriptionsPage.tsx
│   ├── PlansPage.tsx
│   ├── ModulesPage.tsx
│   ├── AuditLogsPage.tsx
│   ├── SecurityPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── HealthPage.tsx
│   └── SettingsPage.tsx
└── shared/
    ├── components/
    ├── constants/
    ├── hooks/
    ├── lib/
    ├── tables/
    ├── types/
    └── utils/
```

---

## 24. Performance Architecture

### 24.1 Performance Rules

- paginate all large datasets
- cache dashboard summaries briefly
- lazy-load secondary tabs
- debounce table filters
- virtualize very large audit lists if needed
- index frequently queried columns
- pre-aggregate heavy analytics where justified

### 24.2 Likely Indexed Fields

Examples:

- `organizations.created_at`
- `organizations.status`
- `organization_memberships.organization_id`
- `organization_memberships.user_id`
- `organization_subscriptions.organization_id`
- `organization_subscriptions.status`
- `audit_logs.created_at`
- `audit_logs.organization_id`
- `audit_logs.user_id`
- `audit_logs.action_type`

---

## 25. Revised Implementation Roadmap

### Phase 1: Core Admin Foundations
Target outcomes:

- secure platform route guard
- dashboard overview with trusted summary metrics
- organization list/detail
- user list/detail
- subscription list/detail
- audit log viewer
- append-only audit pipeline for core admin actions

### Phase 2: Platform Controls
Target outcomes:

- plans and entitlements management
- modules management
- security overview
- health overview
- settings management
- stricter step-up auth for dangerous actions
- impersonation flow with full audit trail

### Phase 3: Advanced Intelligence
Target outcomes:

- analytics page
- advanced reporting
- alerting improvements
- approval workflows
- platform automation
- richer event-driven integrations

---

## 26. Risks and Mitigations

### 26.1 Risk: Overbuilding too early
**Problem:** too many pages and systems in the first release  
**Mitigation:** strict phased rollout, phase 1 only for core admin workflows

### 26.2 Risk: Cross-tenant leakage
**Problem:** platform queries accidentally exposing or mutating incorrect tenant data  
**Mitigation:** backend-scoped authorization, explicit tenant context rules, audit logging

### 26.3 Risk: Dangerous impersonation abuse
**Problem:** privileged access feature misused or under-audited  
**Mitigation:** re-auth, reason capture, limited session, strong banners, immutable logs

### 26.4 Risk: Metric inconsistency
**Problem:** dashboard values disagree with reports or billing systems  
**Mitigation:** define metric ownership, aggregation source, refresh rules, and finance-trusted paths

### 26.5 Risk: UI directly coupled to low-level backend details
**Problem:** frontend pages becoming hard to maintain and unsafe  
**Mitigation:** domain services, clear contracts, thin page components

---

## 27. Success Criteria

The architecture should be considered successful if it achieves the following:

### Product Criteria
- platform admins can safely manage organizations, users, and subscriptions
- dangerous actions are auditable and protected
- the dashboard gives useful decision-level visibility
- the platform admin area stays understandable as the system grows

### Technical Criteria
- page logic remains thin and domain-organized
- metrics load fast and consistently
- backend authorization is enforced for all privileged actions
- audit logging is reliable and append-only
- impersonation is secure and reviewable

### Operational Criteria
- critical admin flows do not require manual database intervention
- health summaries expose real platform issues early
- platform-level actions can be investigated through logs and audit records

---

## 28. Final Recommendation

The original architecture was strong as a broad product vision, but it needed tightening in five critical areas:

- scope control
- domain boundaries
- security model
- impersonation design
- backend responsibility split

This revised version keeps the original strengths while making the system much more realistic to implement and much safer to operate.

The most important implementation advice is simple:

**Build the platform admin area as a secure, domain-driven control surface — not as a giant god-panel that tries to do everything at once.**

That is how you keep it scalable, maintainable, and much less likely to punch you in the face later.

---

## Appendix A: Recommended Minimum Phase 1 Deliverables

- platform route guard
- platform dashboard overview
- organizations table and detail page
- users table and detail page
- subscriptions table and detail page
- basic audit logs page
- backend audit event pipeline
- dangerous action confirmation flows

---

## Appendix B: Recommended Dangerous Action Checklist

Before executing any dangerous platform action, verify:

- actor is authorized
- step-up auth passed if required
- target entity is correct
- action reason captured if required
- audit event will be written
- side effects are handled safely
- UI confirmation is explicit
- success and failure states are logged

---

## Appendix C: Suggested Initial Event List

- `platform.organization.created`
- `platform.organization.updated`
- `platform.organization.suspended`
- `platform.organization.reactivated`
- `platform.user.updated`
- `platform.user.role_changed`
- `platform.user.suspended`
- `platform.subscription.updated`
- `platform.plan.updated`
- `platform.settings.updated`
- `platform.impersonation.started`
- `platform.impersonation.ended`

---

---

## 29. Implementation Workflow (Phase 1)

This section provides a granular, step-by-step workflow for the Phase 1 implementation.

### Step 1: Foundation & Layout
- [ ] Create `src/workspaces/platform/app/PlatformRouteGuard.tsx` (Auth & Role check).
- [ ] Create `src/workspaces/platform/app/PlatformAdminLayout.tsx` (Sidebar + Topbar).
- [ ] Implement `src/workspaces/platform/app/PlatformSidebar.tsx` with navigation links.

### Step 2: Routing Setup
- [ ] Define `src/workspaces/platform/app/PlatformAdminRoutes.tsx`.
- [ ] Register `/platform` routes in the main application entry point (`App.tsx` or `Router.tsx`).

### Step 3: Organizations Domain (Preserving Logic)
- [ ] Define types in `src/workspaces/platform/domains/organizations/types.ts`.
- [ ] Implement query logic in `src/workspaces/platform/domains/organizations/api/` using `organizations` and `organization_memberships`.
- [ ] Create `src/workspaces/platform/pages/OrganizationsPage.tsx` with a searchable table.

### Step 4: Users Domain (Preserving Logic)
- [ ] Define types in `src/workspaces/platform/domains/users/types.ts`.
- [ ] Implement query logic using `tenant_users` view in `src/workspaces/platform/domains/users/api/`.
- [ ] Create `src/workspaces/platform/pages/UsersPage.tsx`.

### Step 5: Audit & Security
- [ ] Implement `src/workspaces/platform/domains/audit/api/` using `audit_logs`.
- [ ] Create `src/workspaces/platform/pages/AuditLogsPage.tsx`.

### Step 6: Dashboard Overview
- [ ] Build `src/workspaces/platform/pages/PlatformDashboardPage.tsx`.
- [ ] Core metrics: Total Tenants, Active Users, Recent Events.

---

**Document Version**: 2.1  
**Last Updated**: 2026-03-31  
**Status**: Revised Draft - Workflow Added
