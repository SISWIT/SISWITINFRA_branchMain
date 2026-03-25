# PROJECT_AUDIT_REPORT.md

```
Author: PiyushSolanki
Date: 2026-03-
Status: COMPLETE
```
## Section 1 — Database (Supabase)

### Tables

```
Table Key Columns RLS Status
```
tenants id (uuid PK), name, slug, company_name, plan_type, status, max_users,
max_storage_mb

#### 

```
Yes
```
#### 

tenant_users id, tenant_id (FK), user_id, role, is_active, is_approved 
Yes

#### 

tenant_subscriptions id, tenant_id (FK), module_crm/clm/cpq/erp/documents (booleans), status,
billing_email

#### 

```
Yes
```
#### 

tenant_invitations id, tenant_id (FK), email, role, status, token 
Yes

#### 

tenant_clients id, tenant_id (FK), user_id, client_company 
Yes

#### 

platform_admins id, user_id, is_active 
Yes

#### 

user_roles id, user_id, role, is_platform_admin, approved 
Yes

#### 

signup_requests id, user_id, email, request_type, status 
Yes

#### 

admin_pending_approvals id, user_id, email, role, tenant_id, status 
Yes

#### 

profiles id (=auth.uid), full_name, avatar_url, email_verified 
Yes

#### 

organizations id, name, slug, owner_id, plan_type, settings (jsonb) 
Yes

#### 

organization_memberships id, organization_id (FK), user_id, role (app_role enum) 
Yes

#### 

organization_subscriptionsid, organization_id (FK), plan_type, status, subscription_start/end_date 
Yes

#### 

accounts id, name, industry, website, phone, domain, billing_*, annual_revenue, owner_id,
org_id, deleted_at/by

#### 

```
Yes
```
#### 

contacts id, first_name, last_name, email, phone, account_id (FK), owner_id, org_id,
deleted_at/by

#### 

```
Yes
```
#### 

leads id, first_name, last_name, email, phone, company, lead_status, lead_source,
owner_id, org_id, deleted_at/by

#### 

```
Yes
```
#### 

opportunities id, name, account_id, contact_id, stage, amount, probability, close_date, owner_id,
org_id, deleted_at/by

#### 

```
Yes
```
#### 

activities id, type, subject, description, due_date, related_to_type/id, owner_id, org_id,
deleted_at/by

#### 

```
Yes
```
#### 

products id, name, sku, description, list_price, cost_price, is_active, org_id, deleted_at/by 
Yes

#### 

quotes id, quote_number, account_id, contact_id, opportunity_id, status, subtotal,
discount/tax_percent/amount, total_amount, owner_id, org_id

#### 

```
Yes
```
#### 

quote_items id, quote_id (FK), product_id, quantity, unit_price, deleted_at/by 
Yes

#### 

quote_line_items id, quote_id (FK), product_id, product_name, quantity, unit_price, discount_percent,
total, sort_order, org_id, deleted_at/by

#### 

```
Yes
```
#### 

contract_templates id, name, type, content, is_active, is_public, tenant_id, created_by, deleted_at/by 
Yes

#### 

contracts id, name, contract_number, template_id, account_id, contact_id, status, content,
start/end_date, value, owner_id, org_id, deleted_at/by

#### 

```
Yes
```
#### 

contract_esignatures id, contract_id (FK), signer_email, signer_name, status, signed_at, org_id 
Yes

#### 

contract_scans id, contract_id (FK), file_url, file_name, extracted_text, org_id, created_by,
deleted_at/by

#### 

```
Yes
```
#### 

document_templates id, name, type, content, variables (jsonb), is_active, is_public, tenant_id, created_by,
deleted_at/by

#### 

```
Yes
```
#### 

auto_documents id, name, type, status, content, template_id, file_path/name/size, owner_id,
created_by, org_id, deleted_at/by

#### 

```
Yes
```
#### 


```
Table Key Columns RLS Status
```
document_versions id, document_id (FK), version_number, content, file_path/name/size, org_id,
deleted_at/by

#### 

```
Yes
```
document_esignatures id, document_id (FK), recipient_name/email, status, signed_at, expires_at,
reminder_count, org_id

#### 

```
Yes
```
document_permissions id, document_id (FK), user_id, permission_type, shared_by, org_id 
Yes

suppliers id, name, email, phone, website, address/city/state/country/zip, payment_terms,
rating, is_active, tenant_id, created_by, deleted_at/by

#### 

```
Yes
```
inventory_items id, product_id (FK), quantity_on_hand/reserved/available, reorder_point/quantity,
average_cost, warehouse_location, org_id

#### 

```
Yes
```
purchase_orders id, po_number, supplier_id (FK), status, order_date, expected/actual_delivery_date,
subtotal/tax/shipping/total, org_id, created_by, deleted_at/by

