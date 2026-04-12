# Implementation Plan: Topbar Date Picker Functional

**Date:** 2026-04-12  
**Topic:** Make the topbar `Current` date picker actually filter workspace data.

## 1. Goal

Convert the topbar date chip from display-only behavior into a real data filter across:
- Employee workspace dashboard
- Organization Admin workspace dashboard
- Organization Owner performance/dashboard views

## 2. Current State

- Topbar stores `selectedDate` only in local component state.
- UI label changes (`Current` -> selected date), but no backend query uses this value.
- No shared state between topbar and page-level data hooks.

## 3. Target Behavior

1. `Current` means today in local timezone.
2. Selecting a date filters metrics/lists/charts for that day (or range derived from it).
3. Date is sharable and persists on refresh through URL query param.
4. “Reset to Current” clears custom date selection.

## 4. Technical Design

### 4.1 Shared Date Filter Source

Implement a reusable hook (e.g. `useWorkspaceDateFilter`) that:
- reads `date` from URL query (`YYYY-MM-DD`)
- validates and normalizes value
- returns:
  - `selectedDate` (`Date | undefined`)
  - `effectiveDate` (`Date` fallback to today)
  - `isCurrent` (`boolean`)
  - setters (`setDate`, `resetToCurrent`)

### 4.2 Topbar Integration

Update these components to use shared hook instead of local `useState`:
- `src/workspaces/employee/layout/EmployeeTopBar.tsx`
- `src/workspaces/organization_admin/components/AdminTopBar.tsx`
- `src/workspaces/organization/components/OrganizationTopBar.tsx`

Behavior:
- chip text uses hook state
- calendar `onSelect` calls `setDate`
- add clear/reset action to return to `Current`

### 4.3 Data Hook Wiring

Pass `effectiveDate` to all dashboard queries and include it in query keys.

- Employee dashboard:
  - `src/workspaces/employee/pages/Dashboard.tsx`
  - apply date constraints to stats and activity queries

- Admin dashboard:
  - `src/workspaces/organization_admin/hooks/useOrganizationAdminDashboard.ts`
  - accept optional date param and filter counts/lists/charts consistently

- Owner performance:
  - `src/workspaces/organization/hooks/useOrganizationPerformance.ts`
  - replace fixed “last 7 days” anchor with selected date anchor where relevant

## 5. Query Rules

Use one consistent interval strategy:
- `dayStart = YYYY-MM-DDT00:00:00`
- `dayEnd = YYYY-MM-DDT23:59:59.999`

For “MTD” metrics:
- start = first day of selected date’s month
- end = selected date

For trend windows:
- compute windows relative to selected date (not system now)

## 6. Validation Checklist

1. Select a date -> card values and activity list change.
2. Refresh page -> same date remains applied.
3. Copy URL and open in new tab -> same filtered state appears.
4. Click reset/current -> values return to today.
5. Works in employee/admin/owner workspaces.
6. `npx tsc --noEmit` and eslint pass on touched files.

## 7. Rollout Plan

1. Phase 1: Dashboard pages only (employee/admin/owner).
2. Phase 2: Extend to module pages (CRM/CPQ/CLM/ERP/Documents) if needed.
3. Phase 3: Optional presets (`Today`, `Last 7 days`, `This month`) if requested.

