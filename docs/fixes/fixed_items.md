# SISWIT — Fixed Items

```
Author: Sunny
Date: 2026-03-24
Based On: docs/implementations/implementation.md
```

This document lists all items that have been fixed as of 2026-03-24, with detailed information about what was changed and where.

---

## Fixed Issues

### 1. Database Migration Applied ✅

**Status:** FIXED on 2026-03-24

**What Was Done:**
- Migration file renamed from `033_plan_limits_and_usage_tracking.sql` to `044_plan_limits_and_usage_tracking.sql` (to avoid version conflict)
- Ran `supabase migration repair` to sync local/remote migration history
- Applied migration successfully

**What Was Implemented (from implementation.md):**
- File: `supabase/migrations/044_plan_limits_and_usage_tracking.sql` (434 lines)
- `plan_limits` table: columns id, organization_id, resource_type, max_allowed, period, created_at, updated_at with UNIQUE constraint on (organization_id, resource_type)
- `usage_tracking` table: columns id, organization_id, resource_type, current_count, period_start, period_end, last_incremented_at, created_at, updated_at
- RLS enabled on both tables
- 4 RLS policies on plan_limits: plan_limits_select, plan_limits_insert, plan_limits_update, plan_limits_delete
- 4 RLS policies on usage_tracking: usage_tracking_select, usage_tracking_insert, usage_tracking_update, usage_tracking_delete
- RPC `check_plan_limit(uuid, text)` → returns JSON
- RPC `increment_usage(uuid, text, bigint)` → returns JSON
- RPC `decrement_usage(uuid, text, bigint)` → returns void
- RPC `get_organization_usage(uuid)` → returns JSON
- RPC `seed_plan_limits_for_organization(uuid, text)` → returns void
- GRANT statements for all RPCs and tables

**Also Applied:**
- Migration `042_usage_tracking_cron_jobs.sql` - Daily/monthly reset cron jobs
- Migration `043_upgrade_plan_rpc.sql` - Plan upgrade RPC

---

### 2. TypeScript Types Generated ✅

**Status:** FIXED on 2026-03-24

**What Was Done:**
- Set `SUPABASE_PROJECT_ID=swzepbbpbeoqbiavidfh`
- Ran `npm run db:types`
- Types generated in `src/core/api/types.ts`
- TypeScript compiles with zero errors (`npx tsc --noEmit` → exit code 0)

---

### 3. PlanLimitBanner Component Placement ✅

**Status:** FIXED (was already implemented before 2026-03-24)

**What Was Implemented (from implementation.md):**
- File: `src/ui/plan-limit-banner.tsx` (105 lines)
- Props: resource: ResourceType, className?: string
- Uses usePlanLimits() for getUsageForResource, isResourceNearLimit, isResourceAtLimit
- Returns null for unlimited or below-threshold resources
- Blocked state: red border, Ban icon, "limit reached" message, "Upgrade Plan" button
- Warning state: amber border, AlertTriangle icon, "approaching limit" message, "View Plans" button
- Upgrade navigates to /organization/plans

**Placed on Pages:**
| Module | Page File | Resource |
|--------|-----------|----------|
| CPQ | src/modules/cpq/pages/ProductsPage.tsx (L145) | products |
| CPQ | src/modules/cpq/pages/QuotesListPage.tsx (L70) | quotes |
| CLM | src/modules/clm/pages/TemplatesPage.tsx (L159) | contract_templates |
| CLM | src/modules/clm/pages/ContractsListPage.tsx (L54) | contracts |
| Documents | src/modules/documents/pages/DocumentTemplatesPage.tsx (L195) | document_templates |
| Documents | src/modules/documents/pages/DocumentsDashboard.tsx (L64) | documents |
| CRM | src/modules/crm/pages/ContactsPage.tsx (L191) | contacts |
| CRM | src/modules/crm/pages/AccountsPage.tsx (L264) | accounts |
| CRM | src/modules/crm/pages/LeadsPage.tsx (L59) | leads |
| CRM | src/modules/crm/pages/OpportunitiesPage.tsx (L230) | opportunities |
| ERP | src/modules/erp/pages/ProcurementPage.tsx (L206-207) | suppliers, purchase_orders |

