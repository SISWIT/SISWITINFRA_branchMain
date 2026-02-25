# Multi-Tenant SaaS Platform Debug Report

**Project:** SiriusInfra Unified Platform  
**Modules:** CLM, CRM, CPQ, ERP, Documents (Auto Documentation)  
**Generated:** 2026-02-22  
**Mode:** Debug Analysis - Single to Multi-Tenant Conversion

---

## Executive Summary

This report identifies issues found during the analysis of the codebase as it transitions from a single-company implementation to a multi-tenant SaaS architecture. The project has a well-structured foundation with proper hooks, contexts, and routing, but there are several critical issues that need to be addressed for proper multi-tenant isolation.

---

## Critical Issues (Priority 1)

### 1.1 Hardcoded Default Tenant ID in Signup
**Location:** [`src/hooks/AuthProvider.tsx:287`](src/hooks/AuthProvider.tsx:287)

```typescript
const defaultTenantId = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
```

**Issue:** The signup flow hardcodes a single tenant ID. When new customers sign up, they are automatically assigned to this single tenant instead of creating their own tenant organization.

**Impact:** New customers cannot create independent tenant organizations. All signup flows result in users being added to the same organization.

**Recommendation:** Implement tenant creation flow during signup, or allow customers to specify/create their tenant during registration.

---

### 1.2 Missing Tenant Scope in Dashboard Queries
**Location:** [`src/pages/Dashboard.tsx:147-178`](src/pages/Dashboard.tsx:147-178)

```typescript
supabase.from("quotes").select("id", { count: "exact" })
supabase.from("contracts").select("id", { count: "exact" })
supabase.from("auto_documents").select("id", { count: "exact" })
supabase.from("activities").select("subject, created_at, is_completed")
```

**Issue:** Dashboard queries do NOT include tenant_id filters. This means:
- Users can see data from ALL tenants
- Dashboard statistics aggregate across tenant boundaries
- No multi-tenant data isolation at the dashboard level

**Impact:** Critical data privacy breach - users can potentially access other tenants' data.

**Recommendation:** Wrap all dashboard queries with `applyModuleReadScope()` similar to how it's done in hooks.

---

### 1.3 Missing Tenant Context in Signup Forms
**Location:** [`src/components/auth/CustomerSignupForm.tsx`](src/components/auth/CustomerSignupForm.tsx), [`src/components/auth/EmployeeSignupForm.tsx`](src/components/auth/EmployeeSignupForm.tsx)

**Issue:** Both signup forms call `signUp()` but there's no mechanism for:
- Creating a new tenant during customer signup
- Selecting an existing tenant to join (for employees)
- Tenant invitation acceptance flow

**Impact:** Users cannot self-provision new tenant organizations. The multi-tenant capability is non-functional for new user onboarding.

---

## High Priority Issues (Priority 2)

### 2.1 Role Normalization Inconsistency
**Location:** [`src/hooks/AuthProvider.tsx:22-45`](src/hooks/AuthProvider.tsx:22-45)

**Issue:** The `normalizeTenantRole` function handles role mapping but has redundant mappings:
- "admin" → "admin" 
- "tenant_admin" → "admin"
- "legacy_admin" → "admin"
- "employee" → "user"
- "tenant_user" → "user"

While this provides backward compatibility, the inconsistency between "employee" (maps to "user") and the signup logic using `signupType === "employee"` creates confusion.

**Recommendation:** Document the role mapping clearly and ensure all flows use the normalized roles consistently.

---

### 2.2 Module Scope Not Applied to All Tables
**Location:** Various hooks in [`src/hooks/useCRM.ts`](src/hooks/useCRM.ts), [`src/hooks/useCPQ.ts`](src/hooks/useCPQ.ts), [`src/hooks/useCLM.ts`](src/hooks/useCLM.ts), [`src/hooks/useERP.ts`](src/hooks/useERP.ts)

**Issue:** While most CRUD operations use `applyModuleReadScope` and `applyModuleMutationScope`, there are potential gaps:

1. **Account-Contact relationship queries** - Not scoped by tenant in some JOIN operations
2. **Opportunity-Lead conversion** - When converting a lead to opportunity/account, tenant_id handling needs verification
3. **Quote-to-Contract flow** - The CLM hooks create contracts from quotes but need full tenant verification

**Impact:** Potential data leakage between tenants in edge cases.

**Recommendation:** Audit all cross-table queries to ensure tenant_id is propagated correctly.

---

### 2.3 Impersonation State Not Persisted
**Location:** [`src/hooks/useImpersonation.ts`](src/hooks/useImpersonation.ts)

**Issue:** The impersonation state (for platform admins viewing tenant data) appears to be client-side only. If the user refreshes the page, the impersonation context may be lost.

**Impact:** Platform admins may lose their "preview as tenant" context on page refresh.

**Recommendation:** Consider storing impersonation state in sessionStorage or URL parameters.

---

### 2.4 Tenant Slug Guard Race Condition
**Location:** [`src/components/auth/TenantSlugGuard.tsx:25-76`](src/components/auth/TenantSlugGuard.tsx:25-76)

**Issue:** The `useEffect` in TenantSlugGuard has multiple async operations that could race:
1. Check membership
2. Switch tenant by slug
3. Start impersonation

The dependency array is complex and could lead to race conditions when rapidly navigating between tenants.

**Recommendation:** Add a mounting guard and consider using a mutex/lock pattern for tenant switching.

---

### 2.5 Missing Subscription Validation
**Location:** [`src/hooks/TenantProvider.tsx:174-186`](src/hooks/TenantProvider.tsx:174-186)

