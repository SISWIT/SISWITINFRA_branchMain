# Technical Update Log - SISWIT Core Modules

**Date:** April 11, 2026  
**Author:** Sunny  

**Executive Scope:**  
Technical enhancements on the CLM scan flow and workspace structural state bug fixes.

---

## 1. Feature Implementation: CLM Contract Scan Flow (Paused)

**Date:** 2026-04-11

**Issue:** 
Open behavior: `3 images -> 3 scans -> 3 results` logic needs to be fully finalized and made deterministic. Currently paused without full completion.

**Implemented Fixes:**
- Added live scan mode toggle (`VITE_ENABLE_LIVE_CONTRACT_SCAN`).
- Added cache read/write by upload fingerprint (`fileHash` or `name+size`).
- Added live call path to edge function `contract-scan-ai` while keeping mock fallback when live mode is off or unavailable.
- Saved scan rows with OCR payload from live/mock/cache result.
- `useContractScans("global")` now queries scans with `contract_id IS NULL`.
- `useCreateContractScan` now persists `file_url` correctly.
- Added SHA-256 file hashing during upload. `onUploadComplete` now receives `fileHash`.
- Extended `UploadResult` with optional `fileHash`.
- Expanded live AI extraction pipeline with fallback + normalization internally.

**Files Updated:**
- `src/modules/clm/pages/ContractScanPage.tsx`
- `src/modules/clm/hooks/useCLM.ts`
- `src/ui/file-upload.tsx`
- `src/core/utils/upload.ts`
- `supabase/functions/contract-scan-ai/index.ts`
- `supabase/config.toml`
- `.env`

**Where To Restart Later:**
- Start at `handleUploadComplete` in `src/modules/clm/pages/ContractScanPage.tsx`.
- Verify mapping: one uploaded file should map to one scan row and one visible result card/state.
- Check for duplicate triggers from `src/ui/file-upload.tsx` (`multiple=true` + per-file callback behavior).
- Confirm whether scan history list and active result state are sharing/overwriting data unexpectedly.
- Validate with exactly 3 uploads in one batch and log per-file ids (`fileHash`, `scan.id`, `file_name`).
- Quick Goal For Next Pass: Enforce deterministic `1 file -> 1 scan record -> 1 corresponding result render`, no cross-file bleed.

---

## 2. Bug Fix: Employee Workspace Tab Refresh

**Date:** 2026-04-11

**Issue:** 
Switching tabs or minimizing the window triggered Supabase's `visibilitychange` listener, which fetched a newly allocated `Session` object. `AuthProvider` updated `user` to this new object reference. Hooks in `OrganizationProvider` listening to `[user]` re-ran unnecessarily, triggering `tenantLoading = true`, which caused `<TenantSlugGuard>` to entirely unmount the Employee Dashboard and show a global loader.

**Root Cause:**
Reliance on full Javascript object identity within React `useEffect` dependency arrays rather than stable primitives.

**Implemented Fixes:**
- Modified dependency arrays across `OrganizationProvider` and `Dashboard`.
- Updated `OrganizationProvider.tsx` and `Dashboard.tsx` so they explicitly depend strictly on the primitive `[user?.id]` instead of the volatile `[user]` object identity.

**Files Updated:**
- `src/app/providers/OrganizationProvider.tsx`
- `src/workspaces/employee/pages/Dashboard.tsx`

**Outcome:**
The Employee workspace persists scroll location and layout states correctly when returning from an inactive tab, without triggering unmount loaders.

**Verification:**
- Manually verified on April 11, 2026:
  - Transitioning tabs while inside the Employee dashboard holds internal state safely without a loader interruption.

---

## 3. Feature Implementation: Cross-Workspace Notification Broadcasting

**Date:** 2026-04-11

**Issue:**
When an employee created an entity (lead, quote, contract, purchase order, etc.), the notification bell only updated in the employee workspace. Organization Owners and Admins in other workspaces received no notification about employee-generated activity. Furthermore, notifications were not appearing in real-time due to missing WebSocket publication settings.

**Root Cause:**
1. The `useCreateNotification` hook called the `create_notification` RPC, which inserts a single notification row targeting only the `userId` of the actor. There was no mechanism to fan out notifications to other users based on their organizational role.
2. The `public.notifications` table was not added to the `supabase_realtime` publication, meaning Supabase's Realtime WebSocket channels silently ignored `INSERT` events, leaving the frontend's `.on("postgres_changes")` listener dead.

**Implemented Fixes:**
- Created a new `broadcast_notification` RPC (`067`) that accepts target roles (e.g. `['owner', 'admin']`) and inserts a notification row for every active member holding one of those roles within the organization, plus the actor user.
- Extended `useCreateNotification` and all call sites in CRM, CPQ, and CLM to use broadcasting.
- **Added missing `notify()` calls** to:
  - CRM (`useCreateLead`, `useCreateAccount`, `useCreateContact`, `useCreateActivity`)
  - ERP (`useCreateSupplier`, `useCreateInventoryItem`, `useCreatePurchaseOrder`, `useCreateProductionOrder`, `useCreateFinancialRecord`)
  - Auto Documents (`useCreateDocumentTemplate`, `useCreateAutoDocument`, `useCreateDocumentESignature`, `useCreateDocumentVersion`)
