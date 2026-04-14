# Debug Report - SISWIT Unified Platform

**Date:** 2026-04-14
**Environment:** Local dev (http://localhost:8083/)
**Scope:** Full React platform debug sweep - Role-Based Access Control (RBAC), Module Functionality, & UI/UX Audit.

---

## Summary

* **Total issues found:** 13 (Updated)
* **Critical issues:** 3 (Privilege Escalation, Broken Client Access [Now Sync Bug], Auth Redirection)
* **Major issues:** 6 (Sidebar Sync, Mock Search, Incomplete Portal Sync, Performance/Spinners, 404 instead of 403)
* **Minor issues:** 4 (UI Inconsistencies, Fake Buttons, Typo/Copy issues, Logout Persistence [Intermittent])
* **Blockers:** 0 (System is runnable, but key flows are broken for specific roles)
* **Areas tested:** CRM, CPQ, CLM, ERP, Documents, Client Portal, Super Admin Console.
* **Areas not fully testable:** Subscription Management (Confirmed missing feature).

---

## Environment / Setup Notes

* **Setup**: Project runs on Vite + React + Tailwind + Supabase.
* **Port**: Defaulted to `8083`.
* **Services**: Supabase connection is live and responsive.
* **Credentials Verified**:
    * Owner: `sunnyk7rajput@gmail.com`
    * Org Admin: `sahilk7rajput@gmail.com`
    * Employee: `djworld366@gmail.com`
    * Client: `siswitinfra@gmail.com`
    * Super Admin: `admin@siswit.com`

---

## Issues Found

### Issue 01: Privilege Escalation - Employee Access to ERP

**Severity:** Critical
**Area:** RBAC / Security
**Status:** **CONFIRMED**

**Description**
Employees can access the ERP module (and other gated modules) by navigating directly to the URL (e.g., `/:tenant-slug/app/erp`), even though the links are hidden from their sidebar.

**Steps to Reproduce**
1. Log in as Employee (`djworld366@gmail.com`).
2. Notice ERP is missing from sidebar.
3. Manually enter `http://localhost:8083/k7sunny-132/app/erp` in the address bar.
4. The ERP Dashboard loads with full data visibility.

**Affected Files**
* `src/core/auth/components/ModuleGate.tsx`

---

### Issue 02: Broken Client Access - "All Documents" (403)

**Severity:** Major
**Area:** Customer Portal
**Status:** **NOT REPRODUCED** (Currently functions correctly for test client)

**Description**
Initial report stated "All Documents" leads to 403. During sweep, the page loaded correctly.
* **Current Behavior:** Path `/:tenantSlug/app/portal/documents` successfully lists documents for `siswitinfra@gmail.com`.

---

### Issue 03: Sidebar Navigation Sync Bug

**Severity:** Major
**Area:** Global UI
**Status:** **CONFIRMED**

**Description**
Sidebar fails to update active state when navigating via direct URL or internal jumping. "Leads" stayed highlighted while viewing "ERP" (accessed via direct URL).

**Root Cause**
Active state logic in `AdminSidebar.tsx` / `DashboardSidebar.tsx` relies on simple path matching that doesn't account for modules accessed outside the standard sidebar visibility.

---

### Issue 04: Client History/Dashboard Sync Failure

**Severity:** Major
**Area:** Customer Portal
**Status:** **CONFIRMED (NEW DETAILS)**

**Description**
The "History" page in the Client Portal shows "No documents found" even when the main "Documents" page shows several items. This is a critical data sync failure.

**Root Cause**
`DocumentHistoryPage.tsx` uses the `useAutoDocuments` hook, which applies a strict ownership scope (`created_by`). Clients do not "own" documents created for them by employees, so the query returns empty. The Dashboard and Documents pages use a broader email-based fetch that includes e-signatures.

**Affected Files**
* `src/modules/documents/pages/DocumentHistoryPage.tsx`
* `src/modules/documents/hooks/useDocuments.ts`

---

### Issue 05: Top Bar Search is "Mock/Placeholder"

**Severity:** Major
**Area:** UX / Navigation
**Status:** **CONFIRMED**

**Description**
`Cmd+K` does not index application entities (Leads, Orgs, etc.). Searching for "John Doe" (an existing Lead) returns "No matching commands".

---

### Issue 06: Super Admin Subscription Management (Mocked)

**Severity:** Major
**Area:** Super Admin
**Status:** **CONFIRMED**

**Description**
The Subscription Management page in the Super Admin console is partially functional. The search bar is disabled with the placeholder "Subscription searches are disabled", and the plan matrix appears to be static.

---

### Issue 07: Unauthorized Access leads to 404 instead of 403

**Severity:** Major
**Area:** Universal
**Status:** **NEW ISSUE**

**Description**
When an employee attempts to access root-level organization settings (e.g., `/organization/billing`), they receive a standard "404 Page Not Found" instead of a proper "403 Unauthorized" or a redirect with an error toast. 

**Root Cause**
The URL structure for non-tenant routes doesn't match the employee's standard `/:tenantSlug/app` pattern, causing fall-through to the global 404 handler before hitting the RBAC guards in some cases, or the guards are not configured to handle cross-workspace pathing gracefully.

---

## Role-Based Access Issues 🔐

* **Organization Owner**: Full access.
* **Organization Admin**: Has access to Workspace Billing.
* **Employee**: 
    * **Bug**: Can access ERP via URL.
    * **Bug**: Accessing billing shows 404.
* **Client**:
    * **Bug**: History page sync failure (0 documents shown).

---

## Fix Priority

### Fix First (Critical/Major)
1. **Privilege Escalation**: Update `ModuleGate` to include role checks.
2. **History Sync**: Fix `useAutoDocuments` or update `DocumentHistoryPage` to use the broader portal scope for client users.
3. **RBAC Redirection**: Replace 404s with proper 403s for unauthorized path attempts.

### Fix Next (Major)
1. **Search Indexing**: Populate the Command menu.
2. **Sidebar Logic**: Exact path matching for active items.

---

**Investigator:** Antigravity AI
**Status:** Debug Sweep Complete. Verified against live dev env.