#### 

```
Yes
```
purchase_order_items id, purchase_order_id (FK), product_id, product_name, quantity_ordered, unit_price,
total_price, org_id, deleted_at/by

#### 

```
Yes
```
production_orders id, order_number, product_id, status, quantity_to_produce/produced,
start/end/actual_end_date, org_id, created_by, deleted_at/by

#### 

```
Yes
```
financial_records id, record_type, record_date, category, description, amount, reference_number/type,
status, org_id, created_by, deleted_at/by

#### 

```
Yes
```
contact_inquiries id, name, email, subject, message, created_at 
Yes

audit_logs id, tenant_id, user_id, action, entity_type, entity_id, old/new_values (jsonb), metadata,
impersonated_by, ip_address

#### 

```
Yes
```
impersonation_sessions id, platform_admin_user_id, tenant_id, tenant_slug, started_at, ended_at, reason,
metadata

#### 

```
Yes
```
background_jobs id, tenant_id, job_type, payload (jsonb), status, priority, available_at, attempts,
max_attempts, locked_at/by, created_by

#### 

```
Yes
```
plan_limits id, organization_id (FK), resource_type, max_allowed, period, UNIQUE(org_id,
resource_type)

#### 

```
Yes
```
usage_tracking id, organization_id (FK), resource_type, current_count, period_start/end,
last_incremented_at, UNIQUE(org_id, resource_type)

#### 

```
Yes
```
addon_purchases id, organization_id (FK), addon_key, quantity, status, purchased_at, UNIQUE(org_id,
addon_key)

#### 

```
Yes
```
```
⚠ Migration
not deployed
```
billing_customers id, organization_id (FK UNIQUE), razorpay_customer_id (UNIQUE),
razorpay_subscription_id, billing_email, billing_contact_name

#### 

```
Yes
```
```
⚠ Migration
not deployed
```
### RPCs / Functions

```
Function Parameters Returns Purpose Status
```
app_is_platform_admin user_id uuid booleanCheck if user is platform
admin

#### 

app_is_platform_super_admin user_id uuid booleanCheck if user is super
admin

#### 

app_user_has_tenant_access tenant_id uuid, user_id uuid booleanCheck tenant access 

app_user_has_organization_access org_id uuid booleanCheck org membership 

_rls_user_can_write_org org_id uuid, roles app_role[] booleanRLS helper for write
access

#### 

app_user_can_select_portal_recordorg_id uuid booleanPortal record access 

touch_updated_at trigger trigger Auto-update updated_at 

enqueue_background_job tenant_id, job_type, payload, priority,
available_at, max_attempts

```
uuid Queue async job 
```
check_plan_limit org_id uuid, resource_type text json Check if resource creation
is allowed

#### 

increment_usage org_id uuid, resource_type text, amount bigint json Increment usage counter 

decrement_usage org_id uuid, resource_type text, amount bigint void Decrement usage counter

get_organization_usage org_id uuid json Get all usage data for org 

seed_plan_limits_for_organizationorg_id uuid, plan_type text void Seed limits for 4 plan tiers

upgrade_organization_plan org_id uuid, new_plan text booleanUpgrade plan + reseed
limits

#### 

recompute_quote_totals quote_id uuid void Recalculate quote totals 

signup_and_create_organization — json Create org during signup 

accept_employee_invitation_signup— json Accept employee
invitation

#### 

accept_client_invitation_signup — json Accept client invitation 

purchase_addon org_id, addon_key, quantity json Purchase add-on, update
plan_limits

```
⚠ Not
deployed
```
create_billing_customer org_id, email, name json Create billing customer
record

```
⚠ Not
deployed
```
get_billing_info org_id json Get billing + subscription
info

```
⚠ Not
deployed
```

### Migration Files

**File What It Does Deployed**
002_reset_and_seed.sql Reset all data, seed SISWIT tenant  Yes

003_add_platform_admin.sql Add platform admin role  Yes

004_fix_rls.sql RLS policy fixes  Yes

005_create_user_roles.sql Create user_roles table  Yes

006_v2_foundation.sql audit_logs, impersonation_sessions, background_jobs, soft-delete Yes

007_org_native_auth_reset.sql Organization native auth schema  Yes

008_signup_org_lookup_rpc.sql Signup + org lookup RPC  Yes

009_auth_signup_rls_fixes.sql Auth signup RLS fixes  Yes

010_restore_public_grants.sql Restore public grants  Yes

011_fix_organization_select_policy.sql Fix org select policy  Yes

012_claim_pending_invitations.sql Claim pending invitations  Yes

013_signup_profile_rpc.sql Signup profile RPC  Yes

014_signup_organization_rpc.sql Signup organization RPC  Yes

015_hardened_rls_policies.sql Comprehensive RLS hardening for all tables  Yes

