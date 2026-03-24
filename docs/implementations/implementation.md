# SISWIT — Implementation Status Report

```
Author: Solanki Date: 2026-03-24 Based On: PRICING_IMPLEMENTATION_GUIDE.md + actual code audit
```
## 1. Executive Summary — Solanki

All 8 tasks from PRICING_IMPLEMENTATION_GUIDE.md have been implemented as code files. The TypeScript build compiles with zero errors (npx tsc --noEmit → exit code
0). However, **the database migration (033) has NOT been applied yet** , meaning all RPC calls will fail at runtime. Additionally, **the CRM module (useCRM.ts) and ERP module
(useERP.ts) have NO limit checks** — contacts, accounts, leads, opportunities, suppliers, and purchase orders can be created without any enforcement. The PlanLimitBanner
component exists but is **not placed on any page**. Monthly/daily usage reset logic is **not implemented** — quotes (monthly) and API calls (daily) will accumulate forever without a cron
job to reset them.

## 2. Task-by-Task Status — Solanki

## Task 1 — Migration 033: plan_limits + usage_tracking — Solanki

```
Status:  Complete (code) / ⚠ Not Deployed
```
```
What Was Implemented: File: supabase/migrations/033_plan_limits_and_usage_tracking.sql (434 lines)
```
```
plan_limits table (L221–L230): columns id, organization_id, resource_type, max_allowed, period, created_at, updated_at with UNIQUE constraint on
(organization_id, resource_type)
usage_tracking table (L240–L251): columns id, organization_id, resource_type, current_count, period_start, period_end, last_incremented_at,
created_at, updated_at
RLS enabled on both tables (L259–L260)
4 RLS policies on plan_limits: plan_limits_select, plan_limits_insert, plan_limits_update, plan_limits_delete (L267–L303)
4 RLS policies on usage_tracking: usage_tracking_select, usage_tracking_insert, usage_tracking_update, usage_tracking_delete (L309–L333)
RPC check_plan_limit(uuid, text) → returns JSON (L339–L386)
RPC increment_usage(uuid, text, bigint) → returns JSON (L392–L451)
RPC decrement_usage(uuid, text, bigint) → returns void (L457–L473)
RPC get_organization_usage(uuid) → returns JSON (L479–L510)
RPC seed_plan_limits_for_organization(uuid, text) → returns void (L516–L621)
GRANT statements for all RPCs and tables (L627–L635)
```
```
What Is Missing or Incomplete:
```
```
Migration has NOT been applied to the database. All RPC calls from the frontend will fail until supabase db push is run.
```
```
Code Differences From Guide: None — the migration file matches the guide specification exactly.
```
```
Verification Steps:
```
```
1. Run supabase db push or paste SQL into Supabase SQL Editor
2. Verify tables: SELECT table_name FROM information_schema.tables WHERE table_name IN ('plan_limits', 'usage_tracking'); → 2 rows
3. Verify RPCs: SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('check_plan_limit', 'increment_usage',
'decrement_usage', 'get_organization_usage', 'seed_plan_limits_for_organization'); → 5 rows
```
## Task 2 — plan-limits.ts (Types, Constants, Helpers) — Solanki

```
Status:  Complete
```
```
What Was Implemented: File: src/core/utils/plan-limits.ts (215 lines)
```
```
Types exported: PlanType (L5), ResourceType (L7–L22), LimitPeriod (L24), PlanLimitEntry (L26–L29), UsageEntry (L31–L36), PlanLimitCheckResult (L38–
L43), UsageIncrementResult (L45–L50), AddOnKey (L214)
Constants: UNLIMITED = 999999999 (L52), PLAN_PRICES (L54–L59), PLAN_LIMITS for all 4 plans (L61–L124), ADD_ONS with 3 items (L190–L212)
Helper functions: getLimit() (L126), isUnlimited() (L130), getUsagePercent() (L134), isNearLimit() (L140), isAtLimit() (L145), getUpgradePlanFor()
(L150), formatLimit() (L163), getResourceLabel() (L169)
```
```
What Is Missing or Incomplete: Nothing — all types, constants, and functions from the guide are implemented.
```
```
Code Differences From Guide: None — matches exactly.
```

```
Verification Steps:
```
```
1. getLimit('foundation', 'contacts') → { max: 500, period: 'total' }
2. isUnlimited(999999999) → true
3. formatLimit(5000) → "5K"
4. isNearLimit(400, 500) → true
```
### Task 3 — usePlanLimits.ts (React Hook) — Solanki

