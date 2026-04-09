# SISWIT CRM Module Debug Report - Employee Account

**Date:** April 9, 2026
**Tester:** Antigravity AI, Sunny
**Environment:** Local Development (Vite + React + Supabase)
**Port:** 8080
**Account:** `djworld366@gmail.com` (Employee)
**Focus:** CRM Modules

---

## 1. Executive Summary
The CRM modules (Leads, Accounts, Contacts, Opportunities, Pipeline, Activities) were tested using an Employee account. While core data creation (POST) is functional for most modules, there is a **Critical Bug** in the Pipeline drag-and-drop feature and several data synchronization/persistence issues in the Opportunities module.

---

## 2. Critical & High Priority Bugs

### 2.1 Broken Pipeline Drag-and-Drop
- **Severity:** Critical
- **Module:** CRM Pipeline (`/crm/pipeline`)
- **Description:** Dragging an opportunity card from one stage to another (e.g., from "Initial Contact" to "Proposal") fails. The card visually snaps back to the original column immediately.
- **Root Cause:** Likely a state update failure or a missing `onDragEnd` handler refinement in the Kanban component. No error is thrown in the console, suggesting a logic error in state reconciliation.
- **Impact:** Core CRM functionality is blocked; users cannot progress deals through the sales funnel.

### 2.2 Opportunities Data Persistence (Close Date)
- **Severity:** High
- **Module:** CRM Opportunities (`/crm/opportunities`)
- **Description:** When creating a new opportunity, the "Close Date" entered in the form is not persisted or not displayed in the list view. The list column consistently shows `-`.
- **Observations:** This suggests a mismatch between the form field name and the Supabase column name, or a failure in the column mapping during the fetch.

---

## 3. Functional & UX Issues

### 3.1 Modal Height & Action Buttons (Accounts/Contacts)
- **Severity:** Medium
- **Module:** CRM Accounts (`/crm/accounts`)
- **Description:** The "Add Account" modal is excessively tall, forcing the "Create" button off-screen on standard resolutions. Users must scroll the modal internally to find the action button.
- **Recommendation:** Implement a sticky footer for modal actions or use a multi-step form for accounts.

### 3.2 Supabase GET 400 Errors (might be a glitch, need to check in supabase the colums exist or not manually)
- **Severity:** Medium
- **Description:** The browser console shows periodic `400 Bad Request` errors from Supabase for `GET` requests on `opportunities` and `contacts`.
- **Reason:** Often occurs if the query parameters (e.g., RLS filters or select fields) are malformed or referencing non-existent columns.
- **Impact:** Transient "No data" states or partial list loads.

---

## 4. Successful Verifications
- **Leads:** Creating, editing, searching, and filtering leads worked perfectly.
- **Activities:** Logging a call/meeting triggered a success toast and correctly updated the activity timeline.
- **Account/Contact Linking:** Successfully created an account and linked a new contact to it.

---

## 5. Technical Recommendations

1.  **Kanban State Management:** Audit the `onDragEnd` logic in the Pipeline component. Ensure `setOpportunities` is called with the correctly reordered/restaged data.
2.  **Date Field Mapping:** Verify that the `close_date` (or equivalent) in the `opportunities` table matches the key used in the creation hook and the list display component.
3.  **UI Refinement:** Cap the maximum height of modals and ensure action buttons are always visible or in a standard location.

---

## 6. Conclusion
The CRM module is visually impressive but currently suffers from a major functional regression in the Pipeline. Resolving the drag-and-drop issue should be the immediate priority for the next development cycle.
