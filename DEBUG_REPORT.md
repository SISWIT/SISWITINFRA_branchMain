# SISWIT — Comprehensive Debug Report v2
**Generated:** 2026-03-09  
**Audited by:** Solankiiiii  
**Audit Scope:** Full codebase — all 7 phases complete

---

## Audit Coverage

| Phase | Scope | Status |
|-------|-------|--------|
| 1. Project Mapping | File tree, package.json, vite.config, tsconfig | ✅ Complete |
| 2. Core Layer | `src/core/` — 12 files (auth, RBAC, scoping, types, utils) | ✅ Complete |
| 3. Module Hooks | CRM (1621L), CPQ (662L), CLM (695L), ERP (1185L), Documents (931L) | ✅ Complete |
| 4. Workspace & App | App.tsx, AuthProvider, OrganizationProvider, TenantProvider, 64 workspace files, 55 UI files | ✅ Complete |
| 5. Backend | 4 migrations (006, 007, 014, 015), 2 Edge Functions, `_shared/resend.ts`, `generate-supabase-types.mjs`, 22 scripts | ✅ Complete |
| 6. Cross-File Analysis | Import paths, table consistency, env vars, provider↔schema mapping | ✅ Complete |
| 7. Report Generation | This file | ✅ Complete |

**Total Issues Found: 62**

| Category | Count |
|----------|-------|
| 🔴 Critical Errors | 9 |
| 🔴 Security & Multi-Tenancy | 12 |
| 🟠 Module Bugs | 12 |
| 🟡 Warnings & Edge Cases | 10 |
| 🔵 Code Quality | 10 |
| ⚡ Performance | 4 |
| 🔗 Cross-File & Integration | 5 |

---

## Executive Summary

The codebase is in a **tenant → organization naming migration**. Migration `007_org_native_auth_reset.sql` correctly rebuilt the schema with **both** `organization_id` and `tenant_id` columns on all parent business tables, kept in sync by a `sync_scope_ids()` trigger. This means frontend scoping code using `organization_id` will work for parent tables.

However, **8 child tables** (`contract_esignatures`, `contract_scans`, `document_versions`, `document_esignatures`, `document_permissions`, `quote_line_items`, `purchase_order_items`, `production_order_items`) have **no tenant/organization column at all** — they rely on their parent FK relationship for scope, which is NOT enforced by RLS in all cases.

The most dangerous issue is `TenantProvider.tsx` — it queries `tenants`, `tenant_users`, and `tenant_subscriptions` tables that were **dropped** by migration 007. This provider is a dead-code bomb that will crash at runtime if any route uses it. Additionally, the `send-employee-invitation` Edge Function has a syntax error preventing deployment.

---

## 🔴 Critical Errors (9)
> These will break the app or cause data loss.

### C-01 — Edge Function Syntax Error
- **File:** `supabase/functions/send-employee-invitation/index.ts`, line 87
- **Issue:** Stray characters `3333` appended to `.from("organization_memberships")3333` — this causes a parse/syntax error preventing the function from deploying. **No employee invitation emails can be sent.**
- **Fix:** Remove `3333` from line 87.

### C-02 — TenantProvider Queries Dropped Tables
- **File:** `src/app/providers/TenantProvider.tsx`, lines 12–14, 50, 61, 80
- **Issue:** `TenantProvider` references `tenants`, `tenant_users`, and `tenant_subscriptions` tables. Migration `007_org_native_auth_reset.sql` drops these and replaces them with `organizations`, `organization_memberships`, and `organization_subscriptions`. Any component that renders under `TenantProvider` will crash with a "relation does not exist" error.
- **Fix:** Remove `TenantProvider.tsx` entirely. All its functionality is duplicated by `OrganizationProvider.tsx` which queries the correct tables. Update any imports to use `OrganizationProvider`.

### C-03 — Broken Imports in usePermissions.ts
- **File:** `src/core/rbac/usePermissions.ts`, lines 11–12
- **Issue:** Imports `useAuth` from `"./useAuth"` and `useOrganization` from `"./useOrganization"`. These files don't exist in `src/core/rbac/`. This causes a **compile error** — the entire RBAC system is broken.
- **Fix:** Change to `import { useAuth } from "@/core/auth/useAuth"` and `import { useOrganization } from "@/workspaces/organization/hooks/useOrganization"`.

