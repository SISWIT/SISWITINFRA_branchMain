# SISWIT — Improvements & Recommendations

---

## 🚨 Phase 1 — Blockers

### C-01 — Edge Function Syntax Error
**Quick Fix:** Remove stray `3333` from line 87 of `send-employee-invitation/index.ts`.
**Long-Term Improvement:** Add a CI lint/build step for Edge Functions before deploy. Use `deno check` or `deno lint` in the deployment pipeline to catch syntax errors before they reach production.
**Example:**
```diff
- .from("organization_memberships")3333
+ .from("organization_memberships")
```

### C-02 — TenantProvider Queries Dropped Tables
**Quick Fix:** Delete `TenantProvider.tsx`, replace all imports with `OrganizationProvider`.
**Long-Term Improvement:** Enforce a single naming convention (org-native). Run a codebase-wide lint rule that flags any import containing `tenant` from provider paths. Use `eslint-plugin-import` restricted paths to prevent regressions.
**Example:**
```diff
- import { TenantProvider } from "@/app/providers/TenantProvider"
+ import { OrganizationProvider } from "@/app/providers/OrganizationProvider"
```

### C-03 — Broken Imports in usePermissions.ts
**Quick Fix:** Change to absolute `@/` imports: `@/core/auth/useAuth` and `@/workspaces/organization/hooks/useOrganization`.
**Long-Term Improvement:** Add a `tsconfig` path alias lint rule or use `eslint-plugin-import/no-relative-parent-imports` to enforce `@/` prefixed imports across the codebase.
**Example:**
```diff
- import { useAuth } from "./useAuth"
+ import { useAuth } from "@/core/auth/useAuth"
```

### C-04 — generate-supabase-types.mjs Wrong Output Path
**Quick Fix:** Change output to `src/core/api/types.ts`.
**Long-Term Improvement:** Add a `postgenerate` npm script that verifies the output file matches the import alias. Add the generated file path as a constant shared between the config and the script.
**Example:**
```diff
- const outputPath = path.resolve(process.cwd(), "src/integrations/types.ts")
+ const outputPath = path.resolve(process.cwd(), "src/core/api/types.ts")
```

---

## 🔴 Phase 2 — Security & Multi-Tenancy

### S-01 — contract_esignatures No Tenant Column
**Quick Fix:** Add `organization_id`/`tenant_id` columns via migration, backfill from parent `contracts`.
**Long-Term Improvement:** Establish a schema policy: every table must have both tenant columns. Add a CI check that compares each table's columns against a required set. Create a `create_tenant_scoped_table()` helper function in SQL that auto-adds both columns + trigger.

### S-02 — contract_scans No Tenant Column
**Quick Fix:** Add tenant columns, backfill from `contracts`.
**Long-Term Improvement:** Same as S-01 — enforce the tenant-column policy for all new tables.

### S-03 — document_esignatures No Tenant Column
**Quick Fix:** Add tenant columns, backfill from `auto_documents`, replace `!inner` join with direct filter.
**Long-Term Improvement:** Avoid join-based scoping entirely. Direct column filters are 10x faster and don't break on parent deletion.

### S-04 — document_versions No Tenant Column
**Quick Fix:** Add tenant columns, backfill from `auto_documents`.
**Long-Term Improvement:** Create a migration template/checklist for new child tables that mandates tenant columns.

### S-05 — document_permissions No Tenant Scope
**Quick Fix:** Add tenant columns to table and filter in hook.
**Long-Term Improvement:** Create a shared `useScopedQuery()` wrapper that always applies tenant filtering — make it impossible to forget.

### S-06 — useRemoveDocumentPermission Hard Delete No Scope
**Quick Fix:** Add tenant verification before delete; switch to soft-delete.
**Long-Term Improvement:** Ban `.delete()` from all hooks. Create a `safeDelete()` utility that always requires scope parameters.
**Example:**
```diff
- const { error } = await supabase.from("document_permissions").delete().eq("id", id);
+ const deleted = await softDeleteRecord({ table: "document_permissions", id, userId, organizationId });
```

### S-07 — useShareDocument No Access Verification
**Quick Fix:** Verify document ownership before inserting permission.
**Long-Term Improvement:** Create an `ensureDocumentAccess(docId, userId, orgId)` helper. Reuse across all document-related mutations. Consider a Supabase RPC for atomic check-then-insert.

