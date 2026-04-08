# SISWIT Debug Report - Organization Admin Panel

**Date:** April 8, 2026
**Tester:** Sunny
**Environment:** Local Development (Vite + React + Supabase)
**Port:** 8080
**Account:** `sahilk7rajput@gmail.com` (Organization Admin)

---

## 1. Executive Summary
The Organization Admin panel (labeled "Command Center") provides a centralized hub for cross-module management (CRM, CLM, CPQ, ERP, Documents). While the UI is highly polished and routing is functional, there are persistent UX issues regarding user feedback and data-fetching consistency.

---

## 2. Identified Bugs & Issues

### 2.1 Initial Metric Loading Delays
- **Severity:** Medium
- **Description:** Upon entering the "Command Center" dashboard, key operational metrics (Total Leads, Contracts, Pending Invites) frequently show a value of "0" for several seconds. 
- **Observations:** This appears consistent with the behavior observed in the Owner panel, likely due to a race condition where the UI renders before the Supabase data fetching in `useOrganizationPerformance.ts` completes.
- **Impact:** Can lead to user confusion regarding the actual state of the organization.

### 2.2 Missing Invitation Feedback
- **Severity:** Medium
- **Description:** Sending an invitation (via the "Admin Invite" button or the Invitations page) successfully clears the form but does not trigger a success toast or notification.
- **Root Cause:** Although `toast()` is called in the code, it may not be firing correctly or is being suppressed, similar to the issue noted in the Owner panel testing.
- **Impact:** High uncertainty for the admin after performing a critical action.

### 2.3 Navigation Delay / "Double Click" Requirement
- **Severity:** Low
- **Description:** Occasionally, clicking a sidebar link (e.g., "CRM (All)", "CLM (All)") does not immediate trigger the navigation. A second click is sometimes required, or there is a noticeable lag before the main content area updates.
- **Recommendation:** Investigate potential overhead in the `OrganizationAdminLayout` or `Suspense` boundaries for these modules.

### 2.4 Profile Settings Redundancy
- **Severity:** Low
- **Description:** The "System Settings" link in the user profile dropdown leads to the same configuration page as the "Settings" link in the sidebar, or routes back to the organization-level settings without admin-specific differentiation.

---

## 3. UX/UI Observations
- **Command Search:** The "Search command..." functionality works well for navigating to specific pages.
- **Theming:** The transition between light and dark modes is smooth, though the "Command Center" aesthetics are optimized for Dark Mode.
- **Layout:** The categorisation into "Management", "Operations", and "Logistics" is clear and intuitive.

---

## 4. Technical Recommendations

### 4.1 Improve Dashboard Hydration
Implement loading skeletons for metrics on the Command Center dashboard to prevent the "0" values from appearing as final data. Ensure that `useOrganizationPerformance` properly handles the `isLoading` state from TanStack Query.

### 4.2 Fix Notification Feedback
Verify the `<Toaster />` mounting in `App.tsx` and ensure that the `toast` function is correctly wired for the Admin panels.

---

## 5. Conclusion
The Admin Panel is a powerful tool for daily operations. Resolving the data-fetching race conditions and adding immediate success feedback for invitations will significantly enhance the "Command Center" feel.