### C-04 — generate-supabase-types.mjs Output Path Mismatch
- **File:** `scripts/generate-supabase-types.mjs`, line 9
- **Issue:** Outputs to `src/integrations/types.ts`, but the app imports types from `@/core/api/types`. Running `npm run db:types` writes to the wrong file, and the types imported at runtime may be stale or manually maintained.
- **Fix:** Change `outputPath` to `path.resolve(process.cwd(), "src/core/api/types.ts")`.

### C-05 — audit_logs Table Schema Mismatch
- **File:** `src/core/utils/audit.ts`, lines 29–34
- **Issue:** `writeAuditLog()` inserts both `organization_id` and `tenant_id`. Migration 007 defines `audit_logs` with `organization_id` (line 241) and `tenant_id` (line 242), which is correct. **However**, the `audit_logs` table is NOT in the `sync_scope_ids()` trigger target list (line 712–716) — so if only one of the two values is provided, the other stays NULL, unlike business tables where the trigger keeps them in sync.
- **Fix:** Add `audit_logs` to the `sync_scope_ids()` trigger targets array, or manually ensure both values are set in `writeAuditLog()`.

### C-06 — background_jobs Table Not in sync_scope_ids Trigger
- **File:** `src/core/utils/jobs.ts`, lines 44–46; Migration 007, line 712
- **Issue:** Same issue as C-05 — `background_jobs` is not in the `sync_scope_ids()` trigger targets. The table has both `organization_id` and `tenant_id` columns, but they won't auto-sync if only one is provided.
- **Fix:** Add `background_jobs` to the trigger targets array.

### C-07 — AuthProvider Type Bypass
- **File:** `src/app/providers/AuthProvider.tsx`, line 155
- **Issue:** `const unsafeSupabase = supabase as unknown as SupabaseClient` — double-cast bypasses all type checking on every DB call in the auth flow. This hides real type errors from the compiler.
- **Fix:** Generate a properly typed Supabase client from the schema types.

### C-08 — OrganizationProvider Same Type Bypass
- **File:** `src/app/providers/OrganizationProvider.tsx`, line 74
- **Issue:** Same `as unknown as SupabaseClient` pattern. Both providers share this debt.
- **Fix:** Same as C-07 — use a properly typed client.

### C-09 — TenantInvitation Stores Raw Token
- **File:** `src/core/types/tenant.ts`, line ~102
- **Issue:** `TenantInvitation` type has `invitation_token: string` for the raw token, but the DB schema stores `token_hash`. If any code uses this type to insert records, it would store unhashed tokens.
- **Fix:** Rename to `token_hash` to match the DB column.

---

## 🔴 Security & Multi-Tenancy Issues (12)

### S-01 — contract_esignatures Has No Tenant Column
- **File:** Migration 007, lines 467–479; `src/modules/clm/hooks/useCLM.ts`, lines 453–461
- **Issue:** `contract_esignatures` has no `organization_id` or `tenant_id` column. The CLM hook queries only by `contract_id` with no tenant filter. Any authenticated user who knows a contract ID can read its e-signatures across tenants.
- **Fix:** Add `organization_id`/`tenant_id` to the table and add to `sync_scope_ids()` trigger. Apply `applyModuleReadScope()` in the hook.

### S-02 — contract_scans Has No Tenant Column
- **File:** Migration 007, lines 659–667
- **Issue:** Same as S-01 — `contract_scans` has no tenant column. CLM `useContractScans()` applies `applyModuleReadScope()` which filters on `organization_id`, but the column doesn't exist on this table — query returns 0 rows or errors.
- **Fix:** Add tenant columns to `contract_scans`.

### S-03 — document_esignatures Has No Tenant Column
- **File:** Migration 007, lines 639–648; `src/modules/documents/hooks/useDocuments.ts`, line 527
- **Issue:** `document_esignatures` has no tenant column. The Documents hook cleverly uses `!inner` join to filter via the parent `auto_documents.organization_id`, which works but breaks if the parent document is deleted.
- **Fix:** Add tenant column for direct scoping, don't rely solely on join.

