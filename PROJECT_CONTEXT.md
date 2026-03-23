# SISWIT 7.0 — PROJECT_CONTEXT.md

> **Generated**: 2026-03-21  
> **Stack**: Vite 7 + React 18 + TypeScript + Supabase + TailwindCSS + shadcn/ui + React Query  
> **Port**: 8080 (dev server)  
> **Source alias**: `@` → `./src`

---

## 1. Architecture Overview

SISWIT is a **multi-tenant SaaS platform** with 5 business modules (CRM, CPQ, CLM, ERP, Documents), gated by subscription plans. The architecture follows:

- **Frontend**: Vite + React 18 + TypeScript SPA with lazy-loaded route code-splitting
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions + RLS + RPCs)
- **State**: React Query (`@tanstack/react-query`) with shared `QueryClient` instance
- **Auth**: Supabase Auth with custom RPC-based signup flows
- **Multi-tenancy**: Organization-scoped data with `organization_id` on every table; legacy `tenant_id` kept in sync
- **RBAC**: 6-tier role hierarchy with owner-scoped row filtering
- **Background Jobs**: PostgreSQL `background_jobs` table + Node.js worker polling

### Provider Hierarchy (App.tsx)

```
ThemeProvider
  └─ QueryClientProvider
       └─ TooltipProvider / Toaster / Sonner
            └─ ErrorBoundary
                 └─ BrowserRouter
                      └─ AuthProvider
                           └─ ImpersonationProvider
                                └─ OrganizationProvider
                                     └─ TenantProvider
                                          └─ AppRoutes
```

---

## 2. Database Tables & Columns

### 2.1 Platform / Auth Tables

| Table | Key Columns | Notes |
|-------|-------------|-------|
| **organizations** | `id`, `name`, `slug`, `org_code`, `status`, `company_name`, `company_email`, `company_phone`, `company_website`, `company_address`, `logo_url`, `primary_color`, `max_users`, `max_storage_mb`, `plan_type`, `subscription_start_date`, `subscription_end_date`, `created_at`, `updated_at` | Core tenant table. Views as `tenants` for backward compatibility. |
| **organization_subscriptions** | `id`, `organization_id`, `plan_type`, `status`, `module_crm`, `module_cpq`, `module_clm`, `module_erp`, `module_documents`, `features` (JSON), `trial_start_date`, `trial_end_date`, `billing_email`, `billing_contact_name` | Per-module boolean flags for subscription gating |
| **organization_memberships** | `id`, `user_id`, `organization_id`, `role` (app_role enum), `email`, `department`, `employee_id`, `employee_role_id`, `account_id`, `contact_id`, `account_state`, `is_active`, `is_email_verified`, `invited_by_user_id`, `login_count`, `last_login_at` | Links users to organizations with roles |
| **employee_invitations** | `id`, `organization_id`, `invited_email`, `role`, `employee_role_id`, `custom_role_name`, `token_hash`, `status` (invitation_state), `invited_by_user_id`, `message`, `metadata`, `expires_at`, `accepted_at`, `cancelled_at` | Employee invitation flow |
| **client_invitations** | `id`, `organization_id`, `invited_email`, `token_hash`, `status`, `invited_by_user_id`, `account_id`, `contact_id`, `message`, `metadata`, `expires_at`, `accepted_at`, `cancelled_at` | Client/customer invitation flow |
| **employee_roles** | `id`, `organization_id`, `name`, `normalized_name`, `permissions` (JSON), `is_active`, `is_custom` | Custom role definitions per org |
| **profiles** | `id`, `email`, `full_name`, `avatar_url`, `updated_at` | Auth metadata, linked to `auth.users` |
| **user_roles** (view) | `id`, `user_id`, `role`, `approved`, `is_platform_admin` | Compatibility view |
| **contact_inquiries** | `id`, `name`, `email`, `phone`, `company`, `inquiry_type`, `message`, `status`, `created_at` | Website contact form submissions |
| **impersonation_sessions** | `id`, `platform_super_admin_user_id`, `organization_id`, `organization_slug`, `reason`, `metadata`, `started_at`, `ended_at` | Platform admin impersonation tracking |
| **audit_logs** | `id`, `organization_id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_values`, `new_values`, `metadata`, `ip_address`, `user_agent`, `impersonated_by` | Full audit trail with impersonation support |
| **background_jobs** | `id`, `organization_id`, `job_type`, `status` (job_status enum), `payload` (JSON), `priority`, `attempts`, `max_attempts`, `last_error`, `available_at`, `locked_at`, `locked_by`, `finished_at`, `created_by` | Async job queue |

### 2.2 CRM Tables