016_add_tenant_to_child_tables.sql Add tenant_id FK to child tables  Yes

017_add_crm_columns.sql Add CRM-specific columns  Yes

018_add_missing_columns.sql Add missing columns  Yes

019_add_more_missing_columns.sql More missing columns  Yes

020_add_missing_rpcs.sql Add missing RPCs  Yes

021_add_org_id_to_child_tables.sql Add organization_id to child tables  Yes

022_add_accounts_description*.sql Add description/financial_reference_type  Yes

023_add_soft_delete_to_quote_line_items.sql Soft-delete for quote_line_items  Yes

024_add_cost_price_to_products.sql Add cost_price to products  Yes

025_quote_totals_trigger.sql recompute_quote_totals trigger/RPC  Yes

026_enforce_child_scope_not_null.sql NOT NULL constraints on org_id columns  Yes

027_add_missing_clm_documents_columns.sql CLM/Documents column additions  Yes

028_add_is_public_to_contract_templates.sql Add is_public column  Yes

029_harden_portal_client_select_policies.sqlPortal client RLS hardening  Yes

030_portal_strict_rls_and_signatures.sql Strict portal RLS  Yes

031_create_contact_inquiries.sql contact_inquiries table  Yes

032_fix_qli_select_policy.sql Fix quote_line_items select policy  Yes

034_fix_employee_permissions.sql Fix employee permission policies  Yes

035_fix_rls_recursion.sql Fix recursive RLS issues  Yes

036_fix_more_rls_recursion.sql Fix more RLS recursion  Yes

037_drop_bad_crm_policies.sql Drop conflicting CRM policies  Yes

039_fix_manager_delete_policy.sql Fix manager delete policy  Yes

040_invitation_signup_rpcs.sql Invitation signup RPCs  Yes

042_usage_tracking_cron_jobs.sql Daily/monthly usage reset cron jobs  Yes

043_upgrade_plan_rpc.sql upgrade_organization_plan RPC  Yes

044_plan_limits_and_usage_tracking.sql plan_limits + usage_tracking tables + RPCs  Yes

046_sync_user_verification_trigger.sql User verification sync trigger  Yes

047_addon_purchasing.sql addon_purchases table + purchase_addon RPC  Not deployed

048_billing_integration.sql billing_customers table + billing RPCs  Not deployed

```
Note : Missing migration numbers (001, 033, 038, 041, 045) — either these were removed/replaced or numbering gaps exist.
```
## Section 2 — Backend / Supabase Edge Functions

### Edge Functions

```
Function Path Purpose Status
```
send-email supabase/functions/send-email/ Send transactional emails ⚠ Skeleton only

send-employee-invitationsupabase/functions/send-employee-invitation/Send employee invitation emails ⚠ Skeleton only

send-client-invitation supabase/functions/send-client-invitation/ Send client invitation emails ⚠ Skeleton only

send-verification-email supabase/functions/send-verification-email/ Send email verification ⚠ Skeleton only

sync-user-verification supabase/functions/sync-user-verification/ Sync user email verification status⚠ Skeleton only

log-drain supabase/functions/log-drain/ Log drain endpoint ⚠ Skeleton only

_shared supabase/functions/_shared/ Shared utilities for edge functions⚠ Partial

### Cron Jobs


**Name Schedule Purpose Status**
reset-daily-usage 0 0 * * * (midnight daily)Reset current_count=0 for daily resources (api_calls)  Deployed

reset-monthly-usage0 0 1 * * (1st of month) Reset current_count=0 for monthly resources (quotes, esignatures) Deployed

## Section 3 — Frontend: Core & Shared

### src/core/api/

**File Exports Status**
client.ts supabase — Supabase client singleton 
typed-
client.ts Typed Supabase client wrapper 

types.ts Auto-generated Supabase TypeScript types (Database) ⚠^ Missing addon_purchases, billing_customers — needs
regeneration

addons.ts purchaseAddon(), getOrganizationAddons() — addon API
functions ⚠^ Uses as any (migration not deployed)

### src/core/auth/

**File Exports Status**
auth-context.ts AuthContext — React context for auth state 

useAuth.ts useAuth() — hook for auth state (user, role, loading) 

membership.ts Membership utilities 

components/ProtectedRoute.tsx PlatformAdminRoutePendingApprovalRoute, TenantAdminRoute, OrganizationOwnerRoute, CustomerRoute, 

components/TenantSlugGuard.tsxValidates tenant slug in URL 

__tests__/auth.smoke.test.ts Auth smoke test 

### src/core/hooks/

**File Exports Status**
organization-
context.ts OrganizationContext — React context 
use-toast.ts useToast() hook 

useImpersonation.ts useImpersonation() — platform admin impersonation 

useModuleScope.ts useModuleScope() — returns scope, tenantId, userId, role, enabled 