- Expanded `NotificationType` definitions and mapped new Lucide icons inside `NotificationBell.tsx`.
- **Enabled Real-time**: Created SQL Migration (`068`) to append the `notifications` table to the `supabase_realtime` publication.

**Files Updated:**
- `supabase/migrations/067_broadcast_notifications.sql` [NEW]
- `supabase/migrations/068_enable_notifications_realtime.sql` [NEW]
- `src/core/types/notifications.ts`
- `src/ui/notification-bell.tsx`
- `src/core/hooks/useCreateNotification.ts`
- `src/core/hooks/usePlanLimits.ts`
- `src/modules/crm/hooks/useCRM.ts`
- `src/modules/cpq/hooks/useCPQ.ts`
- `src/modules/clm/hooks/useCLM.ts`
- `src/modules/erp/hooks/useERP.ts`
- `src/modules/documents/hooks/useDocuments.ts`

**Outcome:**
All entity creations across CRM, CPQ, CLM, ERP, and Auto Documents now reliably broadcast notifications to Organization Owners and Admins. Thanks to the updated publication schema, these notifications will now instantly blink the bell via WebSocket streams without requiring a manual refresh.

**Validation:**
- `npx tsc --noEmit` — clean build, no type errors.

**Verification:**
- Manually verified on April 11, 2026:
  - Created a lead/quote/contract/supplier/document as an employee.
  - Switched to the Organization/Admin workspace and confirmed the notification bell updates instantly in real-time via WebSocket.

---

## 4. Bug Fix: Notification Click Redirected to `/unauthorized` (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Clicking notifications from workspace bells was navigating users to `/unauthorized`.

**Root Cause:**  
Notification links were stored/generated using organization UUID paths (`/<org-id>/app/...`) while protected tenant routes require slug paths (`/<tenant-slug>/app/...`).

**Implemented Fixes:**
- Added notification link normalization for existing records to convert UUID-based app links to slug-based links at navigation time.
- Updated bell click and realtime toast "View" navigation to use normalized links.
- Updated notification link generation in CLM/CPQ/CRM/ERP/Documents flows to use slug-first paths.
- Extended module scope output with `tenantSlug`/`organizationSlug` for safer route link creation.

**Files Updated:**
- `src/core/utils/notification-links.ts` [NEW]
- `src/ui/notification-bell.tsx`
- `src/core/hooks/useNotifications.ts`
- `src/core/hooks/useModuleScope.ts`
- `src/modules/clm/hooks/useCLM.ts`
- `src/modules/cpq/hooks/useCPQ.ts`
- `src/modules/crm/hooks/useCRM.ts`
- `src/modules/erp/hooks/useERP.ts`
- `src/modules/documents/hooks/useDocuments.ts`

**Verification:**
- Manually verified on April 11, 2026:
  - Opened notification bell in workspace and clicked notifications.
  - Confirmed links now route to intended module pages and no longer fall into `/unauthorized`.

---

## 5. Feature Fix: Subscription & Plan Activity Notifications (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Subscription-related actions (plan change, subscription activation/cancellation, payment status events) were not consistently notifying both Organization Owner and Organization Admin workspaces.

**Root Cause:**  
Subscription events were stored in `subscription_events`, but there was no centralized fan-out into `notifications` for owner/admin roles on every relevant event path. Also, manual plan updates via `upgrade_organization_plan` did not emit plan event rows for notification propagation.

**Implemented Fixes:**
- Added subscription notification types to frontend notification typing and bell icon mapping.
- Added DB trigger-based notification fan-out from `subscription_events` to all active `owner` and `admin` members.
- Added plan-change event emission (`plan_upgraded` / `plan_downgraded`) inside `upgrade_organization_plan`.
- Standardized payment failure notification flow by removing direct owner-only insert in webhook and relying on event-driven fan-out.
- Routed subscription notifications to workspace subscription page via slug path (`/:tenantSlug/app/subscription`).

**Files Updated:**
- `supabase/migrations/069_subscription_event_notifications.sql` [NEW]
- `supabase/functions/razorpay-webhook/index.ts`
- `src/core/types/notifications.ts`
- `src/ui/notification-bell.tsx`

**Validation:**
- `npx tsc --noEmit` â€” clean.
- `eslint` on updated files â€” clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Triggered subscription/plan activity.
  - Confirmed notifications appear in both Organization Owner and Organization Admin workspaces.
  - Confirmed notification click routes to subscription page correctly.

---

## 6. Bug Fix: CLM Recent Scan Delete Failing (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Deleting items from CLM "Recent Scans" failed with Supabase `400 Bad Request` and runtime error:
`Could not find the 'deleted_at' column of 'contract_scans' in the schema cache`.

**Root Cause:**  
`useDeleteContractScan` incorrectly used `softDeleteRecord`, but `contract_scans` does not implement soft-delete columns (`deleted_at`, `deleted_by`).

**Implemented Fixes:**
- Replaced soft-delete call with scoped hard delete using `applyModuleMutationScope` on `contract_scans`.
- Kept tenant/user access checks before delete.
- Updated success message to reflect actual behavior ("Contract scan deleted").

**Files Updated:**
- `src/modules/clm/hooks/useCLM.ts`

**Validation:**
- `npx tsc --noEmit` â€” clean.
- `npx.cmd eslint src/modules/clm/hooks/useCLM.ts` â€” clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Deleted scan entries from CLM Recent Scans.
  - Confirmed records delete successfully and no `deleted_at` schema errors are thrown.
