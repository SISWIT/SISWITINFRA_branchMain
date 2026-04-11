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