### S-04 — document_versions Has No Tenant Column
- **File:** `src/modules/documents/hooks/useDocuments.ts`, lines 790–804
- **Issue:** `useDocumentVersions()` verifies parent document access (good!) but doesn't scope the versions query itself. If a version's `document_id` pointed to a different tenant's document (data corruption), it would still be returned.
- **Fix:** Add tenant scope to the versions query, or at minimum validate the FK relationship.

### S-05 — document_permissions No Tenant Scope
- **File:** `src/modules/documents/hooks/useDocuments.ts`, lines 858–871
- **Issue:** `useDocumentPermissions()` queries permissions by `document_id` only — no organization or tenant filter. Any authenticated user could potentially read permissions of another org's documents.
- **Fix:** Join through the parent `auto_documents` table for tenant filtering, or add tenant column.

### S-06 — useRemoveDocumentPermission Hard Delete No Scope
- **File:** `src/modules/documents/hooks/useDocuments.ts`, line 914
- **Issue:** `useRemoveDocumentPermission()` does `.delete().eq("id", id)` — a hard DELETE with NO tenant scope. Any authenticated user who knows a permission ID can delete any tenant's document permission.
- **Fix:** Add tenant scoping via parent document join before deleting.

### S-07 — useShareDocument No Tenant Scope
- **File:** `src/modules/documents/hooks/useDocuments.ts`, lines 882–891
- **Issue:** `useShareDocument()` inserts into `document_permissions` without verifying the user has access to the target document or is in the same tenant. A user could share a document they don't own.
- **Fix:** Verify document ownership/access before inserting the permission.

### S-08 — useCRUD.canUpdate Missing Owner Check
- **File:** `src/core/rbac/usePermissions.ts`, lines 231–234
- **Issue:** `canUpdate()` returns `true` for all employees/users without checking record ownership. Comment says "would need owner check" — not implemented.
- **Fix:** Add `record.owner_id === user.id` check.

### S-09 — Client Self-Signup Bypasses Approval
- **File:** `src/app/providers/AuthProvider.tsx`, lines 431–441, 940–954
- **Issue:** `signUpClientSelf()` creates membership as `pending_verification`. After email verification, `signIn()` auto-promotes to `active` — bypassing the `pending_approval` step required by the PRD for client self-signup.
- **Fix:** After email verification, set state to `pending_approval`. Owner/admin must explicitly approve.

### S-10 — PO Items Delete No Tenant Scope
- **File:** `src/modules/erp/hooks/useERP.ts`, lines 829–833
- **Issue:** `useDeletePurchaseOrderItem()` queries PO items by `id` only — no `organization_id` filter. The `purchase_order_items` table has no tenant column. Relies entirely on `ensurePurchaseOrderAccessible()` for the parent PO, but the item itself is unscoped.
- **Fix:** Add tenant column to `purchase_order_items`, or filter by parent PO's tenant.

### S-11 — CORS Single Origin
- **File:** `supabase/functions/_shared/resend.ts`, line 1
- **Issue:** `ALLOWED_ORIGIN` defaults to `"https://app.siswitinfra.com"` — single origin. Local dev and staging are blocked.
- **Fix:** Support comma-separated origins or `*` for dev.

### S-12 — Platform Admin Bypass Without Impersonation Audit
- **File:** `src/core/auth/components/ProtectedRoute.tsx`, lines 105–107
- **Issue:** `TenantAdminRoute` allows platform admins through without verifying an impersonation session exists. Platform admin actions aren't logged to the tenant's audit trail.
- **Fix:** Require active impersonation session with audit logging.

---

## 🟠 Module Bugs (12)

### M-01 — CLM: No E-Signature → Contract Status Sync
- **File:** `src/modules/clm/hooks/useCLM.ts`, lines 528–578
- **Issue:** `useUpdateESignature()` updates a signature status but never checks if all signers signed to auto-update the contract to `"signed"`. The Documents module has `syncAutoDocumentStatusFromSignatures()` (lines 64–104) that does this correctly — CLM doesn't.
- **Fix:** Port the Documents pattern: after updating a CLM e-signature, check all signatures for the contract. If all signed, update contract status.

