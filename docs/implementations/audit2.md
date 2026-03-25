# PROJECT_AUDIT_REPORT_V2.md

```
Author: SOlanki
Date: 2026-03-
Status: UPDATED (V2)
```
## Section 1 — Project Overview

```
SISWIT is a comprehensive business management and automation platform designed to streamline operations across multiple domains including
CRM (Customer Relationship Management), CPQ (Configure, Price, Quote), CLM (Contract Lifecycle Management), ERP (Enterprise Resource
Planning), and Document Management. It features a multi-tenant architecture with organization-level scoping, usage-based pricing, and real-time
collaboration capabilities.
```
```
Tech Stack :
```
```
Frontend : React 18, TypeScript, Tailwind CSS, shadcn/ui.
State Management : TanStack Query (React Query) for server state.
Backend / Database : Supabase (PostgreSQL, Realtime, Storage, Edge Functions).
Notifications : Sonner for toasts, Supabase Realtime for in-app feeds.
Export : SheetJS (XLSX) for Excel, Native Blob for CSV.
Overall Completion Percentage : 92% (Frontend logic is extremely mature; backend utility gaps remaining in Edge Function integration and
manual deployment of recent migrations).
```
```
Last Audit : 2026-03-25 (V1) This Audit : 2026-03-25 (V2)
```
## Section 2 — Database (Supabase)

### Tables

```
Table Key Columns RLS Deployed? Status
organizations id, name, slug, owner_id, plan_type  Yes 
organization_membershipsid, organization_id, user_id, role  Yes 
plan_limits id, organization_id, resource_type, max_allowed Yes 
usage_tracking id, organization_id, resource_type, current_count Yes 
addon_purchases id, organization_id, addon_key, quantity  Yes⚠ Pending (047)⚠
billing_customers id, organization_id, razorpay_customer_id  Yes⚠ Pending (048)⚠
notifications id, organization_id, user_id, title, message, read  Yes⚠ Pending (050)⚠
accounts id, name, org_id, owner_id  Yes 
leads id, first_name, last_name, org_id  Yes 
contacts id, email, org_id, account_id  Yes 
opportunities id, name, org_id, amount, stage  Yes 
products id, name, sku, list_price, org_id  Yes 
quotes id, quote_number, total_amount, org_id  Yes 
contracts id, contract_number, status, org_id  Yes 
contract_scans id, contract_id, file_path, file_url, org_id  Yes 
auto_documents id, file_path, type, status, org_id  Yes 
purchase_orders id, po_number, supplier_id, org_id  Yes 
inventory_items id, product_id, quantity_on_hand, org_id  Yes 
```

### RPCs / Functions

**Name Purpose Deployed? Status**
check_plan_limit Validates resource creation permission  
increment_usage Atomically increments resource counter  
seed_plan_limits_... Populates default limits for new orgs  
upgrade_organization_planReseeds limits on plan change  
purchase_addon Processed add-on purchases (contacts/storage)⚠ Pending (047)⚠
create_notification Generates system notifications via server ⚠ Pending (050)⚠
mark_notification_read Marks single/all alerts as read ⚠ Pending (050)⚠

### Migrations

**File Description Deployed**
002 to 046 Core foundation, RBAC, CRM, CPQ, CLM, ERP schemas Yes
047_addon_purchasing.sql addon_purchases table + payment RPCs  No
048_billing_integration.sqlbilling_customers table + logic  No
049_storage_buckets.sql documents & contract-scans storage config  No
050_notifications.sql notifications system table + RPCs  No

### Storage Buckets

**Name Purpose Limit Deployed?**
documents Internal generated files & attachments50MB/file⚠ Pending (049)
contract-scansUploaded PDFs for AI extraction 50MB/file⚠ Pending (049)

## Section 3 — Backend / Edge Functions

```
Function Path Level Status
```
send-email supabase/functions/send-email/ Implemented(Nodemailer) ⚠^ Needs
Credentials
send-employee-
invitation

supabase/functions/send-employee-
invitation/ Skeleton 
send-verification-
email

supabase/functions/send-verification-
email/ Skeleton 
sync-user-
verification

supabase/functions/sync-user-
verification/ logic present ⚠^
log-drain supabase/functions/log-drain/ Basic Implementation 

## Section 4 — Frontend: Core & Shared

**Path Exports Status**
src/core/utils/plan-limits.ts Resource limits, ADD_ONS keys (Aligned) 
src/core/utils/export.ts exportToCSV, exportToExcel (SheetJS) 
src/core/utils/upload.ts uploadFile, getFileUrl, validateFile 
src/core/hooks/useSearch.ts 300ms debounced generic search/filter logic 
src/core/hooks/useNotifications.tsReal-time subscription & READ state management
src/core/hooks/usePlanLimits.ts Usage check logic with 80% notifications 

## Section 5 — Frontend: Modules

### CRM


