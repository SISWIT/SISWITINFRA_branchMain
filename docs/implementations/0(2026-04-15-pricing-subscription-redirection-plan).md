# 2026-04-15 - Pricing Subscription Redirection Plan

## Scope
- Frontend redirection flow only.
- No backend changes in this phase.
- Keep annual toggle behavior as-is.
- Keep current pricing copy for now.

## Final Flow Decisions
- Marketing pricing page should not open direct checkout.
- Logged-in `owner` and `admin` users should be redirected to subscription management and open the plan-selection window.
- Logged-in non-`owner/admin` users should see a hard block message: contact organization admin.
- Unauthenticated users should go to `/auth/sign-in` first.
- Do not preselect plan from query params for now.

## Implementation Plan
1. Update pricing CTA behavior in `src/workspaces/website/pages/Pricing.tsx`.
2. Add role-aware redirect logic:
   - Unauthenticated: `/auth/sign-in?returnTo=/pricing&intent=subscribe`
   - `owner`: `/organization/subscription?openPlans=1`
   - `admin`: `/:tenantSlug/app/subscription?openPlans=1`
   - Other roles: block with message and no payment attempt.
3. Update post-login continuation in `src/workspaces/auth/pages/Auth.tsx`:
   - Read `returnTo` + `intent`.
   - If `returnTo=/pricing` and `intent=subscribe`, redirect by role to subscription page with `openPlans=1`.
4. Update `src/workspaces/organization/pages/OrganizationSubscriptionPage.tsx`:
   - If `openPlans=1` exists, open `PlanSelectionModal`.
   - Do not preselect any plan.
5. Keep `ProtectedRoute` authorization unchanged (already allows `owner`/`admin` for subscription access paths).

## Acceptance Criteria
- Unauthenticated pricing CTA -> sign-in -> subscription page opens plan modal.
- Logged-in `owner` pricing CTA -> `/organization/subscription` with modal open.
- Logged-in `admin` pricing CTA -> `/:tenantSlug/app/subscription` with modal open.
- Logged-in non-`owner/admin` pricing CTA -> hard-block message, no checkout attempt.
- Existing subscription and billing behavior remains unchanged.