### M-02 — CPQ: No Quote Status Transition Validation
- **File:** `src/modules/cpq/hooks/useCPQ.ts`, lines 617–660
- **Issue:** `useUpdateQuoteStatus()` accepts any status string with no transition validation. A user could set status from `"draft"` directly to `"accepted"`.
- **Fix:** Add a status transition map and validate allowed transitions.

### M-03 — CPQ: Client-Trusted Financial Calculations
- **File:** `src/modules/cpq/hooks/useCPQ.ts`, lines 293–297; `useCRM.ts`, line 1365
- **Issue:** Both CPQ and CRM quote creation take `total_amount` directly from client input without recomputing `subtotal - discount + tax`. A malicious client could submit inconsistent totals.
- **Fix:** Recompute server-side: `total_amount = subtotal - discount_amount + tax_amount`.

### M-04 — CRM: mapAccount Wrong Field
- **File:** `src/modules/crm/hooks/useCRM.ts`, line 184
- **Issue:** `mapAccount()` maps `description` to `row.ownership`. The `ownership` field is for business type (public/private/subsidiary), not a text description.
- **Fix:** Add a `description` column to accounts, or use the correct column mapping.

### M-05 — CRM: mapOpportunity Wrong Field
- **File:** `src/modules/crm/hooks/useCRM.ts`, line 227; line 911
- **Issue:** `mapOpportunity()` maps `description` to `row.next_step`. On create (line 911), `next_step` is set from `opportunity.description ?? opportunity.next_step`. These are semantically different fields.
- **Fix:** Add a `description` column to opportunities.

### M-06 — CRM: No Activity Logging on Stage Changes
- **File:** `src/modules/crm/hooks/useCRM.ts`, lines 942–1003
- **Issue:** `useUpdateOpportunity()` doesn't log an activity when the opportunity stage changes. Same applies to lead status changes in `useUpdateLead()`.
- **Fix:** Check if `stage` field changed, then auto-create an activity record.

### M-07 — ERP: payment_terms = notes Copy-Paste Bug
- **File:** `src/modules/erp/hooks/useERP.ts`, line 637
- **Issue:** `useCreatePurchaseOrder()` sets `payment_terms: po.notes ?? null` — should be `po.payment_terms ?? null`. This means PO notes are stored as payment terms.
- **Fix:** Change to `payment_terms: po.payment_terms ?? null`.

### M-08 — ERP: Circular Status/Reference Mapping
- **File:** `src/modules/erp/hooks/useERP.ts`, lines 186, 1063, 1110
- **Issue:** `mapFinancialRecord()` maps `reference_type = row.status` (L186), and `useCreateFinancialRecord()` sets `status = record.reference_type` (L1063). On update, L1110 does the same. This circular mapping means `status` and `reference_type` are permanently swapped.
- **Fix:** Map correctly: `reference_type` → `row.reference_type` and `status` → `row.status`.

### M-09 — ERP: cost_price = unit_price Bug
- **File:** `src/modules/crm/hooks/useCRM.ts`, line 1260
- **Issue:** CRM `useCreateProduct()` sets `cost_price: product.unit_price ?? 0` — always same as list price. The cost price data is lost.
- **Fix:** Add a separate `cost_price` field to the product creation input.

### M-10 — CLM: Duplicate Contract Expiry Alerts
- **File:** `src/modules/clm/hooks/useCLM.ts`, lines 310–322, 363–375
- **Issue:** When a contract is created, an expiry alert job is enqueued. When `end_date` is updated, another alert is enqueued — but the old one is never cancelled. Leads to duplicate notifications.
- **Fix:** Cancel existing `contract.expiry_alert` jobs for the contract ID before enqueuing new ones.

### M-11 — Documents: useCreateDocumentVersion No Tenant Scope
- **File:** `src/modules/documents/hooks/useDocuments.ts`, lines 808–843
- **Issue:** `useCreateDocumentVersion()` inserts into `document_versions` without any tenant or author verification. The `document_versions` table has no tenant column. Any authenticated user could create a version on any document.
- **Fix:** Verify the user has write access to the parent document before inserting.