| Table | Key Columns |
|-------|-------------|
| **accounts** | `id`, `name`, `industry`, `website`, `phone`, `domain`, `billing_address/city/state/country/zip`, `annual_revenue`, `number_of_employees`, `description`, `organization_id`, `tenant_id`, `owner_id`, `created_by`, `deleted_at`, `deleted_by` |
| **contacts** | `id`, `first_name`, `last_name`, `email`, `phone`, `mobile_phone`, `job_title`, `department`, `account_id`, `address/city/state/country/zip`, `organization_id`, `tenant_id`, `owner_id`, `created_by`, `deleted_at`, `deleted_by` |
| **leads** | `id`, `first_name`, `last_name`, `email`, `phone`, `company`, `title`, `lead_status`, `lead_source`, `website`, `converted_at`, `converted_to_account_id`, `converted_to_contact_id`, `converted_to_opportunity_id`, `organization_id`, `tenant_id`, `owner_id` |
| **opportunities** | `id`, `name`, `account_id`, `contact_id`, `stage`, `amount`, `probability`, `expected_revenue`, `close_date`, `lead_source`, `next_step`, `is_closed`, `is_won`, `organization_id`, `tenant_id`, `owner_id` |
| **activities** | `id`, `type`, `subject`, `description`, `due_date`, `completed_at`, `status`, `priority`, `related_to_type`, `related_to_id`, `organization_id`, `tenant_id`, `owner_id`, `created_by` |

### 2.3 CPQ Tables

| Table | Key Columns |
|-------|-------------|
| **products** | `id`, `name`, `sku`, `description`, `family`, `category`, `list_price`, `cost_price`, `cost`, `is_active`, `quantity_on_hand`, `quantity_reserved`, `quantity_available`, `organization_id`, `tenant_id` |
| **quotes** | `id`, `quote_number`, `opportunity_id`, `account_id`, `contact_id`, `status`, `subtotal`, `discount_percent`, `discount_amount`, `tax_percent`, `tax_amount`, `total_amount`, `expiration_date`, `payment_terms`, `notes`, `approved_by`, `approved_at`, `organization_id`, `tenant_id`, `owner_id` |
| **quote_line_items** | `id`, `quote_id`, `product_id`, `product_name`, `description`, `quantity`, `unit_price`, `discount_percent`, `total`, `sort_order`, `organization_id`, `tenant_id`, `deleted_at`, `deleted_by` |

### 2.4 CLM Tables

| Table | Key Columns |
|-------|-------------|
| **contracts** | `id`, `name`, `contract_number`, `template_id`, `opportunity_id`, `quote_id`, `account_id`, `contact_id`, `status`, `content`, `start_date`, `end_date`, `value`, `total_value`, `auto_renew`, `customer_name`, `customer_email`, `organization_id`, `tenant_id`, `owner_id`, `created_by` |
| **contract_templates** | `id`, `name`, `type`, `description`, `content`, `status`, `is_active`, `is_public`, `organization_id`, `tenant_id`, `created_by`, `deleted_at` |
| **contract_versions** | `id`, `contract_id`, `version_number`, `content`, `change_summary`, `organization_id`, `tenant_id`, `created_by` |
| **contract_esignatures** | `id`, `contract_id`, `signer_email`, `signer_name`, `status`, `signed_at`, `sent_at`, `organization_id`, `tenant_id` |
| **contract_scans** | `id`, `contract_id`, `file_url`, `file_path`, `file_name`, `content_type`, `file_size`, `ocr_text`, `extracted_text`, `scan_date`, `organization_id`, `tenant_id`, `created_by` |

### 2.5 ERP Tables

| Table | Key Columns |
|-------|-------------|
| **suppliers** | `id`, `name`, `email`, `phone`, `website`, `address/city/state/country/zip`, `payment_terms`, `rating`, `is_active`, `organization_id`, `tenant_id`, `created_by`, `deleted_at`, `deleted_by` |
| **inventory_items** | `id`, `product_id`, `quantity_on_hand`, `quantity_reserved`, `quantity_available`, `reorder_point`, `reorder_quantity`, `reorder_level`, `average_cost`, `warehouse_location`, `sku`, `organization_id`, `tenant_id` |
| **inventory_transactions** | `id`, `inventory_item_id`, `type`, `quantity`, `reason`, `organization_id`, `tenant_id`, `created_by` |
| **purchase_orders** | `id`, `po_number`, `supplier_id`, `status`, `order_date`, `expected_delivery_date`, `actual_delivery_date`, `subtotal`, `tax_amount`, `shipping_amount`, `total_amount`, `payment_terms`, `notes`, `organization_id`, `tenant_id`, `created_by`, `deleted_at`, `deleted_by` |
| **purchase_order_items** | `id`, `purchase_order_id`, `product_id`, `product_name`, `description`, `quantity_ordered`, `quantity_received`, `unit_price`, `total_price`, `organization_id`, `tenant_id`, `deleted_at`, `deleted_by` |
| **production_orders** | `id`, `order_number`, `product_id`, `status`, `quantity_to_produce`, `quantity_produced`, `start_date`, `end_date`, `actual_end_date`, `notes`, `organization_id`, `tenant_id`, `created_by`, `deleted_at`, `deleted_by` |
| **financial_records** | `id`, `record_type`, `record_date`, `category`, `description`, `amount`, `currency`, `reference_number`, `reference_type`, `status`, `notes`, `organization_id`, `tenant_id`, `created_by` |