### S-08 — useCRUD.canUpdate Missing Owner Check
**Quick Fix:** Add `record.owner_id === user?.id` check for employee roles.
**Long-Term Improvement:** Implement a policy-based authorization system where each entity type declares its ownership rules. Use a `canModify(entity, user, action)` generic function.
**Example:**
```diff
- return true; // would need owner check
+ return record?.owner_id === user?.id;
```

### S-09 — Client Self-Signup Bypasses Approval
**Quick Fix:** After email verification for clients, set state to `pending_approval` not `active`.
**Long-Term Improvement:** Create a state machine for `account_state` transitions. Define an explicit transition table in code and validate every state change against it.

### S-10 — PO Items Delete No Tenant Scope
**Quick Fix:** Add org filter to the item query or verify parent PO access first.
**Long-Term Improvement:** Same as S-06 — use `safeDelete()` utility with mandatory scope.

### S-11 — CORS Single Origin
**Quick Fix:** Support comma-separated origins via env var.
**Long-Term Improvement:** Use a dynamic origin validator that checks against a database-stored list of allowed origins per tenant. This supports white-labeling.
**Example:**
```diff
- const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") ?? "https://app.siswitinfra.com";
+ const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "https://app.siswitinfra.com").split(",");
```

### S-12 — Platform Admin Bypass Without Impersonation
**Quick Fix:** Check for active impersonation session before allowing access.
**Long-Term Improvement:** All platform admin actions on tenant data should go through an audit-logged impersonation middleware. Create a `requireImpersonation()` guard.

### X-02 — 9 Child Tables Without Tenant Columns
**Quick Fix:** Single migration to add columns to all 9 tables.
**Long-Term Improvement:** Create a SQL linter or pre-commit hook that scans migration files for any `CREATE TABLE` missing `organization_id`/`tenant_id`. Reject PRs that introduce un-scoped tables.

---

## 🟠 Phase 3 — Module Bugs

### M-01 — CLM: No E-Signature → Contract Status Sync
**Quick Fix:** After updating signature, check all signatures; if all signed, update contract status.
**Long-Term Improvement:** Extract a shared `syncEntityStatusFromSignatures(parentTable, parentId, signatureTable)` utility. Both CLM and Documents can use it.
**Example:**
```typescript
// After signature update:
const { data: sigs } = await supabase.from("contract_esignatures").select("status").eq("contract_id", contractId);
if (sigs?.every(s => s.status === "signed")) {
  await supabase.from("contracts").update({ status: "signed" }).eq("id", contractId);
}
```

### M-02 — CPQ: No Quote Status Transition Validation
**Quick Fix:** Add a `VALID_TRANSITIONS` map and validate before updating.
**Long-Term Improvement:** Create a generic `StateMachine<T>` class used across all modules (quotes, contracts, orders). This prevents invalid transitions everywhere.

### M-03 — CPQ: Client-Trusted Financial Calculations
**Quick Fix:** Recompute `total_amount` server-side from `subtotal`, `discount`, `tax`.
**Long-Term Improvement:** Move financial calculations to a Supabase database trigger or RPC. Never trust client-computed totals. Create a `compute_quote_total()` SQL function.

### M-04 — CRM: mapAccount Wrong Field
**Quick Fix:** Map `description` to `row.description`, not `row.ownership`.
**Long-Term Improvement:** Add a `description` column to `accounts` if missing. Use auto-generated types to make field mappings type-safe — the compiler catches mismatches.

### M-05 — CRM: mapOpportunity Wrong Field
**Quick Fix:** Map `description` to `row.description`, keep `next_step` separate.
**Long-Term Improvement:** Generate mapper functions from the schema types. A code generator can produce type-safe `mapRow<T>()` functions that catch these bugs at compile time.

### M-06 — CRM: No Activity Logging on Stage Changes
**Quick Fix:** After stage/status update, insert an activity record.
**Long-Term Improvement:** Create a `withActivityLog()` mutation wrapper that auto-logs field changes. Apply to all update mutations across CRM.

### M-07 — ERP: payment_terms = notes Copy-Paste Bug
**Quick Fix:** Change `po.notes` to `po.payment_terms`.
**Long-Term Improvement:** Use TypeScript strict mode with no `as any` casts. The compiler would catch this if the types were properly defined.
**Example:**
```diff
- payment_terms: po.notes ?? null,
+ payment_terms: po.payment_terms ?? null,
```

