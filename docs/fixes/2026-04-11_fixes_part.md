# 2026-04-11 Fix Log (Part)

## Focus (Paused)
- CLM Contract Scan flow (`/:tenantSlug/app/clm/scan`)
- Open issue: `3 images -> 3 scans -> 3 results` behavior needs a proper pass later.

## What Was Changed
- `src/modules/clm/pages/ContractScanPage.tsx`
  - Added live scan mode toggle (`VITE_ENABLE_LIVE_CONTRACT_SCAN`).
  - Added cache read/write by upload fingerprint (`fileHash` or `name+size`).
  - Added live call path to edge function `contract-scan-ai`.
  - Kept mock fallback when live mode is off or unavailable.
  - Saves scan rows with OCR payload from live/mock/cache result.
- `src/modules/clm/hooks/useCLM.ts`
  - `useContractScans("global")` now queries scans with `contract_id IS NULL`.
  - `useCreateContractScan` now persists `file_url` correctly.
- `src/ui/file-upload.tsx`
  - Added SHA-256 file hashing during upload.
  - `onUploadComplete` now receives `fileHash`.
- `src/core/utils/upload.ts`
  - Extended `UploadResult` with optional `fileHash`.
- `supabase/functions/contract-scan-ai/index.ts`
  - Added/expanded live AI extraction pipeline with fallback + normalization.
- `supabase/config.toml`
  - Added function config for `contract-scan-ai` with `verify_jwt = false`.
- `.env`
  - Added `VITE_ENABLE_LIVE_CONTRACT_SCAN=true`.

## Where To Restart Later
- Start at `handleUploadComplete` in `src/modules/clm/pages/ContractScanPage.tsx`.
- Verify mapping: one uploaded file should map to one scan row and one visible result card/state.
- Check for duplicate triggers from `src/ui/file-upload.tsx` (`multiple=true` + per-file callback behavior).
- Confirm whether scan history list and active result state are sharing/overwriting data unexpectedly.
- Validate with exactly 3 uploads in one batch and log per-file ids (`fileHash`, `scan.id`, `file_name`).

## Quick Goal For Next Pass
- Enforce deterministic `1 file -> 1 scan record -> 1 corresponding result render`, no cross-file bleed.
