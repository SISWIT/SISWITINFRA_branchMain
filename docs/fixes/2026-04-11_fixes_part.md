# Technical Update Log - SISWIT Core Modules

**Date:** April 11, 2026  
**Author:** Sunny  

**Executive Scope:**  
Technical enhancements on the CLM scan flow and workspace structural state bug fixes.

---

## 1. Feature Implementation: CLM Contract Scan Flow (Paused)

**Date:** 2026-04-11
**Status:** PASSED

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
**Status:** PASSED

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
**Status:** PASSED

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

---

## 7. Bug Fix: Documents Sidebar Context Loss on Sub-routes (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
When navigating from Documents Dashboard to sub-pages (Create/Templates/History/Pending), routing could fall into legacy `/dashboard/...` paths and break workspace context, causing sidebar/menu inconsistency.

**Root Cause:**  
`DocumentsDashboard.tsx` used hardcoded legacy links (`/dashboard/documents/...`) instead of tenant-scoped routes (`/:tenantSlug/app/documents/...`).

**Implemented Fixes:**
- Replaced hardcoded legacy links with tenant-scoped links via `tenantAppPath(tenantSlug, ...)`.
- Updated all affected navigation points in Documents Dashboard:
  - Top "Create Document" CTA
  - Quick Action cards
  - "View All" history link
  - Recent document "E-Sign" action link

**Files Updated:**
- `src/modules/documents/pages/DocumentsDashboard.tsx`

**Validation:**
- `npx tsc --noEmit` â€” clean.
- `npx.cmd eslint src/modules/documents/pages/DocumentsDashboard.tsx` â€” clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Opened `/:tenantSlug/app/documents` and navigated to Create/Templates/History/Pending.
  - Confirmed sidebar context remains intact and navigation stays inside tenant-scoped app routes.

---

## 8. Bug Fix: Documents Legacy Routing Paths Across Sub-pages (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Several Documents sub-pages still used legacy `/dashboard/documents/...` paths, causing route inconsistency and potential workspace-context breaks.

**Root Cause:**  
Hardcoded absolute routes were left in multiple pages instead of tenant-scoped path builders.

**Implemented Fixes:**
- Replaced all remaining `/dashboard/documents/...` navigation targets with tenant-scoped routes via `tenantAppPath(tenantSlug, ...)`.
- Added/used `tenantSlug` from route params where required.
- Updated all affected actions and links:
  - Templates: "Use Template"
  - History: view/e-sign actions
  - Pending Signatures: view action
  - Create: back-to-documents, go-to-templates, post-create navigate
  - E-Sign: back-to-history

**Files Updated:**
- `src/modules/documents/pages/DocumentTemplatesPage.tsx`
- `src/modules/documents/pages/DocumentHistoryPage.tsx`
- `src/modules/documents/pages/PendingSignaturesPage.tsx`
- `src/modules/documents/pages/DocumentCreatePage.tsx`
- `src/modules/documents/pages/DocumentESignPage.tsx`

**Validation:**
- `npx tsc --noEmit` â€” clean.
- `npx.cmd eslint` on updated Documents pages â€” clean.
- Verified no remaining `/dashboard/documents` references in `src/modules/documents/pages`.

**Verification:**
- Manually verified on April 11, 2026:
  - Confirmed all updated actions navigate under `/:tenantSlug/app/documents/...`.
  - Confirmed no fallback to legacy `/dashboard/...` routes.

---

## 9. Bug Fix: Documents Performance Degradation (Skeleton Loop) (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Switching between Documents pages (especially Dashboard and History) showed prolonged skeleton loaders (around 5-10 seconds) even for small datasets.

**Root Cause:**  
Queries in `useDocuments.ts` were allowed to execute before organization context was fully ready, which caused scoped query failures/retries and visible loading loops. In parallel, frequent focus refetching amplified loading churn during navigation.

**Implemented Fixes:**
- Added organization readiness gating (`organizationLoading` + `organization?.id`) to tenant-scoped document queries so they only execute when context is ready.
- Kept role-safe behavior for e-signature queries by allowing platform-role access while still waiting for org loading to settle.
- Added `staleTime: 30000` and disabled `refetchOnWindowFocus` on affected high-traffic document queries to reduce unnecessary skeleton flicker during quick route switches.
- Updated permissions query key to include organization id for cleaner tenant-scoped caching behavior.

**Files Updated:**
- `src/modules/documents/hooks/useDocuments.ts`

**Validation:**
- `npx tsc --noEmit` - clean.
- `npx.cmd eslint src/modules/documents/hooks/useDocuments.ts` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Switched repeatedly between Documents Dashboard and History.
  - Confirmed skeleton loop is resolved and transitions are now stable/fast.

---

## 10. Bug Fix: Documents Pending Signature Realtime Lag (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Documents Dashboard "Pending Signatures" count could lag (sometimes ~10s+) or require manual refresh after signature activity.