---

### 4. CRM Module Limit Checks ✅

**Status:** FIXED (was already implemented before 2026-03-24)

**What Was Implemented (from implementation.md):**
- File: `src/modules/crm/hooks/useCRM.ts` (1590 lines)

**Hooks with Limit Checks:**

| Hook | Line | Resource | Check | Increment | Decrement |
|------|------|----------|-------|-----------|-----------|
| useCreateLead() | L363 | leads | ✅ L370 | ✅ L395 | - |
| useDeleteLead() | L458 | leads | - | - | ✅ L493 |
| useCreateAccount() | L521 | accounts | ✅ L528 | ✅ L553 | - |
| useDeleteAccount() | L625 | accounts | - | - | ✅ L673 |
| useCreateContact() | L692 | contacts | ✅ L699 | ✅ L724 | - |
| useDeleteContact() | L796 | contacts | - | - | ✅ L857 |
| useCreateOpportunity() | ~L850+ | opportunities | ✅ | ✅ | - |
| useDeleteOpportunity() | ~L950+ | opportunities | - | - | ✅ L1052 |

**Code Pattern:**
```typescript
const { checkLimit, incrementUsage } = usePlanLimits();

const limitCheck = await checkLimit("leads");
if (!limitCheck.allowed) {
  throw new Error(`Lead limit reached (${limitCheck.current_count}/${limitCheck.max_allowed}). Please upgrade your plan.`);
}
// ... existing logic ...
void incrementUsage("leads");
```

---

### 5. ERP Module Limit Checks ✅

**Status:** FIXED (was already implemented before 2026-03-24)

**What Was Implemented:**
- File: `src/modules/erp/hooks/useERP.ts`

**Hooks with Limit Checks:**

| Hook | Line | Resource | Check | Increment | Decrement |
|------|------|----------|-------|-----------|-----------|
| useCreateSupplier() | L221 | suppliers | ✅ L229 | ✅ L258 | - |
| useDeleteSupplier() | L323 | suppliers | - | - | ✅ L359 |
| useCreatePurchaseOrder() | L602 | purchase_orders | ✅ L623 | ✅ L651 | - |
| useDeletePurchaseOrder() | L704 | purchase_orders | - | - | ✅ L755 |

---

### 6. CLM Module Limit Check (esignatures) ✅

**Status:** FIXED on 2026-03-24 (identified as missing in implementation.md)

**What Was Implemented:**
- File: `src/modules/clm/hooks/useCLM.ts`

**Hook with Limit Check:**

| Hook | Line | Resource | Check | Increment |
|------|------|----------|-------|-----------|
| useCreateESignature() | L480 | esignatures | ✅ L487 | ✅ L511 |

**Note:** This was mentioned as missing in the original implementation.md (line 171-172): "E-signature creation (useCreateESignature in CLM L480) does NOT have a limit check for esignatures — this should be added for completeness." It has now been added.

---

### 7. Plan Limit Constants & Types ✅

**Status:** FIXED (was already implemented before 2026-03-24)

**What Was Implemented (from implementation.md):**
- File: `src/core/utils/plan-limits.ts` (215 lines)

**Types exported:**
- PlanType (L5)
- ResourceType (L7–L22)
- LimitPeriod (L24)
- PlanLimitEntry (L26–L29)
- UsageEntry (L31–L36)
- PlanLimitCheckResult (L38–L43)
- UsageIncrementResult (L45–L50)
- AddOnKey (L214)

**Constants:**
- UNLIMITED = 999999999 (L52)
- PLAN_PRICES (L54–L59)
- PLAN_LIMITS for all 4 plans (L61–L124)
- ADD_ONS with 3 items (L190–L212)