### 2.6 Documents Tables

| Table | Key Columns |
|-------|-------------|
| **auto_documents** | `id`, `name`, `type`, `status`, `content`, `template_id`, `related_entity_type`, `related_entity_id`, `file_path`, `file_name`, `format`, `file_size`, `generated_from`, `organization_id`, `tenant_id`, `owner_id`, `created_by`, `deleted_at`, `deleted_by` |
| **document_templates** | `id`, `name`, `type`, `description`, `content`, `variables` (JSON), `category`, `is_active`, `is_public`, `organization_id`, `tenant_id`, `created_by`, `deleted_at` |
| **document_versions** | `id`, `document_id`, `version_number`, `content`, `change_summary`, `file_path`, `file_name`, `format`, `file_size`, `organization_id`, `tenant_id`, `created_by` |
| **document_esignatures** | `id`, `document_id`, `recipient_name`, `recipient_email`, `signer_name`, `signer_email`, `status`, `signed_at`, `sent_at`, `expires_at`, `reminder_count`, `last_reminder_at`, `organization_id`, `tenant_id`, `created_by` |
| **document_permissions** | `id`, `document_id`, `user_id`, `permission_type`, `access_level`, `shared_by`, `organization_id`, `tenant_id` |
| **document_signatures** | `id`, `document_id`, `signer_name`, `signer_email`, `signer_role`, `signature_data`, `status`, `signed_at`, `viewed_at` |

---

## 3. Database Enums

| Enum | Values |
|------|--------|
| **app_role** | `platform_super_admin`, `owner`, `admin`, `manager`, `employee`, `client` |
| **account_state** | `pending_verification`, `pending_approval`, `active`, `rejected`, `suspended`, `inactive` |
| **invitation_state** | `pending`, `accepted`, `expired`, `cancelled`, `rejected` |
| **job_status** | `queued`, `processing`, `succeeded`, `failed`, `cancelled` |

---

## 4. Modules & Current State

| Module | Type | Tables Used | Hook File | CRUD Operations |
|--------|------|-------------|-----------|-----------------|
| **CRM** | `crm` | accounts, contacts, leads, opportunities, activities, products, quotes, quote_line_items | `useCRM.ts` (1590 lines) | Full CRUD on all 7 entities + dashboard stats |
| **CPQ** | `cpq` | products, quotes, quote_line_items | `useCPQ.ts` (788 lines) | Full CRUD + quote status FSM + item totals + `recompute_quote_totals` RPC |
| **CLM** | `clm` | contracts, contract_templates, contract_esignatures, contract_scans, contract_versions | `useCLM.ts` (746 lines) | Full CRUD + e-sig requests + contract expiry alerts + dashboard stats |
| **ERP** | `erp` | suppliers, inventory_items, inventory_transactions, purchase_orders, purchase_order_items, production_orders, financial_records | `useERP.ts` (1168 lines) | Full CRUD on all 6 entities + auto-create products for inventory |
| **Documents** | `documents` | auto_documents, document_templates, document_versions, document_esignatures, document_permissions, document_signatures | `useDocuments.ts` (1006 lines) | Full CRUD + PDF generation jobs + e-sig with reminders + versioning + permissions |

### Module Patterns

All modules follow identical patterns:
- **Scoping**: `useModuleScope()` hook → `applyModuleReadScope()` / `applyModuleMutationScope()` / `buildModuleCreatePayload()`
- **Audit**: Every mutation calls `safeWriteAuditLog()`
- **Soft Delete**: CLM, ERP, Documents use `softDeleteRecord()`; CRM uses hard delete
- **Cache**: React Query invalidation on success, `toast.success/error` on completion
- **Type Safety**: Row/Insert/Update types from auto-generated `Database` types with mapper functions

---

## 5. Subscription Plans & Feature Gates

Plans defined in `src/core/utils/modules.ts`:

| Plan | Modules Included |
|------|-----------------|
| **starter** | `crm` |
| **professional** | `crm`, `cpq`, `clm` |
| **enterprise** | `crm`, `cpq`, `clm`, `erp`, `documents` |