```
Status:  Complete (with temporary type workaround)
```
```
What Was Implemented: File: src/core/hooks/usePlanLimits.ts (202 lines)
```
```
Interface UsePlanLimitsReturn (L22–L43) with all 10 members
usePlanLimits() hook (L45–L201):
Reads organization and subscription from useOrganization() (L46)
Derives planType from subscription?.plan_type or organization?.plan_type (L50)
React Query fetch with key ["organization_usage", organizationId], 30s stale time (L53–L72)
checkLimit(resource) → calls check_plan_limit RPC, fails open on error (L76–L97)
incrementUsage(resource, amount) → calls increment_usage RPC, invalidates cache (L99–L123)
decrementUsage(resource, amount) → calls decrement_usage RPC, invalidates cache (L125–L144)
getUsageForResource(resource) → falls back to PLAN_LIMITS defaults when no DB entry (L146–L165)
isResourceNearLimit(resource) → delegates to isNearLimit() (L167–L174)
isResourceAtLimit(resource) → delegates to isAtLimit() (L176–L183)
refreshUsage() → invalidates React Query cache (L185–L187)
```
```
What Is Missing or Incomplete:
```
```
4 RPC calls use (supabase.rpc as any)(...) casts (L61, L83, L106, L130) because Supabase types haven't been regenerated yet. This is expected — npm run
db:types after migration will fix it.
```
```
Code Differences From Guide: The guide shows supabase.rpc("check_plan_limit", ...) directly. The actual code uses (supabase.rpc as any)
("check_plan_limit", ...) with // eslint-disable-next-line comments. This is a necessary workaround until types are regenerated.
```
Additionally, the guide imports isUnlimited, getUsagePercent, getResourceLabel, formatLimit, getUpgradePlanFor from plan-limits.ts, but the actual code only
imports isNearLimit, isAtLimit, and PLAN_LIMITS. This is correct because the hook doesn't use the extra imports directly.

```
Verification Steps:
```
```
1. After migration is deployed: render a component using usePlanLimits() → should fetch usage
2. checkLimit('contacts') for foundation org → { allowed: true, remaining: 500 }
3. After npm run db:types: remove all as any casts and verify TS compiles
```
### Task 4 — Limit Checks in useCPQ, useCLM, useDocuments — Solanki

```
Status:  Complete
```
```
What Was Implemented:
```
#### src/modules/cpq/hooks/useCPQ.ts (832 lines)

```
Import: usePlanLimits at L
useCreateProduct() (L104–L163): checkLimit("products") at L112, incrementUsage("products") at L
useDeleteProduct() (L216–L260): decrementUsage("products") at L
useCreateQuote() (L318–L416): checkLimit("quotes") at L326, incrementUsage("quotes") at L
useDeleteQuote() (L458–L508): decrementUsage("quotes") at L
```
#### src/modules/clm/hooks/useCLM.ts (785 lines)

```
Import: usePlanLimits at L
useCreateContractTemplate() (L88–L142): checkLimit("contract_templates") at L96, incrementUsage("contract_templates") at L
useDeleteContractTemplate() (L183–L229): decrementUsage("contract_templates") at L21 1
useCreateContract() (L273–L348): checkLimit("contracts") at L281, incrementUsage("contracts") at L
useDeleteContract() (L370–L413): decrementUsage("contracts") at L
```
#### src/modules/documents/hooks/useDocuments.ts (1045 lines)

```
Import: usePlanLimits at L
```

```
useCreateDocumentTemplate() (L146–L215): checkLimit("document_templates") at L160, incrementUsage("document_templates") at L
useDeleteDocumentTemplate() (L257–L299): decrementUsage("document_templates") at L
useCreateAutoDocument() (L371–L456): checkLimit("documents") at L389, incrementUsage("documents") at L
useDeleteAutoDocument() (L504–L542): decrementUsage("documents") at L
```
```
What Is Missing or Incomplete: All mutations specified in the guide for these 3 files are covered. E-signature creation (useCreateESignature in CLM L480) does NOT have a
limit check for esignatures — this should be added for completeness.
```
```
Code Differences From Guide: None — all changes match the guide specification for the 3 covered files.
```
```
Verification Steps:
```
```
1. Set a Foundation org's product limit to 2
2. Create 2 products → both succeed
3. Create a 3rd → toast error "Product limit reached (2/2)"
4. Delete one → usage at 1
5. Repeat for quotes, contracts, contract_templates, documents, document_templates
```
### Task 5 — plan-limit-banner.tsx — Solanki