**Helper functions:**
- getLimit() (L126)
- isUnlimited() (L130)
- getUsagePercent() (L134)
- isNearLimit() (L140)
- isAtLimit() (L145)
- getUpgradePlanFor() (L150)
- formatLimit() (L163)
- getResourceLabel() (L169)

---

### 8. usePlanLimits Hook ✅

**Status:** FIXED (was already implemented before 2026-03-24)

**What Was Implemented (from implementation.md):**
- File: `src/core/hooks/usePlanLimits.ts` (202 lines)

**Interface UsePlanLimitsReturn (L22–L43) with all 10 members:**
- isLoading
- planType
- usage
- checkLimit
- incrementUsage
- decrementUsage
- getUsageForResource
- isResourceNearLimit
- isResourceAtLimit
- refreshUsage

**usePlanLimits() hook (L45–L201):**
- Reads organization and subscription from useOrganization() (L46)
- Derives planType from subscription?.plan_type or organization?.plan_type (L50)
- React Query fetch with key ["organization_usage", organizationId], 30s stale time (L53–L72)
- checkLimit(resource) → calls check_plan_limit RPC, fails open on error (L76–L97)
- incrementUsage(resource, amount) → calls increment_usage RPC, invalidates cache (L99–L123)
- decrementUsage(resource, amount) → calls decrement_usage RPC, invalidates cache (L125–L144)
- getUsageForResource(resource) → falls back to PLAN_LIMITS defaults when no DB entry (L146–L165)
- isResourceNearLimit(resource) → delegates to isNearLimit() (L167–L174)
- isResourceAtLimit(resource) → delegates to isAtLimit() (L176–L183)
- refreshUsage() → invalidates React Query cache (L185–L187)

---

### 9. Upgrade Prompt Currency Symbol ✅

**Status:** FIXED (was already correct)

**What Was Implemented:**
- File: `src/ui/upgrade-prompt.tsx` (line 290)
- Add-on prices use `₹` symbol: `₹{addon.price}`

---

### 10. ProductsPage.tsx Fixes ✅

**Status:** FIXED (was already implemented before 2026-03-24)

**What Was Verified (from implementation.md):**
- File: `src/modules/cpq/pages/ProductsPage.tsx` (434 lines)

**FIX 9 — Price validation (L104–L108):**
```typescript
const parsedPrice = parseFloat(formUnitPrice || "0");
if (isNaN(parsedPrice) || parsedPrice < 0) {
  toast.error("Please enter a valid price");
  return;
}
```

**FIX 10 — AlertDialog (L381–413):**
- Full AlertDialog component with trigger, title, description, cancel/confirm actions
- No confirm() or globalThis.confirm() usage

**FIX 11 — Inactive toggle (L56-57, L280-290):**
```typescript
const [showInactive, setShowInactive] = useState(false);
const { data: products, isLoading } = useProducts({ includeInactive: showInactive });
// Switch component with label
```

---

## Summary

| Task # | Item | Status | Author |
|--------|------|--------|--------|
| 1 | Database Migration | ✅ Fixed | Sunny |
| 2 | TypeScript Types | ✅ Fixed | Sunny |
| 3 | PlanLimitBanner Placement | ✅ Fixed | Sunny |
| 4 | CRM Module Limits | ✅ Fixed | Sunny |
| 5 | ERP Module Limits | ✅ Fixed | Sunny |
| 6 | CLM Module (esignatures) | ✅ Fixed | Sunny |
| 7 | Plan Limit Constants | ✅ Fixed | Sunny |
| 8 | usePlanLimits Hook | ✅ Fixed | Sunny |
| 9 | Upgrade Prompt | ✅ Fixed | Sunny |
| 10 | ProductsPage Fixes | ✅ Fixed | Sunny |

---

### 11. Missing Error Handling for Usage Tracking ✅

**Status:** FIXED on 2026-03-24 (identified during code review)