**Gating mechanism**: `organization_subscriptions` table has `module_crm/cpq/clm/erp/documents` boolean flags. The `useModuleAccess()` hook checks `subscription.hasModule(moduleName)`. The `usePermissions()` hook includes `canAccessModule(module)`.

**Subscription table**: `organization_subscriptions.features` (JSON) holds additional feature flags.

---

## 6. Roles & Role Hierarchy

Defined in `src/core/types/roles.ts`:

```
platform_super_admin (100)  ← Platform-level only
  └─ owner (90)              ← Organization owner
       └─ admin (80)          ← Organization admin
            └─ manager (70)    ← Department manager
                 └─ employee (60) ← Regular employee
                      └─ client (50)  ← External client/customer
```

**Key functions**:
- `isPlatformRole(role)` — true for `platform_super_admin`
- `isTenantUserRole(role)` — true for `employee`, `manager`
- `isOwnerScopedRole(role)` — true for `employee`, `client`
- `canReadAllTenantRows(role)` — true for `owner`, `admin`, `manager`, `platform_super_admin`

---

## 7. Routes & Guards

### 7.1 Public Routes (no auth)

| Path | Component |
|------|-----------|
| `/` | Index (marketing) |
| `/about` | About |
| `/contact` | Contact |
| `/pricing` | Pricing |
| `/products` | Products |
| `/solutions` | Solutions |
| `/privacy`, `/terms`, `/cookies` | Legal pages |

### 7.2 Auth Routes (no auth)

| Path | Component |
|------|-----------|
| `/auth/sign-in` | Auth |
| `/auth/sign-up` | SignUp |
| `/auth/accept-invitation` | AcceptEmployeeInvitation |
| `/auth/accept-client-invitation` | AcceptClientInvitation |
| `/auth/forgot-password` | ForgotPassword |
| `/auth/reset-password` | ResetPassword |
| `/auth/verify-success` | VerifySuccess |

### 7.3 Organization Owner Routes — `OrganizationOwnerRoute`

| Path | Component |
|------|-----------|
| `/organization/overview` | OrganizationOverviewPage |
| `/organization/users` | OrganizationUsersPage |
| `/organization/invitations` | OrganizationInvitationsPage |
| `/organization/approvals` | OrganizationApprovalsPage |
| `/organization/plans` | OrganizationPlansPage |
| `/organization/alerts` | OrganizationAlertsPage |
| `/organization/settings` | OrganizationSettingsPage |

### 7.4 Platform Admin Routes — `PlatformAdminRoute` + `PlatformAdminLayout`

| Path | Component |
|------|-----------|
| `/platform` (index) | PlatformAdminDashboard |
| `/platform/tenants` | TenantsPanel |
| `/platform/users` | UsersPanel |
| `/platform/billing` | BillingPanel |
| `/platform/settings` | SettingsPanel |
| `/platform/audit-logs` | AuditLogsPanel |

### 7.5 Customer Portal Routes — `TenantSlugGuard` → `CustomerRoute` + `CustomerPortalLayout`

| Path | Component |
|------|-----------|
| `/:tenantSlug/app/portal` | PortalDashboard |
| `/:tenantSlug/app/portal/quotes` | CustomerQuotesPage |
| `/:tenantSlug/app/portal/quotes/:id` | CustomerQuoteDetailPage |
| `/:tenantSlug/app/portal/contracts` | CustomerContractsPage |
| `/:tenantSlug/app/portal/contracts/:id` | CustomerContractDetailPage |
| `/:tenantSlug/app/portal/documents` | CustomerDocumentsPage |
| `/:tenantSlug/app/portal/document-create` | DocumentCreatePage |
| `/:tenantSlug/app/portal/document-history` | DocumentHistoryPage |
| `/:tenantSlug/app/portal/pending-signatures` | CustomerPendingSignaturesPage |
| `/:tenantSlug/app/portal/pending-signatures/:id` | CustomerSignaturePage |
| `/:tenantSlug/app/portal/contract-templates` | TemplatesPage |

### 7.6 Tenant Workspace Routes — `TenantSlugGuard` → `TenantAdminRoute` + `TenantAdminLayout`

