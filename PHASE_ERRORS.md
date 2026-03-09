# SISWIT — Phase-Wise Error List

## 🚨 Phase 1 — Blockers (Fix Before Any Deploy)

| ID | File | Line | Problem |
|----|------|------|---------|
| C-01 | `supabase/functions/send-employee-invitation/index.ts` | 87 | Stray `3333` characters appended to `.from("organization_memberships")` — Edge Function cannot deploy |
| C-02 | `src/app/providers/TenantProvider.tsx` | 12–14, 50, 61, 80 | Queries `tenants`, `tenant_users`, `tenant_subscriptions` tables that were dropped in migration 007 |
| C-03 | `src/core/rbac/usePermissions.ts` | 11–12 | Imports `./useAuth` and `./useOrganization` — files don't exist at that path, compile error |
| C-04 | `scripts/generate-supabase-types.mjs` | 9 | Outputs types to `src/integrations/types.ts` but app imports from `@/core/api/types` |

---

## 🔴 Phase 2 — Security & Multi-Tenancy

| ID | File | Line | Problem |
|----|------|------|---------|
| S-01 | `src/modules/clm/hooks/useCLM.ts` | 453–461 | `contract_esignatures` has no tenant column — cross-tenant e-signature reads possible |
| S-02 | Migration 007 | 659–667 | `contract_scans` has no tenant column — scoped reads fail or return zero rows |
| S-03 | `src/modules/documents/hooks/useDocuments.ts` | 527 | `document_esignatures` has no tenant column — uses fragile `!inner` join workaround |
| S-04 | `src/modules/documents/hooks/useDocuments.ts` | 790–804 | `document_versions` has no tenant scope — relies only on parent document check |
| S-05 | `src/modules/documents/hooks/useDocuments.ts` | 858–871 | `useDocumentPermissions()` queries by `document_id` only — no tenant filter |
| S-06 | `src/modules/documents/hooks/useDocuments.ts` | 914 | `useRemoveDocumentPermission()` — hard DELETE with zero tenant scoping |
| S-07 | `src/modules/documents/hooks/useDocuments.ts` | 882–891 | `useShareDocument()` inserts permission without verifying user access to document |
| S-08 | `src/core/rbac/usePermissions.ts` | 231–234 | `canUpdate()` returns `true` for all employees without ownership check |
| S-09 | `src/app/providers/AuthProvider.tsx` | 431–441, 940–954 | Client self-signup auto-promotes to `active` bypassing `pending_approval` |
| S-10 | `src/modules/erp/hooks/useERP.ts` | 829–833 | `useDeletePurchaseOrderItem()` queries by `id` only — no organization filter |
| S-11 | `supabase/functions/_shared/resend.ts` | 1 | CORS `ALLOWED_ORIGIN` hardcoded to production — blocks localhost and staging |
| S-12 | `src/core/auth/components/ProtectedRoute.tsx` | 105–107 | Platform admins access tenant workspaces without impersonation session verification |
| X-02 | Migration 007 | multiple | 9 child tables lack `organization_id`/`tenant_id` — no direct RLS enforcement |

---

## 🟠 Phase 3 — Module Bugs

| ID | File | Line | Problem |
|----|------|------|---------|
| M-01 | `src/modules/clm/hooks/useCLM.ts` | 528–578 | E-signature update never syncs contract status to `"signed"` when all sign |
| M-02 | `src/modules/cpq/hooks/useCPQ.ts` | 617–660 | `useUpdateQuoteStatus()` accepts any status string — no transition validation |
| M-03 | `src/modules/cpq/hooks/useCPQ.ts` + `useCRM.ts` | 293–297, 1365 | `total_amount` taken from client input without server-side recomputation |
| M-04 | `src/modules/crm/hooks/useCRM.ts` | 184 | `mapAccount()` maps `description` to `row.ownership` — wrong field |
| M-05 | `src/modules/crm/hooks/useCRM.ts` | 227, 911 | `mapOpportunity()` maps `description` to `row.next_step` — wrong field |
| M-06 | `src/modules/crm/hooks/useCRM.ts` | 942–1003 | Opportunity stage and lead status changes don't create activity log entries |
| M-07 | `src/modules/erp/hooks/useERP.ts` | 637 | `payment_terms: po.notes` — copy-paste bug, should be `po.payment_terms` |
| M-08 | `src/modules/erp/hooks/useERP.ts` | 186, 1063, 1110 | `reference_type` and `status` fields circularly mapped to each other's columns |
| M-09 | `src/modules/crm/hooks/useCRM.ts` | 1260 | `cost_price` always equals `unit_price` — actual cost data lost |
| M-10 | `src/modules/clm/hooks/useCLM.ts` | 310–322, 363–375 | Updating `end_date` enqueues new expiry alert without cancelling old one |
| M-11 | `src/modules/documents/hooks/useDocuments.ts` | 808–843 | `useCreateDocumentVersion()` — no tenant or access verification |
| M-12 | `src/modules/cpq/hooks/useCPQ.ts` | 309 | Code references `quote_items` but migration 007 creates `quote_line_items` |
| C-05 | `src/core/utils/audit.ts` | 29–34 | `audit_logs` not in `sync_scope_ids` trigger — columns don't auto-sync |
| C-06 | `src/core/utils/jobs.ts` | 44–46 | `background_jobs` not in `sync_scope_ids` trigger — columns don't auto-sync |
| X-01 | Migration 007 | 712 | `audit_logs`, `background_jobs`, `impersonation_sessions` missing from trigger targets |