usePlanLimits.ts usePlanLimits() — checkLimit, incrementUsage, decrementUsage, getEffectiveLimit,
upgradeOrganizationPlan

#### 

useTheme.ts useTheme() — dark/light mode 

### src/core/rbac/

**File Exports Status**
usePermissions.tsusePermissions() — role-based permission checks

### src/core/tenant/

**File Exports Status**
tenant-context.tsTenantContext — React context 

useTenant.ts useTenant() — tenant state (tenant, slug, loading)

### src/core/types/

**File Key Exports Status**
base.ts Base types (Timestamps, SoftDelete, etc.) 

crm.ts Account, Contact, Lead, Opportunity, Activity, Product, Quote, QuoteItem types 

cpq.ts CPQ-specific types (Product, Quote, QuoteItem, QuoteStatus) 

clm.ts Contract, ContractTemplate, ContractScan, ESignature, CLMDashboardStats 

documents.ts DocumentTemplate, AutoDocument, DocumentVersion, DocumentESignature, DocumentPermission 

erp.ts Supplier, InventoryItem, PurchaseOrder/Item, ProductionOrder, FinancialRecord 

modules.ts Module type definitions 

organization.tsOrganization types 

roles.ts AppRole enum, role helper functions (isPlatformRole, isTenantUserRole, canReadAllTenantRows,
isOwnerScopedRole) 
shared.ts Shared types 

tenant.ts Tenant types 

### src/core/utils/


```
FileFile Key ExportsKey Exports StatusStatus
```
audit.ts safeWriteAuditLog() — writes audit log entries 

cache.ts queryClient — React Query client configuration 

data-
ownership.ts Data ownership utilities 
env.ts Environment variable accessors 

errors.ts getErrorMessage() — safe error message extraction 

jobs.ts enqueueEmailSendJob(), enqueueReminderJob(), enqueueContractExpiryAlert(), enqueueDocumentPdfJob(),
safeEnqueueJob() 
logger.ts Logging utility (1 as any, 1 eslint-disable) 

module-scope.tsapplyModuleReadScope()requireOrganizationScope(), applyModuleMutationScope(), buildModuleCreatePayload(), 

modules.ts Module configuration 

plan-limits.ts PlanType, ResourceType, PLAN_LIMITS, PLAN_PRICES, ADD_ONS, helper functions 

routes.ts Route helper functions (platformPath, tenantPortalPath, normalizeLegacyDashboardPath) 

soft-delete.ts softDeleteRecord() — soft-delete utility 

utils.ts General utilities 

## Section 4 — Frontend: Modules

### CRM Module

```
File Purpose Limit Checks Status
```
hooks/useCRM.ts (1667 lines)

```
Full CRUD for Leads, Accounts, Contacts,
Opportunities, Activities + Dashboard stats
```
 create: leads, accounts, contacts,
opportunities;  delete: decrement 
pages/CRMDashboard.tsx CRM dashboard with stats cards — 

pages/CRMLayout.tsx CRM module layout — 

pages/LeadsPage.tsx Leads list + CRUD — 

pages/AccountsPage.tsx Accounts list + CRUD — 

pages/ContactsPage.tsx Contacts list + CRUD — 

pages/OpportunitiesPage.tsx Opportunities list + CRUD — 

pages/PipelinePage.tsx Opportunity pipeline view — 

pages/ActivitiesPage.tsx Activities list + CRUD — 

components/DataTable.tsx Reusable data table — 

components/OpportunityPipeline.tsxPipeline visualization — 

components/StatsCard.tsx Dashboard stats card — 

```
Missing : No plan limit check on Activities create (not a tracked resource).
```
### CPQ Module

```
File Purpose Limit Checks Status
```
hooks/useCPQ.ts (844 lines)

```
Full CRUD for Products, Quotes, QuoteItems,
QuoteStatus transitions
```
 create: products, quotes;  delete:
decrement 
pages/CPQDashboard.tsx CPQ dashboard — 

pages/ProductsPage.tsx Products list + CRUD — 

pages/QuotesListPage.tsx Quotes list — 

pages/QuoteBuilderPage.tsx Quote builder — 

pages/QuoteDetailPage.tsx Quote detail view — 

components/QuotePDFTemplate.tsxQuote PDF template — 

### CLM Module

```
File Purpose Limit Checks Status
```
hooks/useCLM.ts (810 lines) Full CRUD for Contracts, ContractTemplates,
ESignatures, ContractScans + Dashboard stats

```
 create: contracts, contract_templates,
esignatures;  delete: decrement
```
#### 

pages/CLMDashboard.tsx CLM dashboard with stats — 

pages/ContractsPage.tsx Contracts page — 

pages/ContractsListPage.tsx Contracts list — 

pages/ContractBuilderPage.tsxContract builder — 