| Path | Component |
|------|-----------|
| `/:tenantSlug/app/dashboard` | TenantWorkspaceDashboard (role-dependent) |
| `/:tenantSlug/app/analytics` | Dashboard |
| **CRM** | |
| `/:tenantSlug/app/crm` | CRMLayout |
| `/:tenantSlug/app/crm/leads` | LeadsPage |
| `/:tenantSlug/app/crm/pipeline` | PipelinePage |
| `/:tenantSlug/app/crm/accounts` | AccountsPage |
| `/:tenantSlug/app/crm/contacts` | ContactsPage |
| `/:tenantSlug/app/crm/opportunities` | OpportunitiesPage |
| `/:tenantSlug/app/crm/activities` | ActivitiesPage |
| **CPQ** | |
| `/:tenantSlug/app/cpq` | CPQDashboard |
| `/:tenantSlug/app/cpq/products` | ProductsPage |
| `/:tenantSlug/app/cpq/quotes` | QuotesListPage |
| `/:tenantSlug/app/cpq/quotes/new` | QuoteBuilderPage |
| `/:tenantSlug/app/cpq/quotes/:id` | QuoteDetailPage |
| `/:tenantSlug/app/cpq/quotes/:id/edit` | QuoteBuilderPage |
| **CLM** | |
| `/:tenantSlug/app/clm` | CLMDashboard |
| `/:tenantSlug/app/clm/contracts` | ContractsListPage |
| `/:tenantSlug/app/clm/contracts/new` | ContractBuilderPage |
| `/:tenantSlug/app/clm/contracts/:id` | ContractDetailPage |
| `/:tenantSlug/app/clm/contracts/:id/edit` | ContractBuilderPage |
| `/:tenantSlug/app/clm/templates` | TemplatesPage |
| `/:tenantSlug/app/clm/scan` | ContractScanPage |
| `/:tenantSlug/app/clm/esign/:id` | ESignaturePage |
| **Documents** (wrapped in `DocumentsRealtimeProvider`) | |
| `/:tenantSlug/app/documents` | DocumentsDashboard |
| `/:tenantSlug/app/documents/create` | DocumentCreatePage |
| `/:tenantSlug/app/documents/templates` | DocumentTemplatesPage |
| `/:tenantSlug/app/documents/history` | DocumentHistoryPage |
| `/:tenantSlug/app/documents/pending` | PendingSignaturesPage |
| `/:tenantSlug/app/documents/:id/esign` | DocumentESignPage |
| **ERP** | |
| `/:tenantSlug/app/erp` | ERPDashboard |
| `/:tenantSlug/app/erp/inventory` | InventoryPage |
| `/:tenantSlug/app/erp/procurement` | ProcurementPage |
| `/:tenantSlug/app/erp/production` | ProductionPage |
| `/:tenantSlug/app/erp/finance` | FinancePage |

### 7.7 Legacy Redirects

| Pattern | Redirects To |
|---------|-------------|
| `/admin/*` | `/platform/*` |
| `/dashboard/*` | `/:tenantSlug/app/*` or `/platform/*` |
| `/portal/*` | `/:tenantSlug/app/portal/*` |

### 7.8 Route Guards

| Guard | Required Role | File |
|-------|---------------|------|
| `PlatformAdminRoute` | `platform_super_admin` | `ProtectedRoute.tsx` |
| `OrganizationOwnerRoute` | `owner` or `admin` | `ProtectedRoute.tsx` |
| `TenantAdminRoute` | Any authenticated tenant member | `ProtectedRoute.tsx` |
| `CustomerRoute` | `client` role | `ProtectedRoute.tsx` |
| `PendingApprovalRoute` | `pending_approval` account state | `ProtectedRoute.tsx` |
| `TenantSlugGuard` | Resolves tenant from URL slug, handles impersonation | `TenantSlugGuard.tsx` |

---

## 8. RLS Policies

RLS is enforced through 30+ migrations. Key policy patterns:

### Access Helper RPCs (used in RLS policies)

| RPC | Purpose |
|-----|---------|
| `app_is_platform_super_admin(p_user_id)` | Returns true if user is platform super admin |
| `app_user_has_organization_access(p_org_id, p_user_id)` | Returns true if user has any membership in org |
| `app_user_has_internal_organization_access(p_org_id, p_user_id)` | Returns true if user is owner/admin/manager/employee in org |
| `_rls_user_can_write_org(p_org_id, p_min_roles)` | Returns true if user has required min role in org |
| `app_user_can_select_portal_record(...)` | Portal client record visibility |
| `get_user_organization_role(p_org_id)` | Returns user's role in org |

### Policy Patterns

1. **Platform super admin**: Full access to all data across all orgs
2. **Organization scoping**: All data tables have `organization_id` column; RLS policies use `app_user_has_organization_access()` to enforce
3. **Internal vs portal**: Internal users (owner/admin/manager/employee) get broader access; clients use `app_user_can_select_portal_record()`
4. **Write access**: Uses `_rls_user_can_write_org()` with minimum role requirements
5. **Soft-delete visibility**: Deleted records (`deleted_at IS NOT NULL`) are excluded at the application layer via `applyModuleReadScope`

### Key Migration Files

| Migration | Purpose |
|-----------|---------|
| `004_fix_rls.sql` | Initial RLS policy setup |
| `015_hardened_rls_policies.sql` | Comprehensive RLS hardening |
| `029_harden_portal_client_select_policies.sql` | Portal-specific RLS |
| `030_portal_strict_rls_and_signatures.sql` | Strict portal + signature RLS |