**Root Cause:**  
`DocumentsRealtimeProvider` subscribed to document table changes, but document-related tables were not explicitly ensured in the `supabase_realtime` publication, so websocket invalidation could be unreliable by environment.

**Implemented Fixes:**
- Added idempotent migration to ensure key Documents tables are present in `supabase_realtime` publication:
  - `auto_documents`
  - `document_templates`
  - `document_esignatures`
  - `document_versions`
  - `document_permissions`
- This guarantees realtime `postgres_changes` events can propagate to the frontend invalidation handlers.

**Files Updated:**
- `supabase/migrations/070_enable_documents_realtime.sql` [NEW]

**Validation:**
- Migration is idempotent (safe to run repeatedly).

**Verification:**
- Manually verified on April 11, 2026:
  - Ran `supabase db push`.
  - Triggered signature activity and observed Documents Dashboard pending count update without manual refresh.

---

## 11. Bug Fix: Pending Signatures Mobile Alignment Glitch (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
On small screens, action controls in Documents Pending Signatures could feel cramped/misaligned and risk overflow.

**Root Cause:**  
Header and row action button containers were fixed as single-line layouts without responsive wrapping/flex behavior for narrow widths.

**Implemented Fixes:**
- Updated top action container (`Refresh` / `Send Reminders`) to support wrapping and responsive width behavior.
- Updated per-row action container (`Remind` / `View`) to wrap cleanly on small viewports.
- Applied responsive button sizing (`flex-1` on mobile, `flex-none` on larger screens) to stabilize spacing and alignment.

**Files Updated:**
- `src/modules/documents/pages/PendingSignaturesPage.tsx`

**Validation:**
- `npx.cmd eslint src/modules/documents/pages/PendingSignaturesPage.tsx` - clean.
- `npx tsc --noEmit` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Opened Pending Signatures on mobile-width viewport.
  - Confirmed top and row actions align properly with no overflow.

---

## 12. Bug Fix: Pending Signatures UI Flicker During Reminder Updates (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Sending reminders in Documents Pending Signatures could cause visible UI jitter/flicker from forced refreshes and broad pending-state updates.

**Root Cause:**  
Reminder flow depended on immediate manual refetch and global mutation pending checks, causing unnecessary list churn after single-row actions.

**Implemented Fixes:**
- Added optimistic cache update for reminder count/timestamp in `useSendDocumentReminder`.
- Added rollback safety on mutation failure using previous query snapshots.
- Replaced broad active refetch behavior with lightweight inactive invalidation on settle.
- Updated page-level reminder UX to row-scoped loading state (`Sending...`) and removed forced refetch calls after remind actions.

**Files Updated:**
- `src/modules/documents/hooks/useDocuments.ts`
- `src/modules/documents/pages/PendingSignaturesPage.tsx`

**Validation:**
- `npx.cmd eslint src/modules/documents/hooks/useDocuments.ts src/modules/documents/pages/PendingSignaturesPage.tsx` - clean.
- `npx tsc --noEmit` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Sent reminders from Pending Signatures.
  - Confirmed UI updates smoothly without full-list flicker/jump.

---

## 13. Bug Fix: Document E-Signature Delivery & Client Portal Visibility (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
After sending a document for signature, recipients were not receiving actionable email delivery and document signature requests were not consistently visible in Client Portal pending-signature views.

**Root Cause:**  
- `send-email` edge function calls were returning `401 Unauthorized` in deployment because JWT verification remained enabled for that function.
- Portal signature pages were originally contract-centric and document signature matching was sensitive to email casing/field differences.
- Existing data/flows could use either `recipient_email` or `signer_email` fields for document e-sign rows, causing lookup gaps.

**Implemented Fixes:**
- Added Supabase function config for `send-email` with `verify_jwt = false` to align with current invocation model.
- Hardened document signature creation to persist normalized lowercase email and populate both recipient/signer compatibility fields.
- Extended Client Portal pending-signatures and signature detail flows to support document e-signatures alongside contracts.
- Switched portal signature/document lookups to case-insensitive email matching and dual-field matching (`recipient_email` or `signer_email`).
- Normalized portal scope email to lowercase for consistent query behavior.

**Files Updated:**
- `supabase/config.toml`
- `src/modules/documents/hooks/useDocuments.ts`
- `src/workspaces/portal/hooks/usePortalScope.ts`
- `src/workspaces/portal/pages/CustomerPendingSignaturesPage.tsx`
- `src/workspaces/portal/pages/CustomerSignaturePage.tsx`
- `src/workspaces/portal/pages/CustomerDocumentsPage.tsx`

**Validation:**
- `npx.cmd eslint` on updated documents/portal files - clean.
- `npx tsc --noEmit` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Sent document signature requests.
  - Confirmed end-to-end behavior works and issue is resolved.

---

## 14. Bug Fix: Client Portal Document Signature Preview Missing Content (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
In Client Portal signature view for document e-sign requests, users were seeing `No content preview available for this document.` even when a document existed and was sent successfully.