pages/ContractDetailPage.tsx Contract detail view — 

pages/ContractScanPage.tsx Contract scan upload — 

pages/ESignaturePage.tsx E-signature management — 

pages/TemplatesPage.tsx Contract templates — 

### Documents Module

```
File Purpose Limit Checks Status
```

```
File Purpose Limit Checks Status
```
hooks/useDocuments.ts (1057 lines)

```
Full CRUD for DocumentTemplates,
AutoDocuments, DocumentESignatures,
DocumentVersions, Permissions
```
```
 create: documents,
document_templates;  delete:
decrement
```
#### 

pages/DocumentsDashboard.tsx Documents dashboard — 

pages/DocumentTemplatesPage.tsx Templates management — 

pages/DocumentCreatePage.tsx Create document — 

pages/DocumentHistoryPage.tsx Document version history — 

pages/DocumentESignPage.tsx Document e-sign page — 

pages/PendingSignaturesPage.tsx Pending signatures list — 

providers/DocumentsRealtimeProvider.tsxSupabase realtime for documents — 

### ERP Module

```
File Purpose Limit Checks Status
```
hooks/useERP.ts (
lines)

```
Full CRUD for Suppliers, InventoryItems, PurchaseOrders/Items,
ProductionOrders, FinancialRecords + Dashboard stats
```
```
 create: suppliers,
purchase_orders;  delete:
decrement
```
#### 

pages/ERPDashboard.tsx ERP dashboard with stats — 

pages/InventoryPage.tsx Inventory management — 

pages/ProcurementPage.tsxPurchase orders + suppliers — 

pages/ProductionPage.tsx Production orders — 

pages/FinancePage.tsx Financial records — 

## Section 5 — Frontend: Organization / Settings

**File Purpose Status**
components/OrganizationOwnerLayout.tsx Layout wrapper with sidebar + top bar 

components/OrganizationSidebar.tsx Sidebar nav: Overview, Users, Invitations, Approvals, Plans,
Billing, Alerts, Settings

#### 

components/OrganizationTopBar.tsx Top bar with user info 

components/OrganizationStatCard.tsx Stat card component 

components/OrganizationActivityCard.tsx Activity card 

components/OrganizationAnalyticsCard.tsxAnalytics card 

components/OrganizationProgressCard.tsx Progress card 

components/OrganizationAlertsPanel.tsx Alerts panel 

hooks/useOrganization.ts Organization context hook 

hooks/useOrganizationOwnerData.ts Dashboard data for org owners 

hooks/useBilling.ts useBillingInfo(), useCreateBillingCustomer() ⚠^ Uses as any (migration not
deployed)
pages/OrganizationOverviewPage.tsx Org dashboard overview 

pages/OrganizationUsersPage.tsx User management 

pages/OrganizationInvitationsPage.tsx Invitation management 

pages/OrganizationApprovalsPage.tsx Client approval management 

pages/OrganizationPlansPage.tsx Plan display + upgrade 

pages/OrganizationBillingPage.tsx Billing setup + info display ⚠^ Depends on undeployed
migration 048
pages/OrganizationAlertsPage.tsx Alerts page 

pages/OrganizationSettingsPage.tsx Org settings (editable name, slug, etc.) 

## Section 6 — Frontend: UI Components

### src/ui/components/

**File Purpose Status**
ErrorBoundary.tsxReact error boundary with fallback UI

NavLink.tsx Navigation link component 

ScrollToTop.tsx Scroll to top on route change 

### src/ui/feedback/

**File Purpose Status**
sonner.tsx Sonner toast provider

toast.tsx Toast component 

toaster.tsx Toaster component 

use-toast.tsuseToast hook 


### src/ui/ (Root Level)

```
File Purpose Used On Status
plan-limit-banner.tsxPlan limit usage banner with progress bars All module pages 
upgrade-prompt.tsx Upgrade prompt dialog with plan comparisonTriggered by limit checks
```
### src/ui/shadcn/ (50+ components)

```
All standard shadcn/ui components present: accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command,
```
context-menu, dialog, drawer, dropdown-menu, form, hover-card, input, input-otp, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, RoleBadge,

```
scroll-area, select, separator, sheet, sidebar, skeleton, slider, switch, table, tabs, textarea, toast, toggle, toggle-group, tooltip.
```
```
Status :  Complete — all shadcn components functional.
```
## Section 7 — Routing & Navigation