---

## 9. Database RPCs (Remote Procedure Calls)

| RPC | Args | Returns | Purpose |
|-----|------|---------|---------|
| `create_signup_organization` | p_user_id, p_email, p_org_name, p_org_slug, p_org_code | JSON | Creates org + subscription + membership in one transaction |
| `create_signup_profile` | p_user_id, p_full_name | void | Creates user profile |
| `create_client_signup_membership` | p_user_id, p_organization_id | string | Creates client membership |
| `find_signup_organization` | p_slug_or_code | org[] | Lookup org by slug/code |
| `search_signup_organizations` | p_query, p_limit | org[] | Search orgs for client signup |
| `accept_employee_invitation_signup` | p_token, p_user_id, p_employee_id? | string | Accept employee invitation |
| `accept_client_invitation_signup` | p_token, p_user_id | string | Accept client invitation |
| `get_employee_invitation_details` | p_token | invitation details | Preview invitation before accepting |
| `get_client_invitation_details` | p_token | invitation details | Preview client invitation |
| `claim_pending_invitations` | (none) | number | Auto-claim invitations for existing users |
| `hash_invitation_token` | p_token | string | Hash token for secure storage |
| `enqueue_background_job` | p_job_type, p_organization_id, p_payload, p_priority, p_max_attempts, p_available_at | string | Insert job into queue |
| `recompute_quote_totals` | p_quote_id | void | Recalculate quote subtotal/tax/total |
| `get_inventory_value` | (none) | number | Total inventory valuation |
| `get_revenue_mtd` | start_date, end_date | number | Revenue month-to-date |
| `current_app_role` | (none) | string | Get current user's role |

---

## 10. Background Jobs

### Job Types

| Job Type | Handler | Edge Function Invoked |
|----------|---------|----------------------|
| `document.generate` | Background worker | `generate-document` |
| `document.generate_pdf` | Background worker | `convert-to-pdf` |
| `email.send` | Background worker | `send-email` |
| `email.reminder` | Background worker | `send-reminder` |
| `contract.expiry_alert` | Background worker | `contract-expiry-alert` |

### Worker Details (`scripts/background-worker.mjs`)

- Polls `background_jobs` table for `status = 'queued'` and `available_at <= now`
- Orders by priority (ascending) then created_at
- Claims up to 10 jobs per run
- Sets `locked_at`/`locked_by = 'node-worker'` during processing
- On failure: exponential backoff (60s × 2^attempts), max 5 attempts
- Recovers stuck jobs (processing > 1 hour) back to queued

### NPM Scripts

| Command | Purpose |
|---------|---------|
| `npm run jobs:worker` | Run background job worker |
| `npm run jobs:enqueue-expiry-alerts` | Enqueue contract expiry alert jobs |
| `npm run auth:cleanup-precreated-invite-users` | Clean up pre-created invitation users |
| `npm run db:types` | Regenerate Supabase TypeScript types |

---

## 11. Supabase Edge Functions

| Function | Path | Purpose |
|----------|------|---------|
| `send-email` | `functions/send-email/index.ts` | Send transactional emails |
| `send-client-invitation` | `functions/send-client-invitation/index.ts` | Send client invitation emails |
| `send-employee-invitation` | `functions/send-employee-invitation/index.ts` | Send employee invitation emails |
| `send-verification-email` | `functions/send-verification-email/index.ts` | Send email verification |
| `sync-user-verification` | `functions/sync-user-verification/index.ts` | Sync user verification status |
| `log-drain` | `functions/log-drain/index.ts` | Receive production log events |

### Shared Utilities (`functions/_shared/`)

| File | Purpose |
|------|---------|
| `email.ts` | Email sending utility |
| `invitation-email.ts` | Invitation email template |
| `verification-email.ts` | Verification email template |
| `edge-runtime.d.ts` | Type definitions for Deno edge runtime |

---

## 12. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ | Supabase anon/public key |
| `VITE_PUBLIC_APP_URL` | ❌ | Public app URL for links |
| `VITE_AUTH_ROLE_LOOKUP_TIMEOUT_MS` | ❌ (default: 5000) | Role lookup timeout |
| `VITE_AUTH_SESSION_RECOVERY_TIMEOUT_MS` | ❌ (default: 10000) | Session recovery timeout |
| `VITE_DISABLE_INVITE_EMAILS` | ❌ | Disable invitation emails |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ (worker) | Service role key for background worker |

---

## 13. Key File Map