---

## 🟡 Phase 4 — Warnings & Edge Cases

| ID | File | Line | Problem |
|----|------|------|---------|
| W-01 | `src/app/providers/AuthProvider.tsx` | 96–107 | `withTimeout()` timer never cleaned up if promise resolves first |
| W-02 | `src/app/providers/AuthProvider.tsx` | 1102 | `unsafeSupabase` recreated every render — causes infinite re-render risk |
| W-03 | `src/app/providers/AuthProvider.tsx` | 173–192 | `getCachedRole()` raw string fallback could produce unexpected roles |
| W-04 | `src/core/auth/components/TenantSlugGuard.tsx` | 41–55 | Failed impersonation lookup still renders children |
| W-05 | `src/app/App.tsx` | 35 | `QueryClient` cache never cleared on logout — stale data persists |
| W-06 | `src/app/App.tsx` | 330 | `/:tenantSlug` catch-all matches reserved paths like `/admin` |
| W-08 | `src/app/providers/OrganizationProvider.tsx` | 95 | `unsafeSupabase` recreated every render — unstable callback reference |
| W-10 | `src/app/providers/AuthProvider.tsx` | 898 | `_rememberMe` parameter accepted but never used |

---

## 🔵 Phase 5 — Code Quality & Type Safety

| ID | File | Line | Problem |
|----|------|------|---------|
| C-07 | `src/app/providers/AuthProvider.tsx` | 155 | `as unknown as SupabaseClient` bypasses all type checking |
| C-08 | `src/app/providers/OrganizationProvider.tsx` | 74 | Same `as unknown as SupabaseClient` pattern |
| C-09 | `src/core/types/tenant.ts` | ~102 | `TenantInvitation` uses `invitation_token` but DB stores `token_hash` |
| Q-01 | `src/core/api/client.ts` | 1 | Comment says "auto-generated" but contains hand-written types |
| Q-02 | 5 files | — | `getErrorMessage()` duplicated in AuthProvider, useCLM, useCPQ, useCRM, useERP |
| Q-03 | `useCPQ.ts`, `useCLM.ts`, `useERP.ts` | multiple | Extensive `as any` casts mask real type mismatches |
| Q-04 | 3 provider files | 1 | `"use client"` directive has no effect in Vite SPA |
| Q-05 | `src/core/utils/soft-delete.ts` | 42, 67 | `console.error` left in production utility |
| Q-06 | `src/core/types/tenant.ts` + `organization.ts` | — | Two parallel type hierarchies cause confusion |
| Q-07 | `src/core/utils/data-ownership.ts` | — | Duplicates scoping logic from `module-scope.ts` |
| Q-08 | `src/modules/documents/hooks/useDocuments.ts` | 115, 291 | `refetchOnWindowFocus: true` redundant with realtime subscriptions |
| Q-09 | `src/app/providers/AuthProvider.tsx` | — | Deprecated `signUp` function still in codebase |
| Q-10 | `src/app/providers/TenantProvider.tsx` | 18, 23 | `mapTenant`/`mapSubscription` use `as unknown as` — no validation |

---

## ⚡ Phase 6 — Performance

| ID | File | Line | Problem |
|----|------|------|---------|
| P-01 | `src/app/App.tsx` | 35 | Default `staleTime` of 0 causes unnecessary refetches on every mount |
| P-02 | All 5 module hooks | — | List views `.select("*")` when only a subset of columns is needed |
| P-03 | `src/app/providers/AuthProvider.tsx` | 230–251 | Two independent auth queries run sequentially instead of parallel |
| P-04 | `src/modules/documents/hooks/useDocuments.ts` | 31–61 | Each hook creates its own Supabase realtime channel |

---

## 🔗 Phase 7 — Cross-File & Integration

| ID | File | Line | Problem |
|----|------|------|---------|
| X-03 | Both Edge Functions + `_shared/resend.ts` | — | `sendResendEmail()` imported but never called — dead code |
| X-04 | `useDocuments.ts` vs all other hooks | — | Documents uses `data-ownership.ts` while other modules use `module-scope.ts` |
| X-05 | Migration 007 vs auto-generated types | — | `products` table columns differ between migration and hook expectations |
| W-07 | `tenant.ts` + `organization.ts` | — | Two `isModuleEnabled` functions with slightly different signatures |
| W-09 | `src/modules/documents/hooks/useDocuments.ts` | 17 | Documents imports `data-ownership.ts` — inconsistent with other modules |