### M-08 — ERP: Circular Status/Reference Mapping
**Quick Fix:** Fix the three crossed mappings so each field maps to its own column.
**Long-Term Improvement:** Generate mappings from the schema. Use a naming convention where frontend field names match DB column names exactly — no translation layer needed.
**Example:**
```diff
- reference_type: row.status ?? undefined,
+ reference_type: row.reference_number ?? undefined,
- status: record.reference_type ?? null,
+ status: record.status ?? "pending",
```

### M-09 — CRM: cost_price = unit_price Bug
**Quick Fix:** Change to `cost_price: product.cost_price ?? product.unit_price ?? 0`.
**Long-Term Improvement:** Make `cost_price` a required field on the create form with validation. Separating cost and price is critical for margin calculations.
**Example:**
```diff
- cost_price: product.unit_price ?? 0,
+ cost_price: product.cost_price ?? product.unit_price ?? 0,
```

### M-10 — CLM: Duplicate Contract Expiry Alerts
**Quick Fix:** Cancel existing queued alerts before enqueuing new ones.
**Long-Term Improvement:** Use upsert semantics for background jobs: add a unique constraint on `(job_type, payload->>'contract_id', status='queued')` so duplicates are impossible at the DB level.

### M-11 — Documents: useCreateDocumentVersion No Access Check
**Quick Fix:** Verify parent document access before inserting version.
**Long-Term Improvement:** Use a Supabase RPC for version creation that atomically checks access and inserts. This is safer than client-side checks.

### M-12 — CPQ: quote_items vs quote_line_items
**Quick Fix:** Verify live DB and use the correct table name.
**Long-Term Improvement:** Use the auto-generated types as the single source of truth for table names. Create a `TABLES` enum or const from the generated types.

### C-05 — audit_logs Not in sync_scope_ids Trigger
**Quick Fix:** Add to trigger targets in a new migration.
**Long-Term Improvement:** Make `sync_scope_ids()` a default trigger for ALL tables with both columns. Use a migration script that auto-discovers eligible tables.

### C-06 — background_jobs Not in sync_scope_ids Trigger
**Quick Fix:** Add to trigger targets.
**Long-Term Improvement:** Same as C-05 — auto-discover and apply.

### X-01 — sync_scope_ids Trigger Missing 3 Tables
**Quick Fix:** Add `audit_logs`, `background_jobs`, `impersonation_sessions` to trigger.
**Long-Term Improvement:** Create a DB function that lists all tables with both `organization_id` and `tenant_id` columns and verifies each has the sync trigger. Run as a CI health check.

---

## 🟡 Phase 4 — Warnings & Edge Cases

### W-01 — withTimeout Timer Leak
**Quick Fix:** Add `.finally(() => clearTimeout(timerId))`.
**Long-Term Improvement:** Replace custom `withTimeout` with `AbortController` + `signal` pattern, which is the modern standard. Supabase client supports abort signals.
**Example:**
```diff
  return Promise.race([promise, timeoutPromise])
+   .finally(() => clearTimeout(timerId));
```

### W-02 — Auth useEffect Infinite Re-render Risk
**Quick Fix:** Wrap `unsafeSupabase` in `useMemo`.
**Long-Term Improvement:** Use a properly typed Supabase client (C-07) so the cast is unnecessary. The typed client is a stable reference by default.

### W-03 — getCachedRole Raw String Fallback
**Quick Fix:** Remove raw fallback, clear invalid cache.
**Long-Term Improvement:** Use `zod` to validate cached role structure before use. This catches schema changes that invalidate the cache format.

### W-04 — TenantSlugGuard Silent Failure
**Quick Fix:** Add `.catch()` and redirect on error.
**Long-Term Improvement:** Create an `<AsyncGuard>` component that handles loading/error/success states generically. Reuse across all guards.

### W-05 — QueryClient Never Cleared on Logout
**Quick Fix:** Call `queryClient.clear()` in `signOut()`.
**Long-Term Improvement:** Create a `useAuthAwareQueryClient()` hook that auto-clears on auth state changes via `onAuthStateChange` subscription.

### W-06 — /:tenantSlug Catch-All Conflict
**Quick Fix:** Check `isReservedRootSegment()` before redirecting.
**Long-Term Improvement:** Move tenant routes under a `/org/:slug` prefix. This eliminates the catch-all conflict entirely and makes routing unambiguous.

### W-08 — OrganizationProvider Unstable Dependency
**Quick Fix:** Wrap with `useMemo`.
**Long-Term Improvement:** Same as W-02 — use typed client (C-07).