```
main/
├── src/
│   ├── app/
│   │   ├── App.tsx                           # Root router + provider tree
│   │   ├── providers/
│   │   │   ├── AuthProvider.tsx              # Auth state + signup flows
│   │   │   ├── OrganizationProvider.tsx      # Organization context
│   │   │   ├── TenantProvider.tsx            # Tenant compatibility layer
│   │   │   ├── ImpersonationProvider.tsx     # Platform admin impersonation
│   │   │   └── ThemeProvider.tsx             # Dark/light theme
│   │   └── pages/
│   │       ├── NotFound.tsx
│   │       ├── Unauthorized.tsx
│   │       └── PendingApproval.tsx
│   ├── core/
│   │   ├── api/
│   │   │   ├── client.ts                     # Supabase client init + RPC types
│   │   │   ├── types.ts                      # Auto-generated DB types (4020 lines)
│   │   │   └── typed-client.ts               # Type-safe table helper
│   │   ├── auth/
│   │   │   ├── auth-context.ts               # AuthContextType definition
│   │   │   ├── useAuth.ts                    # useAuth hook
│   │   │   ├── membership.ts                 # Role priority / membership picker
│   │   │   └── components/
│   │   │       ├── ProtectedRoute.tsx         # All route guard components
│   │   │       └── TenantSlugGuard.tsx        # Tenant URL resolution
│   │   ├── hooks/
│   │   │   ├── organization-context.ts        # OrganizationContext type
│   │   │   └── useModuleScope.ts              # Module scope context hook
│   │   ├── rbac/
│   │   │   └── usePermissions.ts              # Permission hooks (257 lines)
│   │   ├── tenant/
│   │   │   ├── tenant-context.ts              # TenantContextType
│   │   │   └── useTenant.ts                   # useTenant + useModuleAccess
│   │   ├── types/
│   │   │   ├── base.ts                        # TenantScoped interface
│   │   │   ├── roles.ts                       # Role hierarchy + helpers
│   │   │   ├── modules.ts                     # ModuleType enum
│   │   │   ├── organization.ts                # Organization types
│   │   │   ├── tenant.ts                      # Tenant types (compat)
│   │   │   ├── shared.ts                      # Product/Quote shared types
│   │   │   ├── crm.ts                         # CRM entity types
│   │   │   ├── cpq.ts                         # CPQ entity types
│   │   │   ├── clm.ts                         # CLM entity types
│   │   │   ├── erp.ts                         # ERP entity types
│   │   │   └── documents.ts                   # Document entity types
│   │   └── utils/
│   │       ├── audit.ts                       # Audit log utilities
│   │       ├── cache.ts                       # QueryClient + clearAllCaches
│   │       ├── data-ownership.ts              # Legacy ownership scope helpers
│   │       ├── env.ts                         # Env validation (zod schema)
│   │       ├── errors.ts                      # getErrorMessage utility
│   │       ├── jobs.ts                        # Job enqueueing utilities
│   │       ├── logger.ts                      # Structured logger
│   │       ├── module-scope.ts                # Module read/write/create scope
│   │       ├── modules.ts                     # Plan → module mapping
│   │       ├── routes.ts                      # Route path generators
│   │       └── soft-delete.ts                 # Soft delete/restore utilities
│   ├── modules/
│   │   ├── crm/
│   │   │   ├── hooks/useCRM.ts                # CRM data hooks (1590 lines)
│   │   │   └── pages/                         # CRMLayout, Leads, Pipeline, etc.
│   │   ├── cpq/
│   │   │   ├── hooks/useCPQ.ts                # CPQ data hooks (788 lines)
│   │   │   └── pages/                         # CPQDashboard, Products, Quotes, etc.
│   │   ├── clm/
│   │   │   ├── hooks/useCLM.ts                # CLM data hooks (746 lines)
│   │   │   └── pages/                         # CLMDashboard, Contracts, etc.
│   │   ├── erp/
│   │   │   ├── hooks/useERP.ts                # ERP data hooks (1168 lines)
│   │   │   └── pages/                         # ERPDashboard, Inventory, etc.
│   │   └── documents/
│   │       ├── hooks/useDocuments.ts           # Documents data hooks (1006 lines)
│   │       ├── providers/DocumentsRealtimeProvider.tsx
│   │       └── pages/                         # DocumentsDashboard, Create, etc.
│   ├── workspaces/
│   │   ├── auth/pages/                        # Sign-in, Sign-up, Invitation acceptance
│   │   ├── website/pages/                     # Marketing pages (Index, About, etc.)
│   │   ├── employee/pages/                    # Employee dashboard
│   │   ├── organization/                      # Org owner pages + hooks
│   │   ├── organization_admin/                # Tenant admin layout + dashboard
│   │   ├── platform/                          # Platform admin layout + panels
│   │   └── portal/                            # Customer portal layout + pages
│   ├── ui/                                    # shadcn components + custom UI
│   ├── hooks/                                 # App-level hooks
│   ├── data/                                  # Static data / mock data
│   ├── database/                              # Database helpers
│   ├── styles/                                # Global styles
│   └── test/                                  # Test utilities
├── supabase/
│   ├── config.toml                            # Supabase project config
│   ├── functions/                             # 6 Edge Functions
│   │   ├── _shared/                           # Shared email utilities
│   │   ├── log-drain/
│   │   ├── send-client-invitation/
│   │   ├── send-email/
│   │   ├── send-employee-invitation/
│   │   ├── send-verification-email/
│   │   └── sync-user-verification/
│   └── migrations/                            # 30+ SQL migrations
│       ├── 002_reset_and_seed.sql
│       ├── ...
│       └── 030_portal_strict_rls_and_signatures.sql
├── scripts/
│   ├── background-worker.mjs                  # Job processing worker
│   ├── cleanup-precreated-invite-users.mjs    # Auth cleanup script
│   ├── enqueue-contract-expiry-alerts.mjs     # Cron-style expiry alerts
│   └── generate-supabase-types.mjs            # Type generation script
├── package.json
├── vite.config.ts
├── tsconfig.app.json
└── tsconfig.node.json
```