```
Status:  Complete (component not placed anywhere)
```
```
What Was Implemented: File: src/ui/plan-limit-banner.tsx (105 lines)
```
```
Props: resource: ResourceType, className?: string (L18–L21)
Uses usePlanLimits() for getUsageForResource, isResourceNearLimit, isResourceAtLimit (L26)
Returns null for unlimited or below-threshold resources (L30–L39)
Blocked state (L51–L76): red border, Ban icon, "limit reached" message, "Upgrade Plan" button
Warning state (L79–L103): amber border, AlertTriangle icon, "approaching limit" message, "View Plans" button
Upgrade navigates to /organization/plans (L45–L48)
```
**What Is Missing or Incomplete:** The component is **not placed on any page**. It exists as a standalone component but no module page renders it. See Section 3C for the full list of
pages where it should be added.

```
Code Differences From Guide: None — matches exactly.
```
```
Verification Steps: After placing on a page:
```
```
1. Set resource to 80%+ → amber warning banner visible
2. Set resource to 100% → red blocked banner visible
3. Enterprise plan → no banner
4. Click "Upgrade Plan" → navigates to plans page
```
### Task 6 — upgrade-prompt.tsx — Solanki

```
Status:  Complete
```
```
What Was Implemented: File: src/ui/upgrade-prompt.tsx (272 lines)
```
```
Props: open, onOpenChange, currentPlan, triggeredByResource? (L25–L30)
4 plan cards in a grid with "Recommended" badge on suggested upgrade (L88–L144)
Full comparison table with all 15 resource types + modules/users/audit rows (L146–L240)
Highlighted "Limit hit" badge on triggered resource row (L183–L187)
Add-ons section with 3 cards (L243–L266)
Uses Dialog from shadcn (L75, L268)
Plan pricing shows ₹ symbol (L120)
```
```
What Is Missing or Incomplete:
```
```
Upgrade/Contact Sales buttons just close the dialog (onOpenChange(false)) — no actual upgrade flow implemented
Add-on prices show $ instead of ₹ (L259) — inconsistency with plan prices which use ₹
```
```
Code Differences From Guide: The guide doesn't provide a complete code listing for upgrade-prompt.tsx (it was cut off at line 1599 in the guide). The implementation follows the
spec description closely.
```
```
Minor difference: add-on price uses $ symbol (L259: ${addon.price}) instead of ₹. This is a bug — should be ₹{addon.price}.
```
```
Verification Steps:
```
```
1. Open modal from Plans page → 4 plan cards visible
```

2. Recommended plan is highlighted
3. Current plan button is disabled
4. Comparison table shows all resources
5. Add-ons section shows 3 cards

### Task 7 — OrganizationPlansPage.tsx Rewrite — Solanki

```
Status:  Complete
```
```
What Was Implemented: File: src/workspaces/organization/pages/OrganizationPlansPage.tsx (243 lines)
```
```
Imports: usePlanLimits, UpgradePrompt, ADD_ONS, formatLimit, isUnlimited, getResourceLabel (L10–L17)
Plan display names mapped via PLAN_NAMES record (L19–L24)
UsageMeterRow component (L216–L243): handles unlimited resources, color-coded bars (green/amber/red)
Plan info card with status badge, user/storage meters (L104–L140)
"Change Plan" button wired to UpgradePrompt modal (L133, L237)
Enabled modules grid matching original layout (L142–L160)
Resource Usage section (L163–L196): iterates TRACKED_RESOURCES (15 resources), renders meters from usePlanLimits().usage
Add-Ons section (L198–L228): 3 cards from ADD_ONS constant, "Coming Soon" buttons
Progress bar color: bg-destructive at 90%+, bg-warning at 75%+, bg-primary otherwise (L48–L52)
```
```
What Is Missing or Incomplete:
```
```
Guide specifies usage bars should be green (<60%), amber (60–80%), red (>80%). Actual thresholds are: primary (<75%), warning (75–89%), destructive (90%+). This is a
minor difference in threshold values.
"Manage Billing" button is disabled with "(Soon)" label
```
```
Code Differences From Guide:
```
```
Bar color thresholds differ: guide says green/amber/red at 60/80/100, code uses primary/warning/destructive at 75/90/
Monthly period label shows (/mo) instead of (per month) as the guide spec notes
```
```
Verification Steps:
```
1. Visit /organization/plans → page loads with current plan info
2. Usage meters visible for all resources with data
3. Click "Change Plan" → UpgradePrompt modal opens
4. Add-ons section shows 3 cards

### Task 8 — ProductsPage.tsx Fix Verification — Solanki