```
Route Page File In Nav Status
/ website/pages/Index.tsx Public nav 
/about website/pages/About.tsx Public nav 
/contact website/pages/Contact.tsx Public nav 
/pricing website/pages/Pricing.tsx Public nav 
/products website/pages/Products.tsx Public nav 
/solutions website/pages/Solutions.tsx Public nav 
/privacy website/pages/Privacy.tsx Footer 
/terms website/pages/Terms.tsx Footer 
/cookies website/pages/Cookies.tsx Footer 
/auth/sign-in auth/pages/Auth.tsx — 
/auth/sign-up auth/pages/SignUp.tsx — 
/auth/accept-invitation auth/pages/AcceptEmployeeInvitation.tsx— 
/auth/accept-client-invitation auth/pages/AcceptClientInvitation.tsx — 
/auth/forgot-password auth/pages/ForgotPassword.tsx — 
/auth/reset-password auth/pages/ResetPassword.tsx — 
/auth/verify-success auth/pages/VerifySuccess.tsx — 
/unauthorized app/pages/Unauthorized.tsx — 
/pending-approval app/pages/PendingApproval.tsx — 
/organization → redirect to
/organization/overview — — 
/organization/overview OrganizationOverviewPage.tsx Sidebar 
/organization/users OrganizationUsersPage.tsx Sidebar 
/organization/invitations OrganizationInvitationsPage.tsx Sidebar 
/organization/approvals OrganizationApprovalsPage.tsx Sidebar 
/organization/plans OrganizationPlansPage.tsx Sidebar 
```
```
/organization/billing OrganizationBillingPage.tsx Sidebar ⚠^ Depends on undeployed
migration
/organization/alerts OrganizationAlertsPage.tsx Sidebar 
/organization/settings OrganizationSettingsPage.tsx Sidebar 
```
```
/platform PlatformAdminDashboard.tsx Platform
sidebar 
```
```
/platform/tenants TenantsPanel.tsx Platform
sidebar 
```
```
/platform/users UsersPanel.tsx Platform
sidebar 
```
```
/platform/billing BillingPanel.tsx Platform
sidebar 
```
```
/platform/settings SettingsPanel.tsx Platform
sidebar 
```
```
/platform/audit-logs AuditLogsPanel.tsx Platform
sidebar 
```
```
/:tenantSlug/app/dashboard Dashboard.tsxOrganizationAdminDashboard.tsx or Employee
sidebar 
```
```
/:tenantSlug/app/crm/* CRM module pages (7 sub-routes) Employee
sidebar 
```
```
/:tenantSlug/app/cpq/* CPQ module pages (4 sub-routes) Employee
sidebar 
```
```
/:tenantSlug/app/clm/* CLM module pages (6 sub-routes) Employee
sidebar 
```
```
/:tenantSlug/app/documents/* Documents module pages (5 sub-routes) Employee
sidebar 
```