```typescript
const enabledModules: ModuleType[] = useMemo(() => {
  if (!subscription) {
    return ["crm", "clm", "cpq", "erp", "documents"]; // FALLBACK - ALL MODULES!
  }
  // ... module filtering
}, [subscription]);
```

**Issue:** When no subscription exists, ALL modules are enabled by default. This is dangerous for a multi-tenant system where billing/modules should be controlled per-tenant.

**Impact:** Users without a subscription could potentially access all paid features.

**Recommendation:** Default to NO modules enabled or redirect to billing/subscription setup.

---

## Medium Priority Issues (Priority 3)

### 3.1 Inconsistent Error Handling
**Location:** Throughout hooks

**Issue:** Different hooks handle errors differently:
- Some throw errors
- Some return error objects
- Some use toast notifications inconsistently

**Impact:** Poor user experience and difficult debugging.

---

### 3.2 Missing Loading States in Some Components
**Location:** Various page components

**Issue:** Some components don't show proper loading states while tenant context is loading, leading to "flickering" or brief unauthorized access flashes.

---

### 3.3 No Tenant Invitation System
**Issue:** There's no UI for:
- Inviting users to a tenant
- Accepting tenant invitations
- Managing pending invitations

**Impact:** Employee onboarding requires manual database entries.

---

### 3.4 Missing Tenant Branding/Theming
**Location:** [`src/types/tenant.ts:60-62`](src/types/tenant.ts:60-62)

**Issue:** Tenant type defines `logo_url` and `primary_color` but these are not applied in the UI layouts.

**Impact:** Multi-tenant white-labeling is not functional.

---

### 3.5 Product/Inventory Sharing Across Tenants
**Location:** [`src/hooks/useCPQ.ts`](src/hooks/useCPQ.ts), [`src/hooks/useERP.ts`](src/hooks/useERP.ts)

**Issue:** Products and Inventory items should be tenant-specific but the hooks don't consistently enforce tenant isolation in all scenarios, especially in JOIN queries.

---

### 3.6 Audit Log Tenant Association
**Location:** [`src/lib/audit.ts`](src/lib/audit.ts)

**Issue:** Audit logs have `tenantId` field but need verification that all audit entries correctly capture the tenant context, especially for platform admin actions.

---

## Low Priority Issues (Priority 4)

### 4.1 Route Protection Gaps
**Location:** [`src/App.tsx`](src/App.tsx)

**Issue:** Some legacy routes might not have proper guards. The redirect layer exists but edge cases may exist.

---

### 4.2 Missing TypeScript Strict Mode Compatibility
**Location:** Various files

**Issue:** Some files use `as` type assertions extensively, which bypasses TypeScript safety checks.

---

### 4.3 No Tenant Usage/Billing Tracking
**Issue:** No implementation for:
- Tracking user count per tenant
- Storage usage tracking
- API call limits

---

### 4.4 Missing Platform Admin Dashboard for Tenant Management
**Location:** [`src/pages/admin/panels/TenantsPanel.tsx`](src/pages/admin/panels/TenantsPanel.tsx)

**Issue:** While the panel exists, full tenant lifecycle management (create, suspend, cancel, upgrade) may be incomplete.

---

## Architectural Strengths (Positive Findings)

1. **Well-structured hooks pattern** - Each module (CRM, CPQ, CLM, ERP) has dedicated hooks with proper tenant scoping
2. **Module scope utilities** - `applyModuleReadScope`, `applyModuleMutationScope` provide centralized tenant isolation
3. **Authentication flow** - Proper separation between platform admin and tenant user roles
4. **Impersonation feature** - Platform admins can preview tenant views
5. **Database migrations** - Soft delete and audit logging infrastructure in place
6. **Route structure** - Clean `/tenantSlug/app/module` pattern for tenant isolation

---

## Recommended Action Items

### Immediate (Week 1)
1. Fix hardcoded `defaultTenantId` - implement dynamic tenant creation
2. Add tenant_id filters to Dashboard queries
3. Fix module fallback to disable all modules by default

### Short-term (Week 2-3)
1. Implement tenant invitation system
2. Add tenant scoping to all cross-table queries
3. Fix TenantSlugGuard race conditions

### Medium-term (Month 1)
1. Complete tenant white-labeling (branding)
2. Implement subscription-based module access
3. Add tenant usage tracking/billing hooks
4. Build platform admin tenant management UI

---

## Testing Recommendations

1. **Multi-tenant isolation testing** - Create test users in different tenants and verify they cannot see each other's data
2. **Signup flow testing** - Test customer and employee signup flows
3. **Impersonation testing** - Verify platform admin can view each tenant correctly
4. **Module access testing** - Verify disabled modules are hidden
5. **Role-based access testing** - Test all role types have correct permissions

---

## Files Requiring Changes

| Priority | Files |
|----------|-------|
| Critical | `src/hooks/AuthProvider.tsx`, `src/pages/Dashboard.tsx`, `src/hooks/TenantProvider.tsx` |
| High | `src/hooks/useCRM.ts`, `src/hooks/useCPQ.ts`, `src/hooks/useCLM.ts`, `src/hooks/useERP.ts`, `src/components/auth/TenantSlugGuard.tsx` |
| Medium | `src/components/auth/CustomerSignupForm.tsx`, `src/components/auth/EmployeeSignupForm.tsx`, `src/components/tenant/TenantAdminLayout.tsx` |
| Low | `src/lib/audit.ts`, `src/pages/admin/panels/TenantsPanel.tsx` |

---

*End of Debug Report*
