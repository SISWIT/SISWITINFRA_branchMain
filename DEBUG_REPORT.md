# 🔍 SISWIT Platform — Comprehensive Debug Report

> **Date:** 2026-03-01  
> **Platform:** SISWIT Unified Platform (Vite + React + TypeScript + Supabase)  
> **Environment:** Development (localhost:8080)  
> **Scope:** Full-stack testing of authentication, authorization, multi-tenant data isolation, UI/UX, modules, and security

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues](#critical-issues)
3. [Authentication & Authorization Issues](#authentication--authorization-issues)
4. [Security Vulnerabilities](#security-vulnerabilities)
5. [Sign-Up Flow Issues](#sign-up-flow-issues)
6. [UI/UX Issues](#uiux-issues)
7. [Multi-Tenant Data Isolation Review](#multi-tenant-data-isolation-review)
8. [Module-Level Findings](#module-level-findings)
9. [Console Errors & Warnings](#console-errors--warnings)
10. [Recommendations](#recommendations)

---

## Executive Summary

The SISWIT platform is a multi-tenant SaaS application offering CLM, CPQ, CRM, ERP, and Auto Documentation modules. Overall, the platform has a solid architectural foundation with proper tenant isolation through `organization_id` scoping, role-based access control, and protected routes. However, several **critical** and **medium** severity issues were found that need attention before production deployment.

| Severity | Count |
|----------|-------|
| 🔴 Critical | 3 |
| 🟠 High | 4 |
| 🟡 Medium | 5 |
| 🔵 Low | 4 |

---

## Critical Issues

### 🔴 C-01: Supabase Auth Tokens Stored in `localStorage` (XSS Risk)

**File:** `src/core/api/client.ts` (Line 13)

```typescript
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,  // ← XSS vulnerability
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

**Impact:** If any XSS vulnerability exists anywhere in the application, an attacker could steal auth tokens from `localStorage` and impersonate users. This is the single most critical security issue.

**Recommendation:** Use `sessionStorage` or implement HTTP-only cookies for token storage. At minimum, switch to `sessionStorage` which limits exposure to the current browser tab.

---

### 🔴 C-02: No Email Verification Enforcement on Sign-In

**Files:** `src/app/providers/AuthProvider.tsx` (Lines 924-968), `src/workspaces/auth/pages/SignUp.tsx`

The sign-up flow correctly sets `account_state: "pending_verification"` and `is_email_verified: false` in the membership record. The post-sign-up UI message says:

> "Your account was created and a verification email has been sent. Verify your email, then sign in."

However, the `signIn` function **does not check email verification status**. A user can sign up, skip email verification entirely, and sign in immediately. The `signIn` function only:
1. Calls `supabase.auth.signInWithPassword`
2. Calls `getUserRole`
3. Returns the role

It never checks `is_email_verified` or `account_state === "pending_verification"`.

**Impact:** Users can access the platform without ever confirming their email address, undermining email ownership verification.

**Recommendation:** Add an email verification check in the `signIn` function or in the `resolveRoleFromMembershipState` function. If `account_state` is `"pending_verification"`, return a specific error message and redirect to a "Please verify your email" page.

---

### 🔴 C-03: Silent Login Failure — No Error Feedback to User

**File:** `src/workspaces/auth/pages/Auth.tsx` (Lines 75-82)

During browser testing, entering incorrect credentials (`test@test.com` / `wrongpassword123`) produced **no visible error message** to the user. The button briefly showed "Signing in..." then reverted to "Sign in" with no toast notification.

The code does call `toast()` on error:
```typescript
if (error) {
  toast({
    variant: "destructive",
    title: "Sign in failed",
    description: error,
  });
  return;
}
```

However, the Supabase `signInWithPassword` returned a 400 error that was visible in the console but the toast notification did not appear on screen.

**Possible Causes:**
- The `Toaster` component may not be rendering properly at that point in the component tree
- The toast event might be fired before the Toaster is mounted
- The `useToast` hook from `@/core/hooks/use-toast` may not be wired to the correct Toaster instance (there are two Toasters: `<Toaster />` and `<Sonner />`)

**Impact:** Users have no way to know why login failed, severely harming user experience.

**Recommendation:** Debug the toast rendering chain. Verify that the `useToast` hook is connected to the same `Toaster` component rendered in `App.tsx`. Consider adding a fallback inline error message state.

---

## Authentication & Authorization Issues

### 🟠 A-01: `remember_me` Flag Stored in `localStorage`

**File:** `src/app/providers/AuthProvider.tsx` (Line 929)

```typescript
localStorage.setItem("siswit_remember_me", rememberMe ? "1" : "0");
```

This flag is stored in `localStorage` but never read anywhere in the codebase. If the intent is to control session persistence, this should be implemented properly — e.g., using `sessionStorage` for session-only auth when "Remember Me" is unchecked.

**Recommendation:** Either implement the actual remember-me behavior or remove the dead code.

---

### 🟠 A-02: Role Caching in `sessionStorage` Without Integrity Check

**File:** `src/app/providers/AuthProvider.tsx` (Lines 169-197)

Roles are cached in `sessionStorage` with a 1-hour TTL:
```typescript
sessionStorage.setItem(`${ROLE_CACHE_KEY_PREFIX}${userId}`, JSON.stringify(payload));
```

While `sessionStorage` is safer than `localStorage`, there is no integrity check (e.g., HMAC) on the cached role. A technically savvy user could modify their cached role via browser DevTools to escalate privileges.

**Mitigated by:** Server-side RLS policies on Supabase (if properly configured), which would prevent actual data access regardless of client-side role manipulation.

**Recommendation:** This is acceptable if RLS policies are comprehensive. Add a comment documenting that the cached role is for UI rendering only and does not grant server-side access.

---

### 🟡 A-03: No Rate Limiting on Login Attempts (Client-Side)

The sign-in form has no client-side rate limiting for failed login attempts. While Supabase may have server-side rate limiting, there is no visual feedback about attempt limits.

**Recommendation:** Add a client-side counter that disables the login button after 5 failed attempts with a cooldown, similar to the forgot-password cooldown.

---

### 🟡 A-04: Password Policy Not Enforced on Server Side

The sign-up form has a client-side password strength meter requiring 12+ characters with uppercase, lowercase, numbers, and special characters. However, the `minLength` HTML attribute is set to 12 — there is no server-side enforcement beyond Supabase's default minimum (6 characters).

**Recommendation:** Configure Supabase password policy to require minimum 12 characters, or add server-side validation in a Supabase Edge Function.

---

## Security Vulnerabilities

### 🟠 S-01: Supabase Publishable Key Exposed in `.env`

**File:** `.env`

```
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_V9p_-fjCAZtwQ-XwAmkp-w_ABD_2gHd"
```

While publishable keys are designed to be public, this file should be in `.gitignore` (which it is). However, the key is also embedded in the built JavaScript bundle, accessible to anyone. Ensure that:
- RLS policies are comprehensive on all tables
- No service role key is ever exposed client-side

---

### 🟠 S-02: `AuthApiError: Invalid Refresh Token` on Public Pages

**Location:** Console logs on every public page load

Every time an unauthenticated user visits any page, the console shows:
```
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

While not a security vulnerability per se, this indicates the Supabase client attempts to refresh a non-existent session on every page load.

**Recommendation:** Wrap the session refresh in a check for existing stored tokens before attempting. This also creates unnecessary network requests.

---

### 🔵 S-03: Organization Search Exposes Organization Data to Unauthenticated Users

**File:** `src/workspaces/auth/pages/SignUp.tsx` (Lines 113-148)

The client sign-up page calls `search_signup_organizations` RPC with a debounced query, exposing organization names, slugs, and codes to anyone on the sign-up page. This is by design for client self-registration, but consider:
- Whether org codes should be hidden from search results
- Whether this could be used for org enumeration

---

## Sign-Up Flow Issues

### 🟡 M-01: Organization Code Placeholder Confusion

**File:** `src/workspaces/auth/pages/SignUp.tsx` (Line 292)

```html
<Input placeholder={`Organization Code (suggested: ${suggestedCode})`} ... />
```

The suggested code (e.g., "ORG3510") appears in the placeholder and looks like a pre-filled value, confusing users into thinking the field is already populated.

**Recommendation:** Either auto-fill the field with the suggested code or change the placeholder to "Enter a unique code (optional)".

---

### 🟡 M-02: No Success Page After Sign-Up (Just a Message in the Same Page)

After org sign-up succeeds, the page shows a small green box saying "Organization created" with links to sign in or go home. This is functional but:
- Doesn't clearly communicate the email verification step
- No verification email status indicator
- No "resend email" option
- User might miss the message and try to log in immediately (which would work — see C-02)

**Recommendation:** Redirect to a dedicated "Check Your Email" page similar to what major SaaS platforms do.

---

### 🔵 M-03: Organization Code Not Validated for Uniqueness Pre-Submit

The organization code field accepts any input up to 20 characters. If a duplicate code is submitted, the backend retries with a modified code (up to 10 attempts). However, the user is never informed that their chosen code was changed.

**Recommendation:** Add a real-time availability check for org codes, or inform users if their code was modified.

---

## UI/UX Issues

### 🔵 U-01: Missing "Contact" Link in Header Navigation

The main website header contains: Home, Products, Solutions, Pricing, About — but **no Contact link**. The Contact page is only accessible via "Request Demo" or "Contact Sales" buttons in page bodies and the footer.

**Recommendation:** Add "Contact" to the header navigation for consistency.

---

### 🟡 U-02: Sign-Up Page Not Scrollable on Small Viewports

The organization sign-up form has 6 fields plus a password strength meter. On smaller screens (< 768px height), the "Create Organization" button may be cut off. The form needs to be inside a properly scrollable container.

**Recommendation:** Ensure the form container uses `overflow-y-auto` for smaller viewports.

---

### 🔵 U-03: Footer Branding Inconsistency

The footer on the Contact page shows "SIT**WIT**" instead of "SIS**WIT**" (missing the "S").

**Recommendation:** Fix the footer brand name to consistently show "SISWIT".

---

### 🟡 U-04: Reset Password Page Fields Not Actually Disabled

When visiting `/auth/reset-password` directly (without a valid token), the page shows a warning message "Open this page from your password reset email link to set a new password." However, the password fields still appear enabled and users could attempt to type in them. The button should be explicitly disabled.

**Recommendation:** Disable the input fields and button when no valid token is detected.

---

## Multi-Tenant Data Isolation Review

### ✅ Architecture Assessment: **SOLID**

The platform implements a robust multi-tenant isolation pattern:

| Layer | Mechanism | Status |
|-------|-----------|--------|
| **Route Layer** | `TenantSlugGuard` checks membership before rendering tenant routes | ✅ Good |
| **Auth Layer** | `AuthProvider` resolves role from `organization_memberships` table scoped by `user_id` | ✅ Good |
| **Data Layer** | `applyModuleReadScope()` filters all queries by `organization_id` | ✅ Good |
| **Mutation Layer** | `applyModuleMutationScope()` ensures writes are scoped to org + owner | ✅ Good |
| **Create Layer** | `buildModuleCreatePayload()` injects `organization_id` and `owner_id` | ✅ Good |
| **Soft Delete** | `softDeleteRecord()` used instead of hard deletes | ✅ Good |
| **Audit** | `writeAuditLog()` called on CRM CRUD operations | ✅ Good |

The critical `module-scope.ts` utility (`src/core/utils/module-scope.ts`) properly:
1. Requires `organizationId` before any query
2. Filters all reads by `organization_id`
3. Excludes soft-deleted records by default
4. Applies owner-scoping for restricted roles
5. Injects `organization_id` into all create payloads

### ⚠️ Dependency on Server-Side RLS

The client-side isolation is well-implemented, but **assumes Supabase RLS policies are properly configured on all tables**. If RLS is missing or misconfigured on any table, the Supabase publishable key (which is public) could be used to query data across organizations.

**Recommendation:** Audit all Supabase tables to ensure RLS policies enforce `organization_id` filtering at the database level, not just the client level.

---

## Module-Level Findings

### CRM Module

- **Data Isolation:** Uses `useCrmScope()` → `applyModuleReadScope()` pattern consistently across leads, accounts, contacts, opportunities, activities ✅
- **Audit Logging:** CRUD operations write audit logs ✅
- **Soft Delete:** Uses `softDeleteRecord` ✅
- **Issue:** Query keys use `tenantId` alias instead of `organizationId` — legacy naming that should be migrated for clarity

### CLM, CPQ, ERP, Documents

- These modules follow the same scope pattern via `module-scope.ts`
- Module access is controlled by `organization_subscriptions` table (`module_crm`, `module_clm`, etc.)
- Default "starter" plan enables: CRM ✅, CPQ ✅, Documents ✅, CLM ❌, ERP ❌

---

## Console Errors & Warnings

| Type | Message | Location | Severity |
|------|---------|----------|----------|
| Error | `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` | Every public page | 🟡 Medium |
| Warning | React Router Future Flag: `v7_startTransition` | All pages | 🔵 Low |
| Warning | React Router Future Flag: `v7_relativeSplatPath` | All pages | 🔵 Low |
| Error | `400 Bad Request` on `/auth/v1/token?grant_type=password` | Sign-in (wrong credentials) | 🔴 Critical (no UI feedback) |

---

## Recommendations

### Immediate (Pre-Launch)

1. **Fix C-01:** Switch Supabase auth storage from `localStorage` to `sessionStorage` in `client.ts`
2. **Fix C-02:** Add email verification check in `signIn` function — block login if `account_state` is `"pending_verification"`
3. **Fix C-03:** Debug and fix the toast notification chain so login errors are visible to users
4. **Audit RLS:** Verify all Supabase tables have proper RLS policies enforcing `organization_id` isolation

### Short-Term

5. Add rate limiting to login form (5 failed attempts → 60s cooldown)
6. Create a dedicated "Verify Your Email" page post-signup
7. Add "Contact" to header navigation
8. Fix footer brand name from "SITWIT" to "SISWIT"
9. Remove or implement the `remember_me` localStorage flag
10. Configure server-side password minimum to match client-side (12 chars)

### Long-Term

11. Migrate from React Router v6 to v7 to resolve future flag warnings
12. Rename `tenantId`/`tenant_id` references to `organizationId`/`organization_id` for naming consistency
13. Add a real-time org code availability checker on sign-up
14. Implement CSRF protection for state-changing operations
15. Add automated integration tests for cross-tenant data isolation

---

## Test Session Coverage

| Area | Tested | Method |
|------|--------|--------|
| Homepage | ✅ | Browser |
| Products page | ✅ | Browser |
| Solutions page | ✅ | Browser |
| Pricing page | ✅ | Browser |
| About page | ✅ | Browser |
| Contact page | ✅ | Browser |
| Sign-In page | ✅ | Browser + Code review |
| Sign-Up (Organization) | ✅ | Browser + Code review |
| Sign-Up (Client) | ✅ | Browser + Code review |
| Forgot Password | ✅ | Browser + Code review |
| Reset Password (no token) | ✅ | Browser |
| Email verification flow | ✅ | Code review |
| AuthProvider (signIn/signUp) | ✅ | Code review |
| TenantProvider | ✅ | Code review |
| OrganizationProvider | ✅ | Code review |
| TenantSlugGuard | ✅ | Code review |
| Module data isolation | ✅ | Code review |
| CRM hooks (useCRM.ts) | ✅ | Code review |
| module-scope.ts | ✅ | Code review |
| Supabase client config | ✅ | Code review |

---

*Report generated by comprehensive automated testing and code review session.*