```
Route Page File In Nav Status
```
/:tenantSlug/app/erp/* ERP module pages (4 sub-routes) Employee
sidebar

#### 

/:tenantSlug/portal/* Customer portal pages (7 sub-routes) Portal sidebar 

/dashboard/* Legacy redirect → tenant slug path — 

/portal/* Legacy redirect → tenant portal path — 

/admin/* Legacy redirect → /platform/* — 

## Section 8 — What Is 100% Complete

```
 Multi-tenant architecture with organizations, memberships, subscriptions
 Full RLS on all 44+ tables with helper functions
 Platform admin workspace (dashboard, tenants, users, billing, settings, audit logs)
 Organization owner workspace (overview, users, invitations, approvals, plans, alerts, settings)
 CRM module: Leads, Accounts, Contacts, Opportunities, Activities, Pipeline, Dashboard
 CPQ module: Products, Quotes, Quote Builder, Quote Detail, Dashboard
 CLM module: Contracts, Contract Templates, E-Signatures, Contract Scans, Dashboard
 Documents module: Templates, Auto-documents, E-Signatures, Versions, Permissions, PDF generation, Realtime
 ERP module: Suppliers, Inventory, Purchase Orders, Production Orders, Financial Records, Dashboard
 Customer portal: Dashboard, Quotes, Contracts, Documents, Pending Signatures, Detail views
 Employee workspace: Dashboard with module links
 Public website: Home, About, Contact, Pricing, Products, Solutions, Privacy, Terms, Cookies
 Auth flows: Sign-in, Sign-up (employee + organization + client), Forgot/Reset Password, Verify Email
 Invitation flows: Employee invitations, Client invitations
 Plan limits & usage tracking (plan_limits + usage_tracking tables, 5 RPCs, cron jobs)
 Plan limit checks integrated in ALL module create/delete hooks
 Plan limit banner + upgrade prompt UI components
 Plan upgrade flow (upgrade_organization_plan RPC + frontend)
 Soft-delete across 25+ tables with deleted_at/deleted_by columns
 Audit logging on all CRUD operations
 Background jobs queue system
 Module scope (org/tenant/user scoping) on all queries/mutations
 RBAC (role-based access control) with protected routes
 Impersonation for platform admins
 TypeScript types for all modules
 50+ shadcn/ui components
 Error boundaries, scroll-to-top, loading states
 Sonner toast notifications throughout
 Legacy route redirects (dashboard, portal, admin)
 Dark/light theme support
 Quote totals auto-calculation (trigger + helper functions)
```
## Section 9 — What Is Incomplete or Broken

```
# Item File(s) Problem SeverityEffort Fix
```
#### 1

```
Migrations
047/048 not
deployed
```
```
047_addon_purchasing.sql,
048_billing_integration.sql
```
```
Tables addon_purchases and
billing_customers do not exist in
the live database. Frontend code
uses as any casts.
```
#### 

```
Critical
```
```
5 minRun both SQL files in Supabase SQL
Editor
```
#### 2

```
Supabase
types not
regenerated
```
```
src/core/api/types.ts
```
```
Generated types do not include:
addon_purchases,
billing_customers, purchase_addon,
create_billing_customer,
get_billing_info,
upgrade_organization_plan
```
#### 

```
Critical
```
```
2 min
```
```
Run npx supabase gen types
typescript --project-id
swzepbbpbeoqbiavidfh >
src/core/api/types.ts
```
3 Plan limits
not seeded

```
plan_limits table
```
```
No data exists —
seed_plan_limits_for_organization
has not been run for existing orgs
```
```
 High 2 min
```
```
Run: SELECT
seed_plan_limits_for_organization(i
COALESCE(plan_type, 'foundation'))
FROM organizations;
```
#### 4

```
Edge
functions
are
skeleton-
only
```
```
supabase/functions/send-
email/, etc.
```
```
No actual email sending logic —
invitation emails, signature
requests, etc. are enqueued to
background_jobs but never actually
sent
```
```
 High
```
#### 4-

```
hrs
```
```
Implement edge functions with
Resend/SendGrid/SMTP
```

```
# Item File(s) Problem SeverityEffort Fix
```
5 Add-on key
mismatch

```
src/core/utils/plan-
limits.ts vs
047_addon_purchasing.sql
```
```
Frontend ADD_ONS defines
extra_users_10, extra_storage_5gb,
extra_esignatures_50. But the RPC
purchase_addon handles
extra_contacts_500,
extra_storage_10gb,
extra_api_calls_5000. Different
keys and amounts.
```
```
 High^30
min
```
```
Align ADD_ONS constant with
purchase_addon RPC, or update one
match the other
```
#### 6

```
Billing page
visible but
non-
functional
```
```
OrganizationBillingPage.tsx
```
```
Shows "Setup Billing" form, but
actual Razorpay integration does
not exist — only creates a
placeholder cust_ UUID
```
#### 

```
Medium
```
#### 8-

```
hrs
```
```
Implement Razorpay checkout flow in
edge function + webhook
```
#### 7

```
.env
exposes DB
password
```
```
.env line 4
```
```
SUPABASE_DB_PASSWORD is in plain text
in the repo  High 5 min
```
```
Move to .env.local (gitignored) or use
Supabase dashboard secrets
```
## Section 10 — What Is Not Built Yet (Missing Features)

```
Feature Why It Matters Files to Create Files to Modify Effort Dependencies
```
Razorpay
payment
integration

```
No actual payment
processing — can't collect
money
```
```
Edge function for checkout,
webhook handler
```
```
useBilling.ts,
OrganizationBillingPage.tsx
```
#### 16-

```
hrs
```
```
Migration 048
deployed
```
Email delivery
(transactional)

```
Invitation/signature emails
don't actually send
```
```
Implement all 5 edge functions
in supabase/functions/ —
```
#### 4-

```
hrs
```
```
Email service API
key
(Resend/SendGrid)
```
File
upload/storage

```
Contract scans, documents
reference file_path but no
actual upload
```
```
Storage bucket config, upload
component, storage edge
function
```
```
Module hooks (CLM,
Documents)
```
#### 8-

```
hrs
```
```
Supabase Storage
bucket
```
Search/filteringNo global search or per-
module filtering on list pages

```
Search component, filter bar
component
```
```
All list pages 4-
hrs
```
#### —

Notifications
system

```
No in-app notifications —
alerts page exists but no real-
time notifications
```
```
notifications table, Supabase
Realtime subscription,
notification bell component
```
```
Layout components, App.tsx
```
#### 8-

```
hrs —
```
API rate
limiting

```
api_calls tracked but no
actual API call counting
middleware
```
```
Rate limit middleware or
Supabase edge function counter—
```
#### 4-

```
hrs —
```
Data export No CSV/Excel export for any
module

```
Export utility, UI buttons All list pages 4-
hrs
```
#### —

User profile
management

```
No profile editing page for
individual users
```
```
Profile page, avatar upload App.tsx, sidebar 4-
hrs
```
```
Storage bucket
```
Testing suite Only 1 smoke test file exists Unit tests for hooks, utils,
components

#### — 16-

```
hrs
```
#### —

Mobile/PWA
support

```
No service worker, no mobile
optimization
```
```
PWA manifest, service worker index.html, vite.config.ts 4-
hrs
```
#### —

## Section 11 — TypeScript & Type Safety

### as any Casts (6 total)

```
File Line Reason
```
src/core/utils/logger.ts L54 (window as any).LOG_DRAIN_ENABLED — accessing non-standard window
property

src/workspaces/organization/hooks/useBilling.tsL26 (supabase.rpc as any)("get_billing_info", ...) — RPC not in generated
types

src/workspaces/organization/hooks/useBilling.tsL48 (supabase.rpc as any)("create_billing_customer", ...) — RPC not in
generated types

src/core/api/addons.ts L18 (supabase.rpc as any)("purchase_addon", ...) — RPC not in generated
types
src/core/api/addons.ts L35 (supabase as any).from("addon_purchases") — table not in generated types

src/core/hooks/usePlanLimits.ts L234(supabase.rpc as any)("upgrade_organization_plan", ...) — RPC not in
generated types

**Fix** : Deploy migrations 047 + 048, then run npx supabase gen types typescript --project-id swzepbbpbeoqbiavidfh > src/core/api/types.ts. Then remove

```
all as any casts.
```
### @ts-ignore Comments

```
None found. 
```

### eslint-disable Comments (3 total)

**File Line Rule Disabled**
src/core/api/types.ts L1 /* eslint-disable */ — auto-generated file