### W-10 — _rememberMe Unused Parameter
**Quick Fix:** Remove the parameter or implement it.
**Long-Term Improvement:** If "remember me" is a product requirement, implement with `localStorage` (persistent) vs `sessionStorage` (session-only). Document the decision.

---

## 🔵 Phase 5 — Code Quality & Type Safety

### C-07 — AuthProvider Type Bypass
**Quick Fix:** Export a typed `createClient<Database>()` from `client.ts`.
**Long-Term Improvement:** Generate a typed Supabase client wrapper that provides full autocomplete for tables, RPCs, and column names. This eliminates ALL `as any` and `as unknown` casts.

### C-08 — OrganizationProvider Type Bypass
**Quick Fix:** Use the typed client from C-07.
**Long-Term Improvement:** Same as C-07.

### C-09 — TenantInvitation Stores Raw Token
**Quick Fix:** Rename `invitation_token` to `token_hash`.
**Long-Term Improvement:** Generate types from DB schema automatically. Manual type definitions drift from reality.

### Q-01 — Misleading Auto-Generated Comment
**Quick Fix:** Update the comment to reflect reality.
**Long-Term Improvement:** Separate auto-generated code (`types.ts`) from hand-written code (`client.ts`). Import types into client, don't mix.

### Q-02 — Duplicated getErrorMessage
**Quick Fix:** Centralize in `src/core/utils/utils.ts`, import everywhere.
**Long-Term Improvement:** Add an ESLint rule (`no-restricted-syntax`) that flags local function definitions matching `getErrorMessage`. Enforce single-source utilities.
**Example:**
```diff
- function getErrorMessage(error: unknown): string { ... }
+ import { getErrorMessage } from "@/core/utils/utils";
```

### Q-03 — Extensive `as any` in Hook Payloads
**Quick Fix:** Replace with proper Insert/Update types.
**Long-Term Improvement:** Enable `"noImplicitAny": true` in `tsconfig.json`. Add an ESLint rule for `@typescript-eslint/no-explicit-any`. Fix all resulting errors.

### Q-04 — "use client" in Vite SPA
**Quick Fix:** Remove from all files.
**Long-Term Improvement:** Add an ESLint rule to flag `"use client"` directives in Vite projects.

### Q-05 — console.error in Production Utils
**Quick Fix:** Remove `console.error` calls.
**Long-Term Improvement:** Integrate a structured error reporting service (Sentry). Replace all `console.error/warn` with `captureException()`.

### Q-06 — Parallel Tenant/Organization Types
**Quick Fix:** Deprecate tenant types with `@deprecated` JSDoc.
**Long-Term Improvement:** Over 2-3 sprints, migrate all imports to organization types. Delete `tenant.ts` when no references remain.

### Q-07 — data-ownership.ts Duplicates module-scope.ts
**Quick Fix:** Mark as `@deprecated`.
**Long-Term Improvement:** After all modules migrate to `module-scope.ts`, delete `data-ownership.ts`. Add ESLint restricted-imports rule.

### Q-08 — Documents refetchOnWindowFocus Redundancy
**Quick Fix:** Remove explicit `refetchOnWindowFocus: true`.
**Long-Term Improvement:** Set global React Query defaults once in `App.tsx`. Don't set per-query options unless intentionally overriding.

### Q-09 — Deprecated signUp Function
**Quick Fix:** Delete the function and type references.
**Long-Term Improvement:** Use `@deprecated` annotations before removing functions. Set a deprecation timeline (1 sprint warning, then delete).

### Q-10 — MapTenant Uses `as unknown as`
**Quick Fix:** Resolved by C-02 (file deletion).
**Long-Term Improvement:** Always use field-level mapping with runtime validation, never cast entire objects.

---

## ⚡ Phase 6 — Performance

### P-01 — QueryClient Missing staleTime
**Quick Fix:** Set `staleTime: 5min` and `refetchOnWindowFocus: false`.
**Long-Term Improvement:** Define per-entity staleTime defaults: user data (1min), config data (10min), list data (5min). Create a `queryDefaults` config object.
**Example:**
```diff
- const queryClient = new QueryClient()
+ const queryClient = new QueryClient({
+   defaultOptions: { queries: { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false } }
+ })
```

### P-02 — All Queries Select *
**Quick Fix:** Use specific column lists for list views.
**Long-Term Improvement:** Create `LIST_COLUMNS` and `DETAIL_COLUMNS` constants per entity. List views use minimal columns; detail views use full.