### M-12 — CPQ: quote_items Table Name Mismatch
- **File:** `src/modules/cpq/hooks/useCPQ.ts`, line 309
- **Issue:** CPQ code references `quote_items` table, but migration 007 creates `quote_line_items`. The code will fail with "relation does not exist" unless a later migration renamed or added `quote_items`.
- **Fix:** Verify which table name is correct. If `quote_items` was added by a migration not in the audit scope, confirm it exists. Otherwise, change to `quote_line_items`.

---

## 🟡 Warnings & Edge Cases (10)

### W-01 — withTimeout Timer Leak
- **File:** `src/app/providers/AuthProvider.tsx`, lines 96–107
- **Issue:** `withTimeout()` creates a setTimeout that's never cleaned up if the promise resolves before the timeout fires.
- **Fix:** Add `.finally(() => clearTimeout(timerId))`.

### W-02 — Auth useEffect Infinite Re-render Risk
- **File:** `src/app/providers/AuthProvider.tsx`, line 1102
- **Issue:** `unsafeSupabase` is recreated every render, causing `getUserAccess` and `claimPendingInvitations` callbacks to change, triggering the auth effect repeatedly.
- **Fix:** Memoize `unsafeSupabase` with `useMemo`.

### W-03 — getCachedRole Raw String Fallback
- **File:** `src/app/providers/AuthProvider.tsx`, lines 173–192
- **Issue:** Falls back to treating the raw string as a role if it doesn't start with `{`. Could produce unexpected roles from corrupted storage.
- **Fix:** Always expect JSON format; clear cache on parse failure.

### W-04 — TenantSlugGuard Silent Failure
- **File:** `src/core/auth/components/TenantSlugGuard.tsx`, lines 41–55
- **Issue:** If the impersonation lookup fails for a platform admin, the guard still renders children — admin sees the workspace without proper impersonation.
- **Fix:** Add error handling; redirect on failure.

### W-05 — QueryClient Never Cleared on Logout
- **File:** `src/app/App.tsx`, line 35
- **Issue:** `QueryClient` is created at module level. Cache is never cleared on sign-out — stale data persists.
- **Fix:** Call `queryClient.clear()` in `signOut`.

### W-06 — /:tenantSlug Catch-All Route Conflict
- **File:** `src/app/App.tsx`, line 330
- **Issue:** `/:tenantSlug` matches any single-segment path, potentially shadowing legitimate routes like `/admin`.
- **Fix:** Check `isReservedRootSegment()` before redirecting.

### W-07 — Duplicate isModuleEnabled
- **File:** `src/core/types/tenant.ts`, `src/core/types/organization.ts`
- **Issue:** Two versions with slightly different signatures.
- **Fix:** Consolidate to the `organization.ts` version.

### W-08 — OrganizationProvider fetchSubscriptionByOrganization Dependency
- **File:** `src/app/providers/OrganizationProvider.tsx`, line 95
- **Issue:** `useCallback` depends on `unsafeSupabase` which is recreated every render (line 74), causing the subscription fetch to have an unstable reference.
- **Fix:** Memoize `unsafeSupabase` or move it outside the component.

### W-09 — Documents Module Uses data-ownership.ts Instead of module-scope.ts
- **File:** `src/modules/documents/hooks/useDocuments.ts`, line 17
- **Issue:** Documents imports `applyTenantOwnershipScope` and `withOwnershipCreate` from `data-ownership.ts`, while all other modules use `module-scope.ts`. Two parallel scoping systems exist with different behavior.
- **Fix:** Migrate Documents to use `module-scope.ts` for consistency.

### W-10 — _rememberMe Unused Parameter
- **File:** `src/app/providers/AuthProvider.tsx`, line 898
- **Issue:** `signIn()` accepts `_rememberMe` but never uses it. Sessions always use `sessionStorage`.
- **Fix:** Implement or remove the parameter.

---

## 🔵 Code Quality Issues (10)

### Q-01 — Misleading Auto-Generated Comment
- **File:** `src/core/api/client.ts`, line 1
- **Issue:** Comment says "automatically generated" but contains hand-written RPC types that must be manually maintained.
- **Fix:** Update comment.