---

## 14. Migrations Summary (30 files)

| # | File | Purpose |
|---|------|---------|
| 002 | `reset_and_seed.sql` | Core schema + seed data |
| 003 | `add_platform_admin.sql` | Platform admin role |
| 004 | `fix_rls.sql` | Initial RLS policies |
| 005 | `create_user_roles.sql` | User roles table |
| 006 | `v2_foundation.sql` | V2 architecture (orgs, memberships, subscriptions) |
| 007 | `org_native_auth_reset.sql` | Native auth refactor |
| 008 | `signup_org_lookup_rpc.sql` | Organization lookup RPCs |
| 009 | `auth_signup_rls_fixes.sql` | Signup RLS fixes |
| 010 | `restore_public_grants.sql` | Restore public schema grants |
| 011 | `fix_organization_select_policy.sql` | Org select policy fix |
| 012 | `claim_pending_invitations.sql` | Auto-claim invitation RPC |
| 013 | `signup_profile_rpc.sql` | Profile creation RPC |
| 014 | `signup_organization_rpc.sql` | Organization creation RPC |
| 015 | `hardened_rls_policies.sql` | Comprehensive RLS hardening |
| 016 | `add_tenant_to_child_tables.sql` | Add tenant_id to child tables |
| 017 | `add_crm_columns.sql` | CRM-specific columns |
| 018 | `add_missing_columns.sql` | General missing columns |
| 019 | `add_more_missing_columns.sql` | Additional columns |
| 020 | `add_missing_rpcs.sql` | Additional RPCs |
| 021 | `add_org_id_to_child_tables.sql` | Add organization_id to child tables |
| 022 | `add_accounts_description_and_financial_reference_type.sql` | Account/financial columns |
| 023 | `add_soft_delete_to_quote_line_items.sql` | Soft delete for quote items |
| 024 | `add_cost_price_to_products.sql` | Product cost price |
| 025 | `quote_totals_trigger.sql` | Auto-recompute quote totals trigger |
| 026 | `enforce_child_scope_not_null.sql` | NOT NULL on child org/tenant columns |
| 027 | `add_missing_clm_documents_columns.sql` | CLM + Documents columns |
| 028 | `add_is_public_to_contract_templates.sql` | Public template flag |
| 029 | `harden_portal_client_select_policies.sql` | Portal RLS hardening |
| 030 | `portal_strict_rls_and_signatures.sql` | Strict portal + signature policies |

---

## 15. Key Design Decisions

1. **Dual-ID pattern**: Both `organization_id` and `tenant_id` exist on every data table. `tenant_id` is a legacy alias kept synchronized for backward compatibility. The codebase is migrating from "tenant" to "organization" terminology.

2. **Client-side scoping**: Although RLS provides server-side security, the application layer adds explicit scoping via `applyModuleReadScope()` / `applyModuleMutationScope()` for defense-in-depth and to support owner-based row filtering.

3. **Quote totals**: CPQ uses both client-side calculation (`calculateQuoteTotals`) and a database trigger/RPC (`recompute_quote_totals`) for consistency.

4. **Documents realtime**: The Documents module has a `DocumentsRealtimeProvider` wrapping its routes, suggesting Supabase realtime subscriptions for live document updates.

5. **Background job strategy**: Jobs are enqueued client-side but processed by a Node.js worker that invokes Edge Functions. This keeps the frontend responsive while enabling complex server-side logic.

6. **Soft delete convention**: CLM (contracts, templates, scans), ERP (suppliers, inventory, purchase orders, production orders), and Documents use soft delete (`deleted_at`, `deleted_by`). CRM entities use hard delete. Quote line items have soft delete.