### P-03 — Auth Init Sequential Queries
**Quick Fix:** Use `Promise.all()` for independent queries.
**Long-Term Improvement:** Audit all providers for sequential independent queries. Create a `parallelQueries()` utility that wraps `Promise.all` with error handling.

### P-04 — Documents Multiple Realtime Channels
**Quick Fix:** Deduplicate with channel tracking.
**Long-Term Improvement:** Create a single `RealtimeProvider` at the app level that manages all subscriptions. Individual hooks subscribe to events through the provider, which manages the underlying channels.

---

## 🔗 Phase 7 — Cross-File & Integration

### X-03 — Edge Functions Never Use Resend
**Quick Fix:** Either switch to Resend for branded emails or remove dead code.
**Long-Term Improvement:** If using Supabase built-in emails, customize templates via Supabase Dashboard → Authentication → Email Templates. If branding is required, implement Resend with HTML templates stored in the DB per tenant.

### X-04 — Documents Uses data-ownership.ts, Others Use module-scope.ts
**Quick Fix:** Migrate Documents to `module-scope.ts`.
**Long-Term Improvement:** Create a `useModuleScope(moduleName)` factory hook that every module must use. This makes the scoping pattern impossible to deviate from.

### X-05 — products Table Schema Mismatch
**Quick Fix:** Add missing columns via migration or verify live schema.
**Long-Term Improvement:** Run `npm run db:types` in CI after every migration. Compare generated types against a snapshot to catch schema drift.

### W-07 — Duplicate isModuleEnabled
**Quick Fix:** Re-export from `tenant.ts` → `organization.ts`.
**Long-Term Improvement:** Single `isModuleEnabled` in `organization.ts`. Delete from `tenant.ts` after all imports migrate.

### W-09 — Documents Uses data-ownership.ts
**Quick Fix:** Same as X-04.
**Long-Term Improvement:** Add ESLint restricted-imports rule for `data-ownership.ts` after migration.

---

## Overall Architectural Recommendations

### 1. Enforce Single Tenant Abstraction
The codebase has two parallel systems: `tenant` and `organization`. Pick one (`organization`) and eliminate the other completely. Add ESLint restricted-path rules to prevent regression.

### 2. Mandate Tenant Columns on Every Table
Every table in the schema MUST have `organization_id` and `tenant_id`. Create a SQL template function `create_scoped_table()` that auto-adds both columns, the FK constraints, and the `sync_scope_ids()` trigger. Add a CI check that rejects tables without them.

### 3. Generate Typed Supabase Client
Replace all `as any` and `as unknown as SupabaseClient` casts with a properly typed client generated from the schema. Run `npm run db:types` in CI. The generated types should be the single source of truth for column names, table names, and relationships.

### 4. Create a Scoping Abstraction Layer
All modules should use `module-scope.ts` through a `useModuleScope(moduleName)` factory hook. Delete `data-ownership.ts`. Make it structurally impossible to write a query without tenant scoping.

### 5. Implement State Machines for Business Entities
Quotes, contracts, orders, and documents all have status fields with implicit transition rules. Create a shared `StateMachine<T>` utility that enforces valid transitions. This prevents bugs like M-02 (quote status bypass) and M-01 (missing status sync).

### 6. Ban Hard Deletes and Unscoped Mutations
Create `safeDelete()` and `safeMutate()` wrappers that require `organizationId` as a mandatory parameter. Add ESLint rules that flag `.delete()` and `.update()` calls without `.eq("organization_id", ...)`.

### 7. Add CI/CD for Edge Functions
Edge Functions currently have no build verification. Add `deno check` and `deno lint` to the CI pipeline. This would have caught C-01 (syntax error) before deploy.

### 8. Centralize Error Handling
Five modules duplicate `getErrorMessage()`. Create a shared utilities layer in `src/core/utils/` and enforce imports via ESLint restricted-syntax rules. Apply the same pattern to all other duplicated utilities.

### 9. Implement Proper Audit Trail for Admin Actions
Platform admin bypass (S-12) allows un-audited access to tenant data. All cross-tenant actions must go through an impersonation session with full audit logging. Create middleware that wraps admin actions.

### 10. Add Integration Tests for Multi-Tenancy
The most dangerous bugs (S-01 through S-07) involve cross-tenant data leaks. Create integration tests that: (a) create two tenants, (b) create data in tenant A, (c) verify tenant B cannot read/modify it. Run these tests against every migration.