**Problem:**
The `incrementUsage()` and `decrementUsage()` functions were only logging errors to console, but not notifying users. If usage tracking failed (e.g., database error), the operation would succeed silently while usage counts became desynchronized.

**What Was Implemented:**
Added `toast.error()` notifications to all usage tracking operations across 5 module hooks:

**CRM Module - `src/modules/crm/hooks/useCRM.ts`:**
| Hook | Line | Resource | Change |
|------|------|----------|--------|
| useCreateLead() | 395 | leads | Added toast on increment failure |
| useDeleteLead() | 496 | leads | Added toast on decrement failure |
| useCreateAccount() | 573 | accounts | Added toast on increment failure |
| useDeleteAccount() | 679 | accounts | Added toast on decrement failure |
| useCreateContact() | 759 | contacts | Added toast on increment failure |
| useDeleteContact() | 866 | contacts | Added toast on decrement failure |
| useCreateOpportunity() | 947 | opportunities | Added toast on increment failure |
| useDeleteOpportunity() | 1064 | opportunities | Added toast on decrement failure |

**CPQ Module - `src/modules/cpq/hooks/useCPQ.ts`:**
| Hook | Line | Resource | Change |
|------|------|----------|--------|
| useCreateProduct() | 137 | products | Added toast on increment failure |
| useDeleteProduct() | 243 | products | Added toast on decrement failure |
| useCreateQuote() | 369 | quotes | Added toast on increment failure |
| useDeleteQuote() | 531 | quotes | Added toast on decrement failure |

**CLM Module - `src/modules/clm/hooks/useCLM.ts`:**
| Hook | Line | Resource | Change |
|------|------|----------|--------|
| useCreateContractTemplate() | 119 | contract_templates | Added toast on increment failure |
| useDeleteContractTemplate() | 213 | contract_templates | Added toast on decrement failure |
| useCreateContract() | 313 | contracts | Added toast on increment failure |
| useDeleteContract() | 436 | contracts | Added toast on decrement failure |
| useCreateESignature() | 515 | esignatures | Added toast on increment failure |

**Documents Module - `src/modules/documents/hooks/useDocuments.ts`:**
| Hook | Line | Resource | Change |
|------|------|----------|--------|
| useCreateDocumentTemplate() | 192 | document_templates | Added toast on increment failure |
| useDeleteDocumentTemplate() | 282 | document_templates | Added toast on decrement failure |
| useCreateAutoDocument() | 428 | documents | Added toast on increment failure |
| useDeleteAutoDocument() | 527 | documents | Added toast on decrement failure |

**ERP Module - `src/modules/erp/hooks/useERP.ts`:**
| Hook | Line | Resource | Change |
|------|------|----------|--------|
| useCreateSupplier() | 258 | suppliers | Added toast on increment failure |
| useDeleteSupplier() | 361 | suppliers | Added toast on decrement failure |
| useCreatePurchaseOrder() | 653 | purchase_orders | Added toast on increment failure |
| useDeletePurchaseOrder() | 759 | purchase_orders | Added toast on decrement failure |

**Code Pattern (Before):**
```typescript
incrementUsage("leads").catch((err) =>
  console.error("Failed to increment leads usage:", err)
);
```

**Code Pattern (After):**
```typescript
incrementUsage("leads").catch((err) => {
  console.error("Failed to increment leads usage:", err);
  toast.error("Failed to update usage tracking. Please contact support.");
});
```

---

### 12. Legacy Plan Type Mapping ✅

**Status:** FIXED on 2026-03-24 (identified during code review)

**Problem:**
The old plan type values in the database (`starter`, `professional`, `enterprise`) didn't match the new values (`foundation`, `growth`, `commercial`, `enterprise`). When the old values were cast to the new `PlanType`, they would fail silently and fall back to `"foundation"`.

**What Was Implemented:**
Added `mapLegacyPlanType()` function in `src/core/hooks/usePlanLimits.ts` (lines 44–63):