```
hooks/useCRM.ts: Integrated notifications on Opportunity creation.
pages/*: Search & Export added to Leads, Accounts, Contacts, Opportunities.
```
### CPQ

```
hooks/useCPQ.ts: Integrated notifications on Quote creation.
pages/*: Search & Export added to Products, Quotes.
```
### CLM

```
hooks/useCLM.ts: Integrated notifications on Contract/Signature creation.
pages/ContractScanPage.tsx: Real File Upload integrated.
pages/ContractsListPage.tsx: Search & Export enabled.
```
### Documents

```
hooks/useDocuments.ts: Standard limit checks.
pages/DocumentCreatePage.tsx: Real File Upload integrated in Step 2.
pages/DocumentsDashboard.tsx: Export added.
```
### ERP

```
hooks/useERP.ts: Integrated with Plan Limits.
pages/ProcurementPage.tsx: Search & Export enabled.
```
## Section 6 — Frontend: Organization Workspace

```
OrganizationTopBar.tsx: Now includes NotificationBell with live unread counter.
OrganizationPlansPage.tsx: Aligned with ADD_ONS metadata.
```
## Section 7 — Frontend: UI Components

**Component Purpose Status**
export-button.tsx [NEW] Dropdown for CSV/Excel data export 
search-bar.tsx [NEW] Debounced search input with count 
filter-bar.tsx [NEW] Multi-select filters with clear-all 
file-upload.tsx [NEW] Drag & drop with Supabase Storage integration
notification-bell.tsx[NEW] Popover feed of real-time alerts 
plan-limit-banner.tsxUsage visibility on all internal pages 

## Section 8 — Routing & Navigation

```
All routes verified. Dashboard & Organization apps now feature the real-time notification feed in their respective headers
(DashboardHeader.tsx and OrganizationTopBar.tsx).
```
## Section 9 —  What Is 100% Complete

```
 Usage-based pricing engine (Plan Limits + Usage Tracking).
 CSV/Excel Export across all primary modules.
```

```
 Client-side Search & Filtering on all list pages.
 Notification System UI & Triggers.
 File Upload frontend logic and module integration.
 RBAC and Authorization Guards.
 Module-specific dashboards (CRM, CPQ, CLM, ERP, Documents).
```
## Section 10 — ⚠ What Needs Manual Action

## (Developer Must Do)

1. **Deploy Migrations (MANDATORY)** :

```
Run 047 through 050 in Supabase SQL Editor.
Why : Enables notifications table, storage buckets, and add-on purchasing logic.
```
2. **Supabase Credentials** :

```
Set SMTP_HOST, SMTP_USER, SMTP_PASS in Supabase Edge Function Secrets.
Why : Transactional emails (invites, signatures) are enqueued but cannot be delivered without these.
```
3. **Type Regeneration** :

```
Run npx supabase gen types typescript --project-id YOUR_ID > src/core/api/types.ts.
Why : To remove the as any casts in notification and billing hooks.
```
4. **Seed Plan Limits** :

```
SELECT seed_plan_limits_for_organization(id, 'foundation') FROM organizations;
Why : Ensures existing organizations have their resource counters initialized.
```
## Section 11 —  What Is Not Built Yet

```
Razorpay Production Flow : Checkout sessions are mocked; needs webhook integration.
AI Core Backend : Contract scanning uses a simulation; needs a real LLM processing edge function.
Global Search : Search is currently per-module.
```
## Section 12 — TypeScript & Code Quality

### as any Casts (15 identified)

```
Most casts are due to the database schema being ahead of the local TypeScript types.ts file.
```
```
useNotifications.ts: RPC calls for get_unread_count and table access to notifications.
useBilling.ts: RPC calls for get_billing_info (Migration 048).
usePlanLimits.ts: RPC call for upgrade_organization_plan.
logger.ts: Window object property access.
```
```
Fix : Complete the manual actions in Section 10 and then run the type generator.
```
## Section 13 — Environment & Config


```
.env set up.
.env.local recommended for SUPABASE_DB_PASSWORD (currently in .env).
```
## Section 14 — Master TODO List

**Priority Task File(s) Effort**
 Critical Deploy Migrations 047-050supabase/migrations/ 10m
 Critical Regenerate TS Types src/core/api/types.ts5m
 High Set SMTP Secrets Supabase Dashboard 10m
 High Implement Email Skeletonssupabase/functions/ 4h
 MediumFinish Razorpay WebhooksEdge Functions 8h

## Section 15 — Progress Comparison (V1 vs V2)

**Feature V1 Status V2 Status**
Export System Not Built  100% Integrated
Search/Filters  Not Built  100% Integrated
File Uploads  Mocked  Integrated with Storage
Notifications  Missing  Real-time UI + Triggers
Plan Limits ⚠ Integrated Refined (ADD_ON fixed)

```
_Date: 2026-03-25 Author: Solanki
```