### Q-02 — Duplicated getErrorMessage Across 5 Files
- **Files:** `AuthProvider.tsx`, `useCLM.ts`, `useCPQ.ts`, `useCRM.ts`, `useERP.ts`
- **Issue:** Identical function defined in 5 places.
- **Fix:** Import from shared utility `@/core/utils/utils.ts`.

### Q-03 — Extensive `as any` Usage in Hook Payloads
- **Files:** `useCPQ.ts` (L97,133,301,320), `useCLM.ts` (L133), `useERP.ts` (multiple)
- **Issue:** Bypasses type safety on insert payloads, masking real type mismatches.
- **Fix:** Use proper typed payloads.

### Q-04 — "use client" Directives in Vite SPA
- **Files:** `AuthProvider.tsx`, `TenantProvider.tsx`, `OrganizationProvider.tsx`
- **Issue:** Next.js directive has no effect in Vite.
- **Fix:** Remove all `"use client"` directives.

### Q-05 — console.error in Production Utils
- **File:** `src/core/utils/soft-delete.ts`, lines 42, 67
- **Issue:** `console.error` left in production utility.
- **Fix:** Use proper error reporting or remove.

### Q-06 — Parallel Tenant/Organization Type Systems
- **Files:** `src/core/types/tenant.ts` (209L), `src/core/types/organization.ts`
- **Issue:** Duplicate type hierarchies causing confusion about which to use.
- **Fix:** Consolidate to organization types; add `@deprecated` to tenant types.

### Q-07 — data-ownership.ts Duplicates module-scope.ts
- **File:** `src/core/utils/data-ownership.ts`
- **Issue:** `applyOrganizationOwnershipScope()` duplicates `applyModuleReadScope()` from `module-scope.ts`.
- **Fix:** Deprecate `data-ownership.ts`.