```typescript
// Legacy plan type mapping: old values -> new values
function mapLegacyPlanType(planType: string | null | undefined): PlanType {
  if (!planType) return "foundation";
  
  // Map legacy plan types to new ones
  switch (planType.toLowerCase()) {
    case "starter":
      return "foundation";
    case "professional":
      return "growth";
    case "enterprise":
      return "enterprise";
    case "foundation":
    case "growth":
    case "commercial":
      return planType as PlanType;
    default:
      return "foundation";
  }
}
```

**Mapping Table:**
| Legacy Value | → | New Value |
|--------------|---|-----------|
| `starter` | → | `foundation` |
| `professional` | → | `growth` |
| `enterprise` | → | `enterprise` |
| `foundation` | → | `foundation` (unchanged) |
| `growth` | → | `growth` (unchanged) |
| `commercial` | → | `commercial` (unchanged) |

**Usage in hook:**
```typescript
const planType: PlanType = mapLegacyPlanType(subscription?.plan_type)
  ?? mapLegacyPlanType(organization?.plan_type)
  ?? "foundation";
```

---

### 13. Marketing Site Pricing Page Update ✅

**Status:** FIXED on 2026-03-24 (identified during code review)

**Problem:**
The marketing site pricing page (`src/workspaces/website/pages/Pricing.tsx`) displayed old pricing tiers with incorrect names and prices:
- Starter: $49/$39
- Professional: $99/$79
- Enterprise: Custom

**What Was Implemented:**
Updated the pricing page to match the new plan structure from `src/core/utils/plan-limits.ts`:

**New Pricing Tiers:**

| Plan | Price (₹/month) | Users | Key Limits |
|------|------------------|-------|------------|
| Foundation | ₹799 | 5 | 500 contacts, 100 accounts, 200 leads, 50 products, 50 quotes/mo, 100 docs |
| Growth | ₹1,399 | 25 | 5,000 contacts, 1,000 accounts, 2,000 leads, 500 products, 500 quotes/mo, 1,000 docs |
| Commercial | ₹2,299 | 100 | 50,000 contacts, 10,000 accounts, 20,000 leads, 5,000 products, 5,000 quotes/mo, 10,000 docs |
| Enterprise | ₹3,799 | Unlimited | Unlimited everything |

**Changes Made:**
1. Updated `plans` array with 4 new tiers (Foundation, Growth, Commercial, Enterprise)
2. Changed grid layout from `md:grid-cols-3` to `md:grid-cols-2 lg:grid-cols-4`
3. Updated pricing display to show ₹ symbol with same price for monthly/annual (already discounted)
4. Added detailed feature lists for each plan including all module features

**File Modified:**
- `src/workspaces/website/pages/Pricing.tsx`

---

## Summary

| Task # | Item | Status | Author |
|--------|------|--------|--------|
| 1 | Database Migration | ✅ Fixed | Sunny |
| 2 | TypeScript Types | ✅ Fixed | Sunny |
| 3 | PlanLimitBanner Placement | ✅ Fixed | Sunny |
| 4 | CRM Module Limits | ✅ Fixed | Sunny |
| 5 | ERP Module Limits | ✅ Fixed | Sunny |
| 6 | CLM Module (esignatures) | ✅ Fixed | Sunny |
| 7 | Plan Limit Constants | ✅ Fixed | Sunny |
| 8 | usePlanLimits Hook | ✅ Fixed | Sunny |
| 9 | Upgrade Prompt | ✅ Fixed | Sunny |
| 10 | ProductsPage Fixes | ✅ Fixed | Sunny |
| 11 | Error Handling (Usage Tracking) | ✅ Fixed | Code Review |
| 12 | Legacy Plan Type Mapping | ✅ Fixed | Code Review |
| 13 | Marketing Site Pricing Page | ✅ Fixed | Code Review |

---

*Created: 2026-03-24*
*Author: Sunny*
*Based On: docs/implementations/implementation.md*
*Updated: 2026-03-24 (added items 11-13 from code review fixes)*