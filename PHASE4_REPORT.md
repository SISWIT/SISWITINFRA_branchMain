# SISWIT — Phase 4 Completion Report

**Phase:** 🟡 Phase 4 — Warnings & Edge Cases
**Status:** ✅ ALL 8 ISSUES FIXED
**Date:** 2026-03-09

---

## Fixes Applied

### ✅ W-01 — withTimeout Timer Leak
**File:** `src/app/providers/AuthProvider.tsx`, lines 96–107
**What was wrong:** `setTimeout` timer was never cleaned up when the wrapped promise resolved before the timeout, causing a timer leak.
**What was fixed:** Added `.finally(() => clearTimeout(timerId))` after `Promise.race()`.
```diff
- const timer = setTimeout(() => {
-   clearTimeout(timer);
-   reject(new Error("Timeout"));
- }, timeout);
+ timerId = setTimeout(() => reject(new Error("Timeout")), timeout);
+ ]).finally(() => clearTimeout(timerId));
```

---

### ✅ W-02 — Auth useEffect Infinite Re-render Risk
**File:** `src/app/providers/AuthProvider.tsx`, line 155
**What was wrong:** `unsafeSupabase` was recreated every render, destabilizing callback dependencies and risking infinite re-renders.
**What was fixed:** Wrapped in `useMemo` with empty dependency array.
```diff
- const unsafeSupabase = supabase as unknown as SupabaseClient;
+ const unsafeSupabase = useMemo(() => supabase as unknown as SupabaseClient, []);
```

---

### ✅ W-03 — getCachedRole Raw String Fallback
**File:** `src/app/providers/AuthProvider.tsx`, lines 173–192
**What was wrong:** If `sessionStorage` contained a raw string (non-JSON), it was treated as a valid role — corrupted cache could produce unexpected role values.
**What was fixed:** Non-JSON values are now rejected and cleared from storage. `catch` block also clears invalid entries.
```diff
- let parsedRole = cached;
- if (cached.startsWith("{")) { ... }
- return normalizeRole(parsedRole);
+ if (!cached.startsWith("{")) {
+   sessionStorage.removeItem(...);
+   return null;
+ }
+ return normalizeRole(payload.role);
```

---

### ✅ W-04 — TenantSlugGuard Silent Failure
**File:** `src/core/auth/components/TenantSlugGuard.tsx`, lines 41–55
**What was wrong:** Failed impersonation lookup was silently swallowed — no error logged, children still rendered without proper context.
**What was fixed:** Added `.catch()` handler that logs the error.
```diff
- })();
+ })().catch((err) => {
+   console.error("Impersonation lookup failed:", err);
+ });
```

---

### ✅ W-05 — QueryClient Never Cleared on Logout
**File:** `src/app/providers/AuthProvider.tsx` (signOut) + `src/app/App.tsx` (queryClient export)
**What was wrong:** `QueryClient` cache persisted across logout/login — stale data from one session could appear in the next.
**What was fixed:** Exported `queryClient` from `App.tsx`, added `queryClient.clear()` in `signOut()` via dynamic import.
```diff
+ const { queryClient } = await import("@/app/App");
+ queryClient.clear();
  await supabase.auth.signOut();
```

---

### ✅ W-06 — /:tenantSlug Catch-All Route Conflict
**File:** `src/app/App.tsx`, line 330
**What was wrong:** `/:tenantSlug` matched *any* single-segment path, including reserved routes like `/admin`, `/auth`, `/platform`.
**What was fixed:** Added `TenantSlugRedirect` component that checks against reserved segments before redirecting. Returns `<NotFound />` for reserved paths.
```tsx
function TenantSlugRedirect() {
  const { tenantSlug } = useParams();
  const reservedSegments = ["auth", "platform", "admin", "dashboard", "portal", "api"];
  if (!tenantSlug || reservedSegments.includes(tenantSlug.toLowerCase())) {
    return <NotFound />;
  }
  return <Navigate to="app/dashboard" replace />;
}
```

---

### ✅ W-08 — OrganizationProvider Unstable Dependency
**File:** `src/app/providers/OrganizationProvider.tsx`, line 74
**What was wrong:** Same issue as W-02 — `unsafeSupabase` recreated every render.
**What was fixed:** Wrapped in `useMemo`.
```diff
- const unsafeSupabase = supabase as unknown as SupabaseClient;
+ const unsafeSupabase = useMemo(() => supabase as unknown as SupabaseClient, []);
```

---

### ✅ W-10 — _rememberMe Unused Parameter
**File:** `src/app/providers/AuthProvider.tsx`, line 898
**What was wrong:** `signIn()` accepted `_rememberMe: boolean` but never used it — misleading API.
**What was fixed:** Removed the parameter.
```diff
- async (email: string, password: string, _rememberMe = true) => {
+ async (email: string, password: string) => {
```

---

## Files Changed

| # | File | Change Type |
|---|------|-------------|
| 1 | `src/app/providers/AuthProvider.tsx` | 4 fixes (W-01, W-02, W-03, W-05, W-10) |
| 2 | `src/app/App.tsx` | 3 changes (export queryClient, add TenantSlugRedirect, useParams import) |
| 3 | `src/app/providers/OrganizationProvider.tsx` | 1 fix (W-08) |
| 4 | `src/core/auth/components/TenantSlugGuard.tsx` | 1 fix (W-04) |

## Pre-Existing Lint Notes

| Warning | Source | Phase 4 Related? |
|---------|--------|-----------------|
| `accountState` missing in AuthContextType | `AuthProvider.tsx:1062` | ❌ Pre-existing |
| `RootRedirect` unused | `App.tsx:166` | ❌ Pre-existing |

## Risk Assessment

| Fix | Risk | Notes |
|-----|------|-------|
| W-01 | 🟢 Zero | Standard timer cleanup pattern |
| W-02 | 🟢 Zero | `useMemo` with `[]` — stable reference |
| W-03 | 🟢 Low | More defensive — previously-cached raw strings will be cleared |
| W-04 | 🟢 Zero | Added error logging only |
| W-05 | 🟡 Low | Dynamic `import()` adds negligible latency to signOut |
| W-06 | 🟡 Low | New guard — test `/auth` and `/platform` paths still work |
| W-08 | 🟢 Zero | Same as W-02 |
| W-10 | 🟡 Low | Breaking if any caller passes 3 args — search confirmed none do |