```
Status:  Complete
```
```
What Was Implemented: File: src/modules/cpq/pages/ProductsPage.tsx (434 lines) — verified, not modified
```
```
FIX 9 — Price validation (L104–L108): const parsedPrice = parseFloat(formUnitPrice || "0"); if (isNaN(parsedPrice) || parsedPrice < 0) {
toast.error("Please enter a valid price"); return; }
FIX 10 — AlertDialog (L381–L413): Full AlertDialog component with trigger, title, description, cancel/confirm actions. No confirm() or globalThis.confirm()
usage.
FIX 11 — Inactive toggle (L56): const [showInactive, setShowInactive] = useState(false);, (L57): const { data: products, isLoading } =
useProducts({ includeInactive: showInactive });, (L280–L290): Switch component with label
```
```
What Is Missing or Incomplete: Nothing — all 3 fixes are confirmed present and correct.
```
```
Code Differences From Guide: None — code matches guide specifications.
```
```
Verification Steps:
```
1. Enter "abc" as price → toast: "Please enter a valid price"
2. Enter -5 as price → toast: "Please enter a valid price"
3. Click delete → AlertDialog appears
4. Toggle show inactive → inactive products appear/disappear

## 3. What Is Remaining — Solanki

### 3A. Database (Not Yet Deployed) — Solanki


```
Migration 033 has NOT been applied to the database. This means:
```
```
All supabase.rpc() calls in usePlanLimits.ts will fail
The check_plan_limit RPC will return errors → hook fails open (allows everything)
The increment_usage and decrement_usage RPCs will silently fail
The get_organization_usage RPC will return empty → usage meters show 0/
No plan limits are enforced until migration is deployed and limits are seeded
```
```
How to check if deployed:
```
##### SELECT EXISTS (

```
SELECT 1 FROM information_schema.tables
WHERE table_name = 'plan_limits'
);
```
### 3B. Type Safety Issues — Solanki

```
4 locations in src/core/hooks/usePlanLimits.ts use as any casts:
```
#### Line RPC Call Current Code Fix After npm run db:types

#### L61 get_organization_usage(supabase.rpc as any)("get_organization_usage",...) supabase.rpc("get_organization_usage", ...)

#### L83 check_plan_limit (supabase.rpc as any)("check_plan_limit", ...) supabase.rpc("check_plan_limit", ...)

#### L106increment_usage (supabase.rpc as any)("increment_usage", ...) supabase.rpc("increment_usage", ...)

#### L130decrement_usage (supabase.rpc as any)("decrement_usage", ...) supabase.rpc("decrement_usage", ...)

```
Also remove the corresponding as unknown as casts at L70, L94, L120 and eslint-disable comments at L60, L82, L105, L129.
```
### 3C. Components Not Yet Placed — Solanki

```
PlanLimitBanner exists at src/ui/plan-limit-banner.tsx but is not rendered on any page.
```
```
Pages where it should be added:
```
#### Module Page File Resource Import + JSX

#### CPQ src/modules/cpq/pages/ProductsPage.tsx "products" <PlanLimitBanner resource="products"className="mb-4" />

#### CPQ src/modules/cpq/pages/QuotesListPage.tsx "quotes" <PlanLimitBanner resource="quotes"className="mb-4" />

#### CLM src/modules/clm/pages/ContractTemplatesPage.tsx "contract_templates"

```
<PlanLimitBanner
resource="contract_templates"
className="mb-4" />
```
#### CLM src/modules/clm/pages/ContractsListPage.tsx "contracts" <PlanLimitBanner resource="contracts"className="mb-4" />

#### Documentssrc/modules/documents/pages/DocumentTemplatesPage.tsx"document_templates"

```
<PlanLimitBanner
resource="document_templates"
className="mb-4" />
```
#### Documentssrc/modules/documents/pages/DocumentsPage.tsx "documents" <PlanLimitBanner resource="documents"className="mb-4" />

#### CRM src/modules/crm/pages/ContactsPage.tsx "contacts" <PlanLimitBanner resource="contacts"className="mb-4" />

#### CRM src/modules/crm/pages/AccountsPage.tsx "accounts" <PlanLimitBanner resource="accounts"className="mb-4" />

#### CRM src/modules/crm/pages/LeadsPage.tsx "leads" <PlanLimitBanner resource="leads"className="mb-4" />

#### CRM src/modules/crm/pages/OpportunitiesPage.tsx "opportunities"

```
<PlanLimitBanner
resource="opportunities"
className="mb-4" />
```
#### ERP src/modules/erp/pages/ProcurementPage.tsx "suppliers" <PlanLimitBanner resource="suppliers"className="mb-4" />

#### ERP src/modules/erp/pages/ProcurementPage.tsx "purchase_orders"

```
<PlanLimitBanner
resource="purchase_orders"
className="mb-4" />
```
### 3D. Features Marked "Coming Soon" — Solanki

#### Feature Location What Needs Building

#### Add-on

#### purchasing

#### OrganizationPlansPage.tsx L223 ("Coming

#### Soon" button) Backend: Update plan_limits.max_allowed + payment integration