### Q-08 — Documents refetchOnWindowFocus Inconsistency
- **File:** `src/modules/documents/hooks/useDocuments.ts`, lines 115, 291
- **Issue:** Documents hooks set `refetchOnWindowFocus: true` while all other module hooks use the default (also true, but other modules don't explicitly set it). The realtime subscription makes this redundant.
- **Fix:** Remove explicit `refetchOnWindowFocus: true` since realtime handles updates.

### Q-09 — Deprecated signUp Function
- **File:** `src/app/providers/AuthProvider.tsx`
- **Issue:** Contains unused, deprecated `signUp` function alongside the active `signUpOrganization`, `signUpClientSelf`, etc.
- **Fix:** Remove the deprecated function.

### Q-10 — MapTenant Uses `as unknown as`
- **File:** `src/app/providers/TenantProvider.tsx`, lines 18, 23
- **Issue:** `mapTenant` and `mapSubscription` use `as unknown as` — double cast with no validation.
- **Fix:** Use proper field-level mapping like `OrganizationProvider.tsx` does.

---

## ⚡ Performance Issues (4)

### P-01 — QueryClient Missing Default staleTime
- **File:** `src/app/App.tsx`, line 35
- **Issue:** Default `staleTime` is 0, causing refetches on every mount. For a SaaS app with many parallel queries, this creates unnecessary load.
- **Fix:** Set `defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } }`.

### P-02 — All Module Queries Select *
- **Files:** All 5 module hooks
- **Issue:** List queries use `.select("*")` when list views only need a subset of columns.
- **Fix:** Use specific column lists for list views.

### P-03 — Auth Init Sequential DB Queries
- **File:** `src/app/providers/AuthProvider.tsx`, lines 230–251
- **Issue:** `getUserAccess()` makes two sequential queries (super admin + membership). These are independent and could run in parallel.
- **Fix:** Use `Promise.all()`.

### P-04 — Documents Module Creates Channel Per Hook Instance
- **File:** `src/modules/documents/hooks/useDocuments.ts`, lines 31–61
- **Issue:** `useDocumentsRealtime()` is called by multiple hooks with different `scope` parameters, creating multiple Supabase realtime channels for the same user.
- **Fix:** Consolidate into a single channel at the provider level.

---

## 🔗 Cross-File & Integration Issues (5)

### X-01 — sync_scope_ids Trigger Missing Tables
- **Files:** Migration 007, line 712; `audit_logs`, `background_jobs`, `impersonation_sessions`
- **Issue:** The `sync_scope_ids()` trigger only targets 17 business tables. `audit_logs`, `background_jobs`, and `impersonation_sessions` have both columns but are NOT in the trigger list — they can get out of sync.
- **Fix:** Add these tables to the trigger targets, or ensure the frontend always provides both values.

### X-02 — Child Tables Without Tenant Columns
- **Tables:** `contract_esignatures`, `contract_scans`, `contract_versions`, `document_versions`, `document_esignatures`, `document_permissions`, `quote_line_items`, `purchase_order_items`, `production_order_items`
- **Issue:** All 9 child tables rely on parent FK for tenant scoping but have no direct tenant column. RLS can't enforce tenant isolation on child records without joining to the parent — which is not how Supabase RLS typically works.
- **Fix:** Add `organization_id`/`tenant_id` to all child tables and include in `sync_scope_ids()` trigger.

### X-03 — Edge Functions Never Use Resend
- **Files:** `send-employee-invitation/index.ts`, `send-client-invitation/index.ts`, `_shared/resend.ts`
- **Issue:** Both Edge Functions import from `_shared/resend.ts` but only use `corsHeaders` — they never call `sendResendEmail()`. Instead, they use Supabase's built-in `inviteUserByEmail()`. The `sendResendEmail` function, `RESEND_API_KEY`, and `RESEND_FROM_EMAIL` env vars are dead code.
- **Fix:** Either switch to `sendResendEmail()` for branded emails, or remove the unused code.

### X-04 — CLM Uses module-scope.ts, Documents Uses data-ownership.ts
- **Issue:** Two parallel scoping systems with different APIs, different error handling, and different column assumptions. Documents hooks won't benefit from improvements made to `module-scope.ts` and vice versa.
- **Fix:** Standardize all modules on `module-scope.ts`.

### X-05 — products Table Schema Evolved Between Migrations
- **Files:** Migration 007 (lines 373–387) vs auto-generated types (`src/core/api/types.ts`)
- **Issue:** Migration 007 defines `products` with `price`, `cost`, `category` columns. But the auto-generated types show `list_price`, `cost_price`, `family`, `sku` etc. A later migration (likely in 015 or an ALTER TABLE) added/renamed columns but 007 shows the original schema. The ERP and CPQ hooks reference both sets of columns — the code works only if the newer columns exist.
- **Fix:** Verify the live schema matches the hook expectations. If running from scratch (007 first), the hooks will fail.

---

## Priority Fix Order

### Immediate (Before Any Deploy)
1. **C-01** — Remove `3333` from Edge Function
2. **C-03** — Fix `usePermissions.ts` imports
3. **C-02** — Remove `TenantProvider.tsx` (dead code querying dropped tables)
4. **C-04** — Fix `generate-supabase-types.mjs` output path

### High Priority (This Sprint)
5. **S-01, S-02, X-02** — Add tenant columns to all 9 child tables
6. **S-06, S-07** — Add tenant scoping to document permissions CRUD
7. **M-01** — Add e-signature → contract status sync in CLM
8. **M-07** — Fix PO `payment_terms = notes` copy-paste bug
9. **M-08** — Fix ERP circular status/reference_type mapping
10. **C-05, C-06, X-01** — Add `audit_logs` and `background_jobs` to `sync_scope_ids` trigger

### Medium Priority (Next Sprint)
11. **M-02** — Quote status transition validation
12. **M-04, M-05** — Fix CRM field mapping bugs
13. **Q-02** — Deduplicate `getErrorMessage`
14. **Q-04** — Remove `"use client"` directives
15. **W-09, X-04** — Migrate Documents to `module-scope.ts`

### Low Priority (Debt Reduction)
16. **C-07, C-08** — Replace `as unknown as SupabaseClient` with typed client
17. **Q-03** — Replace `as any` casts
18. **Q-06** — Consolidate tenant/organization types
19. **P-01** — Set QueryClient default staleTime
20. **P-02** — Use specific column lists for list queries