**Root Cause:**  
Portal access policies for `auto_documents` were not aligned with document e-sign recipient/signer visibility rules, so the joined document row could be inaccessible in signature detail queries.

**Implemented Fixes:**
- Added a new helper function `app_user_can_select_auto_document(...)` to grant safe read access for portal users when they are linked through `document_esignatures` recipient/signer fields.
- Updated `auto_documents_select` policy to use the new helper and include this signature-linked access path.
- Extended portal signature detail query to fetch document file metadata (`file_path`, `file_name`) and added signed URL preview fallback.

**Files Updated:**
- `supabase/migrations/072_fix_auto_documents_portal_preview_access.sql` [NEW]
- `src/workspaces/portal/pages/CustomerSignaturePage.tsx`

**Validation:**
- `npx.cmd eslint src/workspaces/portal/pages/CustomerSignaturePage.tsx` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Opened pending document signature from Client Portal.
  - Confirmed document content now appears instead of the missing preview message.

---

## 15. Bug Fix: Client Portal Signature Preview Showing Raw Payload (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Client Portal document signature preview was rendering raw payload-like content instead of a proper document preview experience.

**Root Cause:**  
Preview rendering favored raw `content` text even when uploaded file metadata/preview URL was available.

**Implemented Fixes:**
- Updated portal signature preview priority to:
  - Inline PDF preview first (when document is PDF),
  - Open-document link fallback for non-PDF uploaded files,
  - Structured key/value rendering for JSON payload content,
  - Raw text only as last fallback.

**Files Updated:**
- `src/workspaces/portal/pages/CustomerSignaturePage.tsx`

**Validation:**
- `npx.cmd eslint src/workspaces/portal/pages/CustomerSignaturePage.tsx` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Opened pending document signature in Client Portal.
  - Confirmed proper document preview UI is shown (not raw payload format).

---

## 16. Bug Fix: Reject Signature Failing on Missing `rejection_reason` Column (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Rejecting a sent signature from Documents "Signature Activity" failed with:
`Could not find the 'rejection_reason' column of 'document_esignatures' in the schema cache`.

**Root Cause:**  
Frontend reject flow attempted to update `rejection_reason`, but some database environments did not yet have this column on `document_esignatures`.

**Implemented Fixes:**
- Added backward-compatible retry logic in signature update flow:
  - First attempt updates with provided payload (including `rejection_reason`).
  - If schema error references missing `rejection_reason`, automatically retries without that field so reject still succeeds.
- Added idempotent migration to create missing column:
  - `ALTER TABLE public.document_esignatures ADD COLUMN IF NOT EXISTS rejection_reason text;`

**Files Updated:**
- `src/modules/documents/hooks/useDocuments.ts`
- `supabase/migrations/073_add_document_esignature_rejection_reason.sql` [NEW]

**Validation:**
- `npx.cmd eslint src/modules/documents/hooks/useDocuments.ts` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Rejected signature from Documents "Signature Activity".
  - Confirmed update succeeds without schema-column error.

---

## 17. Bug Fix: Documents Paperclip Opened Public Storage URL Error (Passed)

**Date:** 2026-04-11  
**Status:** PASSED

**Issue:**  
Clicking the paperclip attachment icon in Documents dashboard opened a storage URL that returned:
`{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}`.

**Root Cause:**  
Attachment action used `getPublicUrl` (`/storage/v1/object/public/...`) while the `documents` storage bucket is private.

**Implemented Fixes:**
- Replaced paperclip open behavior to generate a signed URL via `createSignedUrl` before opening.
- Added user-facing error handling toast if signed URL generation fails.

**Files Updated:**
- `src/modules/documents/pages/DocumentsDashboard.tsx`

**Validation:**
- `npx.cmd eslint src/modules/documents/pages/DocumentsDashboard.tsx` - clean.

**Verification:**
- Manually verified on April 11, 2026:
  - Clicked paperclip attachment action from Documents dashboard.
  - Confirmed document now opens via signed URL instead of public-bucket error page.

---

## 18. UI Update: Portal Signature Page Simplified Document View (Passed)

**Date:** 2026-04-12  
**Status:** PASSED

**Issue:**  
Embedded PDF preview inside Client Portal signature page felt cluttered and degraded UX readability.

**Root Cause:**  
Signature page attempted inline document preview rendering directly in-page, creating a heavy/complex visual block.

**Implemented Fixes:**
- Removed embedded PDF viewer from portal signature page.
- Replaced preview area with a cleaner summary card showing:
  - document title
  - `View Document` action button
- `View Document` now opens the document in a new tab for full review.

**Files Updated:**
- `src/workspaces/portal/pages/CustomerSignaturePage.tsx`

**Validation:**
- `npx.cmd eslint src/workspaces/portal/pages/CustomerSignaturePage.tsx` - clean.

**Verification:**
- Manually verified on April 12, 2026:
  - Opened pending signature page in Client Portal.
  - Confirmed embedded PDF is removed and replaced with title + View Document button UX.