#### Manage

#### Billing

#### OrganizationPlansPage.tsx L136 (disabled

#### button) Stripe/Razorpay integration for billing management

#### Plan upgrade

#### flow

#### upgrade-prompt.tsx L134 (buttons close

#### modal)

#### Backend: Change organization_subscriptions.plan_type, reseed limits,

#### handle prorated billing

### 3E. Missing Limit Checks — Solanki


```
NOT all create mutations are covered. The following modules have ZERO limit checks:
```
#### CRM Module — src/modules/crm/hooks/useCRM.ts (1590 lines)

#### Hook Line Resource Status

#### useCreateLead() L362 "leads"  No checkLimit / incrementUsage

#### useDeleteLead() L458 "leads"  No decrementUsage

#### useCreateAccount() L521 "accounts"  No checkLimit / incrementUsage

#### useDeleteAccount() L625 "accounts"  No decrementUsage

#### useCreateContact() L692 "contacts"  No checkLimit / incrementUsage

#### useDeleteContact() L796 "contacts"  No decrementUsage

#### useCreateOpportunity()~L850+"opportunities" No checkLimit / incrementUsage

#### useDeleteOpportunity()~L950+"opportunities" No decrementUsage

#### ERP Module — src/modules/erp/hooks/useERP.ts

#### Hook Line Resource Status

#### useCreateSupplier() L221"suppliers"  No checkLimit / incrementUsage

#### useDeleteSupplier() L323"suppliers"  No decrementUsage

#### useCreatePurchaseOrder()L602"purchase_orders" No checkLimit / incrementUsage

#### useDeletePurchaseOrder()L704"purchase_orders" No decrementUsage

#### CLM Module — src/modules/clm/hooks/useCLM.ts

#### Hook Line Resource Status

#### useCreateESignature()L480"esignatures" No checkLimit / incrementUsage

```
Total: 13 hooks missing limit checks across 3 modules.
```
### 3F. Monthly/Daily Reset Logic — Solanki

```
The pricing model defines:
```
```
Quotes : 50/month (Foundation), 500/month (Growth), 5000/month (Commercial)
API Calls : 1000/day (Foundation), 10000/day (Growth), 100000/day (Commercial)
E-Signatures : 10/month (Foundation), 100/month (Growth), 1000/month (Commercial)
```
```
There is NO reset logic implemented anywhere.
```
```
The usage_tracking table has period_start and period_end columns but they are never populated. The check_plan_limit RPC does not check the period — it simply
compares current_count against max_allowed regardless of when the count was accumulated.
```
```
What needs to be built:
```
```
1. A PostgreSQL cron job (using pg_cron extension) OR a Supabase Edge Function that:
Resets current_count to 0 for all monthly resources on the 1st of each month
Resets current_count to 0 for all daily resources at midnight UTC each day
Updates period_start and period_end accordingly
2. Alternatively, modify check_plan_limit RPC to check period_start/period_end and auto-reset if the current period has elapsed
```
### 3G. CRM Module Limit Checks — Solanki

```
useCRM.ts was NOT included in Task 4 of the guide. The guide only specifies modifications to useCPQ.ts, useCLM.ts, and useDocuments.ts. However, the pricing model
defines limits for CRM resources:
```
```
Contacts : 500 (Foundation) / 5,000 (Growth) / 50,000 (Commercial) / Unlimited (Enterprise)
Accounts : 100 / 1,000 / 10,000 / Unlimited
Leads : 200 / 2,000 / 20,000 / Unlimited
Opportunities : 100 / 1,000 / 10,000 / Unlimited
```
```
These are currently unenforced. To add limit checks, follow the exact same pattern as Task 4:
```

// At top of useCRM.ts (after line 31):
import { usePlanLimits } from "@/core/hooks/usePlanLimits";

// In useCreateLead() (line 362):
export function useCreateLead() {
const queryClient = useQueryClient();
const { scope, tenantId, userId } = useModuleScope();
const { checkLimit, incrementUsage } = usePlanLimits();

return useMutation({
mutationFn: async (lead: ...) => {
// --- PLAN LIMIT CHECK ---
const limitCheck = await checkLimit("leads");
if (!limitCheck.allowed) {
throw new Error(
`Lead limit reached (${limitCheck.current_count}/${limitCheck.max_allowed}). Please upgrade your plan.`
);
}
// --- END PLAN LIMIT CHECK ---

// ... existing insert logic ...

// --- INCREMENT USAGE ---
void incrementUsage("leads");
// --- END INCREMENT USAGE ---

// ... rest of function
},
});
}

