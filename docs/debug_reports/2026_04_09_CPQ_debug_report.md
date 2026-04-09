# SISWIT CPQ Module Debug Report - Employee Account

**Date:** April 9, 2026
**Tester:** Antigravity AI
**Environment:** Local Development (Vite + React + Supabase)
**Port:** 8080
**Account:** `djworld366@gmail.com` (Employee)
**Focus:** CPQ (Configure, Price, Quote) Modules

---

## 1. Executive Summary

The CPQ module is functional for primary business flows—Product Management and basic Quote lifecycles (Creation, Calculation, Approval). However, significant routing errors were identified that could break the application in production (tenant-specific environments).

---

## 2. High Priority Bugs & Routing Issues

### 2.1 Hardcoded Routing / Tenant Context Breaks (CPQ-001)

- **Severity:** High
- **Description:** The "Create Quote" button and several other action buttons in the CPQ module are using hardcoded absolute paths (e.g., `href='/dashboard/cpq/quotes/new'`).
- **Impact:** This bypasses the dynamic tenant slug routing (`/:tenantSlug/app/...`). In a multi-tenant environment, this will lead to 404 errors or session state data leakage across organizations.
- **Recommendation:** Refactor all navigation to use relative paths or the `useParams()` tenant slug.

### 2.2 Contract Conversion Link (CPQ-002)

- **Severity:** High
- **Description:** The "Convert to Contract" action also attempts to redirect to `/dashboard/clm/...`, which is outside the current tenant route structure.

---

## 3. Functional Observations

### 3.1 Quote Calculation Engine

- **Status:** Verified
- **Observations:** Successfully calculated a 18% GST tax correctly on a ₹150.00 product, resulting in a ₹177.00 total. The discount logic (0%) was also correctly applied.
- **Approval Flow:** Moving a quote from "Pending Approval" to "Approved" correctly updates the UI state.

### 3.2 Add Product Selection (CPQ-004)

- **Severity:** Medium
- **Description:** Selecting an Account or Contact in the Quote creation form occasionally fails to "stick" on the first click, requiring a second attempt or re-selection from the dropdown.

---

## 4. UI/UX & Module Organization

### 4.1 Templates Module Discrepancy (CPQ-003)

- **Observation:** "Templates" are currently nested under the CLM sidebar, not the CPQ sidebar. Or maybe there is No need of templates in CPQ module? Need to verify this from good source. If templates are needed in CPQ module, then add a separate template section in CPQ sidebar, and make its related changes in code. Also UI/UX changes.
- **UX Impact:** Users generating quotes in the CPQ module cannot easily find or apply document templates without switching module contexts.
- **Recommendation:** Add a separate template section in CPQ sidebar, and make its related changes in code. Also UI/UX changes.
  Use Stitch for UI ideas.

### 4.2 Empty Dashboard State

- **Observation:** The CPQ Dashboard charts remain entirely blank for new employees.
- **Recommendation:** Add "Empty State" illustrations or mock data indicators to keep the UI engaging during onboarding.

---

## 5. Conclusion

The CPQ engine is accurate in its calculations and data handling. The most urgent fixes required are the **routing normalization** to ensure multi-tenant compatibility and improving the **Template integration** within the CPQ workflow.
