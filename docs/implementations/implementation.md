# Remaining Tasks & Implementation Plan

This document outlines the pending tasks identified in the technical audit (V2) as of March 25, 2026.

## Critical Priority (Immediate Action Required)

- [ ] **Deploy Migrations (047-050)**:
    - Run scripts `047_addon_purchasing.sql` through `050_notifications.sql` in the Supabase SQL Editor.
    - *Purpose*: Enables the notifications system, storage bucket configurations, and add-on purchasing logic.
- [ ] **Regenerate TypeScript Types**:
    - Run: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/core/api/types.ts`
    - *Purpose*: Syncs frontend types with the current database schema and removes `as any` casts in notification and billing hooks.
- [ ] **Seed Plan Limits**:
    - Execute: `SELECT seed_plan_limits_for_organization(id, 'foundation') FROM organizations;`
    - *Purpose*: Ensures existing organizations have their resource counters and limits initialized.

## High Priority

- [ ] **Configure Supabase Secrets (SMTP)**:
    - Set `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` in the Supabase Edge Function Secrets.
    - *Purpose*: Essential for delivering transactional emails (invites, signatures).
- [ ] **Implement Email Skeletons**:
    - Complete the logic for Edge Functions in `supabase/functions/`:
        - `send-email`
        - `send-employee-invitation`
        - `send-verification-email`
        - `sync-user-verification`
- [ ] **Razorpay Production Integration**:
    - Replace the current mocked checkout sessions with real webhook integration and production flow.

## Medium Priority

- [ ] **Real AI Backend for Contract Scanning**:
    - Replace the simulation in `pages/ContractScanPage.tsx` with a real LLM processing edge function for data extraction.
- [ ] **Global Search**:
    - Implement a cross-module global search (currently limited to per-module search).
- [ ] **Refactor `as any` Casts**:
    - After type regeneration, remove remaining `as any` casts in `useNotifications.ts`, `useBilling.ts`, and `usePlanLimits.ts`.

---
*Reference: docs/implementations/audit2.md*