src/core/utils/logger.ts L53 // eslint-disable-next-line @typescript-eslint/no-explicit-any

src/workspaces/auth/pages/Auth.tsxL77 // eslint-disable-next-line react-hooks/exhaustive-deps

## Section 12 — Environment & Config

### Required Environment Variables

**Variable Set? File**
VITE_SUPABASE_PROJECT_ID  Set (swzepbbpbeoqbiavidfh) .env

VITE_SUPABASE_PUBLISHABLE_KEY  Set .env

VITE_SUPABASE_URL  Set (https://swzepbbpbeoqbiavidfh.supabase.co).env

SUPABASE_DB_PASSWORD ⚠ Set but exposed in plaintext .env

VITE_RAZORPAY_KEY  Missing —

RESEND_API_KEY (or equivalent email service) Missing —

### Key Config Files

**File Status**
supabase/config.toml Present (148 bytes)

package.json  Present

tsconfig.json  Present

vite.config.ts  Present

.env ⚠ Contains DB password in plaintext

## Section 13 — Full Remaining TODO List

```
Priority Task File(s) Effort Blocked By
```

Critical

```
Deploy migration 047
(addon_purchases)
```
```
supabase/migrations/047_addon_purchasing.sql 2 min Supabase access
```

Critical

```
Deploy migration 048
(billing_customers)
```
```
supabase/migrations/048_billing_integration.sql2 min Supabase access
```

Critical

```
Run plan_limits seed SQL for existing
orgs
```
```
Supabase SQL Editor 2 min Supabase access
```

Critical

```
Regenerate Supabase TypeScript
types
```
```
src/core/api/types.ts 2 min Migrations 047+
deployed
```

Critical

```
Remove all 6 as any casts See Section 1 1 10 min Types regenerated
```

Critical

```
Move DB password out of .env .env → .env.local 5 min —
```
 High Fix ADD_ON key mismatch (frontend
vs RPC)

```
src/core/utils/plan-limits.ts,
047_addon_purchasing.sql 30 min —
```
 High Implement email edge functions (
functions)

```
supabase/functions/* 4-8 hrsEmail service API key
```
 High Implement file upload for
documents/contracts

```
Storage bucket, upload components 8-
hrs
```
```
Supabase Storage
```

Medium

```
Implement Razorpay payment flow Edge function, webhook, billing page updates 16-
hrs
```
```
Razorpay API key
```

Medium

```
Add search/filtering to list pages All module list pages 4-8 hrs—
```

Medium

```
Build real-time notifications system New table, realtime subscription, bell component 8-
hrs
```
#### —

#### 

Medium

```
Add data export (CSV/Excel) Export utility, UI buttons on list pages 4-8 hrs—
```

Medium

```
User profile management page New page + route 4-8 hrs—
```
 Low Implement API rate limiting counter Middleware or edge function 4-8 hrs—

 Low Add comprehensive test suite Test files for hooks, utils, components 16-
hrs

#### —

 Low PWA support / mobile optimization Manifest, service worker 4-8 hrs—

 Low Add pagination to all list pages All list pages 4-8 hrs—

 Low Add loading skeletons to all pages All pages 2-4 hrs—

 Low Add breadcrumb navigation Layout components 2-4 hrs—


_Generated: 2026-03-25 Author: PiyushSolanki_