// In useDeleteLead() (line 458):
export function useDeleteLead() {
const queryClient = useQueryClient();
const { scope, tenantId, userId } = useModuleScope();
const { decrementUsage } = usePlanLimits();

return useMutation({
mutationFn: async (id: string) => {
// ... existing delete logic ...

// --- DECREMENT USAGE ---
void decrementUsage("leads");
// --- END DECREMENT USAGE ---
},
});
}

```
Apply the same pattern to:
```
```
useCreateAccount() / useDeleteAccount() with "accounts"
useCreateContact() / useDeleteContact() with "contacts"
useCreateOpportunity() / useDeleteOpportunity() with "opportunities"
```
```
For the ERP module (useERP.ts), apply to:
```
```
useCreateSupplier() / useDeleteSupplier() with "suppliers"
useCreatePurchaseOrder() / useDeletePurchaseOrder() with "purchase_orders"
```
```
For the CLM module (useCLM.ts), apply to:
```
```
useCreateESignature() with "esignatures"
```
## 4. Build Steps — Solanki


### Step 1 — Apply Database Migration — Solanki

```
Status: ⚠ PENDING — must be done before anything works
```
# Option A: Local Supabase
supabase db push

# Option B: Remote database
supabase db push --db-url postgresql://[your-connection-string]

# Option C: Manual (paste in Supabase SQL Editor)
# Open: https://app.supabase.com → your project → SQL Editor
# Paste: contents of supabase/migrations/033_plan_limits_and_usage_tracking.sql
# Click Run

```
Verify it worked:
```
-- Run in SQL Editor after migration
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('plan_limits', 'usage_tracking');
-- Expected: 2 rows

SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('check_plan_limit', 'increment_usage', 'decrement_usage', 'get_organization_usage', 'seed_plan_limits_for_organi
-- Expected: 5 rows

### Step 2 — Seed Limits for All Existing Organizations — Solanki

```
Status: ⚠ PENDING — do this immediately after Step 1
```
-- Run in Supabase SQL Editor
SELECT seed_plan_limits_for_organization(
id,
COALESCE(plan_type, 'foundation')
)
FROM organizations;

-- Verify:
SELECT organization_id, COUNT(*) as limit_rows
FROM plan_limits
GROUP BY organization_id;
-- Expected: each org has 11-15 rows (depends on plan type)

### Step 3 — Regenerate TypeScript Types — Solanki

```
Status: ⚠ PENDING — fixes all as any casts in usePlanLimits.ts
```
npm run db:types
# OR if that script doesn't exist:
npx supabase gen types typescript --project-id [your-project-id] > src/types/supabase.ts

```
After running, fix src/core/hooks/usePlanLimits.ts:
```
- // eslint-disable-next-line @typescript-eslint/no-explicit-any
- const { data, error } = await (supabase.rpc as any)("get_organization_usage", {
+ const { data, error } = await supabase.rpc("get_organization_usage", {
p_organization_id: organizationId,
});
// ... (repeat for all 4 RPC calls at lines 61, 83, 106, 130)
// Also remove `as unknown as` casts at lines 70, 94, 120


### Step 4 — Add PlanLimitBanner to Module Pages — Solanki

```
Status:  NOT DONE — banner component exists but is placed nowhere
```
```
For each module page, add at the top of the page content (above the main table/list):
```
import { PlanLimitBanner } from "@/ui/plan-limit-banner";

#### CPQ — ProductsPage.tsx

<PlanLimitBanner resource="products" className="mb-4" />

#### CPQ — QuotesListPage.tsx

<PlanLimitBanner resource="quotes" className="mb-4" />

#### CLM — ContractTemplatesPage.tsx

<PlanLimitBanner resource="contract_templates" className="mb-4" />

#### CLM — ContractsListPage.tsx

<PlanLimitBanner resource="contracts" className="mb-4" />

#### Documents — DocumentTemplatesPage.tsx

<PlanLimitBanner resource="document_templates" className="mb-4" />

#### Documents — DocumentsPage.tsx

<PlanLimitBanner resource="documents" className="mb-4" />

#### CRM — ContactsPage.tsx

<PlanLimitBanner resource="contacts" className="mb-4" />

#### CRM — AccountsPage.tsx

<PlanLimitBanner resource="accounts" className="mb-4" />

#### CRM — LeadsPage.tsx

<PlanLimitBanner resource="leads" className="mb-4" />

#### CRM — OpportunitiesPage.tsx

<PlanLimitBanner resource="opportunities" className="mb-4" />

### Step 5 — Add Limit Checks to useCRM.ts — Solanki

```
Status:  NOT DONE — CRM module has no limit checks
```
```
See Section 3G for the exact code pattern. Apply limit checks to all 8 hooks:
```
```
useCreateLead() / useDeleteLead() → "leads"
useCreateAccount() / useDeleteAccount() → "accounts"
useCreateContact() / useDeleteContact() → "contacts"
useCreateOpportunity() / useDeleteOpportunity() → "opportunities"
```
### Step 6 — Add Limit Checks to useERP.ts — Solanki


```
Status:  NOT DONE — ERP module has no limit checks
```
```
Apply limit checks to:
```
```
useCreateSupplier() / useDeleteSupplier() → "suppliers"
useCreatePurchaseOrder() / useDeletePurchaseOrder() → "purchase_orders"
```
### Step 7 — Build and Verify — Solanki

```
npm run build
# Expected: 0 TypeScript errors
```
```
npm run dev
# Test checklist from Section 9 of PRICING_IMPLEMENTATION_GUIDE.md
```
### Step 8 — Production Deploy — Solanki

```
npm run build && [your deploy command]
# OR Vercel: git push → auto deploys
```
## 5. Full Testing Checklist — Solanki

#### # Test Case Role Expected Result Status

#### 1 Create product on Foundation plan (underlimit) admin Product created successfully ⚠deployed^ Needs migration

#### 2 Create product when at limit (50/50) admin Toast error: "Product limit reached" ⚠deployed^ Needs migration

#### 3 Delete a product when at limit admin Product deleted, usage decrementsto 49 ⚠deployed^ Needs migration

#### 4 Create product after deletion (49/50) admin Product created successfully ⚠deployed^ Needs migration

#### 5 Create quote on Foundation plan (undermonthly limit) manager Quote created successfully ⚠deployed^ Needs migration

#### 6 Create quote when at monthly limit (50/50) manager Toast error: "Quote limit reached" ⚠deployed^ Needs migration

#### 7 Create contract on Foundation plan admin Toast error (CLM not in Foundationplan) ⚠deployed^ Needs migration

#### 8 Create contract on Growth plan (under limit) admin Contract created successfully ⚠deployed^ Needs migration

#### 9 Create document on Foundation plan (underlimit) employee Document created successfully ⚠deployed^ Needs migration

#### 10 Create document template at limit (10/10) admin Toast error: "Document template limitreached" ⚠deployed^ Needs migration

#### 11 View Plans page as owner owner Usage meters visible for all resources⚠deployed^ Needs migration

#### 12 View Plans page — usage at 85% owner Progress bar is amber ⚠deployed^ Needs migration

#### 13 View Plans page — usage at 100% owner Progress bar is red ⚠deployed^ Needs migration

#### 14 Click "Change Plan" owner UpgradePrompt modal opens  Can test now

#### 15 View plan-limit-banner on Products page at80% admin Amber warning banner visible  Banner not placed

#### 16 View plan-limit-banner on Products page at100% admin Red blocked banner visible  Banner not placed

#### 17 View plan-limit-banner on Products page at50% admin No banner shown  Banner not placed

#### 18 Enterprise plan — create unlimited resources admin No limit errors, no banners ⚠deployed^ Needs migration

#### 19 Platform super admin — view any org's plans platform_super_adminCan see all usage data ⚠deployed^ Needs migration

#### 20 Employee tries to modify plan_limits employee RLS blocksINSERT/UPDATE/DELETE ⚠deployed^ Needs migration

#### 21 Run check_plan_limit RPC directly authenticated Returns correct JSON ⚠deployed^ Needs migration

#### 22 Run increment_usage RPC past limit authenticated Returns success: false ⚠deployed^ Needs migration


#### # Test Case Role Expected Result Status

#### 23 Run decrement_usage below 0 authenticated Usage stays at 0 ⚠deployed^ Needs migration

#### 24 Verify FIX 9: Enter "abc" price any Toast: "Please enter a valid price"  Can test now

#### 25 Verify FIX 10: Delete product admin AlertDialog appears  Can test now

#### 26 Verify FIX 11: Toggle inactive products admin Inactive products appear/disappear  Can test now

## 6. Known Issues and Risks — Solanki

#### # Issue Severity Impact Fix

#### 1 Migration not deployed Critical All limit checks fail open (allow everything) Run supabase db push

#### 2 CRM module has no limitchecks Critical Contacts, accounts, leads, opportunities can becreated without limits Add usePlanLimits to useCRM.ts

#### 3 ERP module has no limitchecks  High Suppliers, purchase orders can be createdwithout limits Add usePlanLimits to useERP.ts

#### 4 E-signature has no limitcheck  High useCreateESignature()checking esignatures limit in useCLM.ts not Add checkLimit("esignatures")

#### 5 No monthly/daily reset logic  High Quotes and API call limits accumulate forevereventually blocking all users , Build pg_cron job or Edge Function

#### 6 PlanLimitBanner not placed MediumUsers don't see warnings until they hit the hardlimit error toast Place on 10+ module pages

(^74) usePlanLimits.tsas any casts in MediumNo type safety on RPC parameters/returns Run npm run db:types

#### 8 Add-on price shows instead of ₹ $  Low Inconsistent currency display in upgrade modalChange upgrade-prompt.tsx L259${addon.price} to ₹{addon.price} in

#### 9 Upgrade buttons don't doanything MediumClicking "Upgrade" just closes the modal Implement plan change flow with backend

#### 10 Usage bar color thresholdsdiffer from guide  Low Guide: 60/80 thresholds. Code: 75/90thresholds Adjust OrganizationPlansPage.tsxgetBarColor() in

#### 11 check_plan_limitperiod ignores  High Monthly/daily limits never reset, so theyeffectively become lifetime limits Update RPC to check period or implementexternal reset

## 7. What Is NOT Yet Built — Solanki

### Large Features Still Pending

### CRM Limit Enforcement — Solanki

```
Why It Matters: CRM is the most-used module. Without limit enforcement, Foundation plan users can create unlimited contacts (limit should be 500), accounts (100), leads (200),
and opportunities (100). This completely undermines the pricing model for the largest resource category. Estimated Effort: 2-3 hours Files To Modify:
src/modules/crm/hooks/useCRM.ts Implementation Notes: Add import { usePlanLimits } from "@/core/hooks/usePlanLimits" and apply the exact same
checkLimit() / incrementUsage() / decrementUsage() pattern as used in useCPQ.ts. 8 hooks need changes (4 create + 4 delete).
```
### ERP Limit Enforcement — Solanki

```
Why It Matters: Commercial Control plan limits suppliers to 500 and purchase orders to 1,000. Without enforcement, any Commercial plan user gets unlimited ERP resources.
Estimated Effort: 1-2 hours Files To Modify: src/modules/erp/hooks/useERP.ts Implementation Notes: Same pattern as CRM. 4 hooks need changes (2 create + 2
delete).
```
### Monthly/Daily Usage Reset — Solanki

```
Why It Matters: Quotes (50/month), API calls (1000/day), and e-signatures (10/month) have periodic limits. Without reset logic, these counters accumulate forever. A Foundation
user who creates 50 quotes in January can never create another quote for the rest of their subscription. Estimated Effort: 4-6 hours Files To Create:
supabase/functions/reset-usage/index.ts (Edge Function) OR SQL cron job Implementation Notes:
```
```
1. Enable pg_cron extension in Supabase
2. Create daily cron: SELECT cron.schedule('reset-daily-usage', '0 0 * * *', $$ UPDATE usage_tracking SET current_count = 0, period_start
= now() WHERE resource_type IN (SELECT resource_type FROM plan_limits WHERE period = 'daily') $$);
3. Create monthly cron: SELECT cron.schedule('reset-monthly-usage', '0 0 1 * *', $$ UPDATE usage_tracking SET current_count = 0,
period_start = now() WHERE resource_type IN (SELECT resource_type FROM plan_limits WHERE period = 'monthly') $$);
```
### Plan Upgrade/Downgrade Flow — Solanki


```
Why It Matters: Users who hit limits see the upgrade modal but clicking "Upgrade" does nothing. This is the highest-impact conversion point — a blocked user wants to upgrade, and
the system can't process it. Estimated Effort: 8-16 hours (includes payment integration) Files To Create: Backend payment handler, plan change RPC Files To Modify:
src/ui/upgrade-prompt.tsx, src/workspaces/organization/pages/OrganizationPlansPage.tsx Implementation Notes: Integrate Razorpay/Stripe, create RPC
to update organization_subscriptions.plan_type, reseed plan_limits for new plan, handle prorated billing
```
### Add-On Purchase Flow — Solanki

**Why It Matters:** Add-ons allow upselling without forcing a full plan upgrade. Currently shows "Coming Soon" on all 3 add-on cards. **Estimated Effort:** 6-10 hours **Files To Create:**
Add-on purchase RPC, payment handler **Files To Modify:** OrganizationPlansPage.tsx (wire purchase buttons) **Implementation Notes:** Update plan_limits.max_allowed
for the relevant resource. Track purchased add-ons in organization_subscriptions.features JSON field.

### Manage Billing Page — Solanki

```
Why It Matters: Users need to view invoices, update payment methods, and cancel subscriptions. Estimated Effort: 10-20 hours Files To Create: Billing page, invoice download
endpoint Implementation Notes: Requires payment provider integration (Razorpay/Stripe customer portal)
```
```
End of IMPLEMENTATION_STATUS.md — Solanki
```