import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { PlatformRouteGuard } from "@/workspaces/platform/app/PlatformRouteGuard";
import { PlatformAdminLayout } from "@/workspaces/platform/layout/PlatformAdminLayout";

// ---------------------------------------------------------------------------
// Lazy-loaded page components
// ---------------------------------------------------------------------------
const PlatformDashboardPage = lazy(
  () => import("@/workspaces/platform/pages/PlatformDashboardPage"),
);
const OrganizationsPage = lazy(
  () => import("@/workspaces/platform/pages/OrganizationsPage"),
);
const OrganizationDetailPage = lazy(
  () => import("@/workspaces/platform/pages/OrganizationDetailPage"),
);
const UsersPage = lazy(
  () => import("@/workspaces/platform/pages/UsersPage"),
);
const UserDetailPage = lazy(
  () => import("@/workspaces/platform/pages/UserDetailPage"),
);
const SubscriptionsPage = lazy(
  () => import("@/workspaces/platform/pages/SubscriptionsPage"),
);
const UsageDashboardPage = lazy(
  () => import("@/workspaces/platform/pages/UsageDashboardPage"),
);
const HealthPage = lazy(
  () => import("@/workspaces/platform/pages/HealthPage"),
);
const SecurityPage = lazy(
  () => import("@/workspaces/platform/pages/SecurityPage"),
);
const SettingsPage = lazy(
  () => import("@/workspaces/platform/pages/SettingsPage"),
);
const AuditLogsPage = lazy(
  () => import("@/workspaces/platform/pages/AuditLogsPage"),
);
const AnalyticsPage = lazy(
  () => import("@/workspaces/platform/pages/AnalyticsPage"),
);

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

/**
 * Owns the entire `/platform/*` route tree.
 *
 * This component is rendered at the `/platform/*` path in App.tsx and handles:
 * - Route guarding via PlatformRouteGuard
 * - Layout wrapping via PlatformAdminLayout
 * - Canonical routes (organizations, subscriptions, etc.)
 * - Legacy route redirects (tenants → organizations, billing → subscriptions)
 */
export function PlatformAdminRoutes() {
  return (
    <PlatformRouteGuard>
      <PlatformAdminLayout>
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            {/* Canonical routes */}
            <Route index element={<PlatformDashboardPage />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
            <Route path="usage" element={<UsageDashboardPage />} />
            <Route path="health" element={<HealthPage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />

            {/* Legacy route redirects */}
            <Route path="tenants" element={<Navigate to="/platform/organizations" replace />} />
            <Route path="billing" element={<Navigate to="/platform/subscriptions" replace />} />
            <Route path="logs" element={<Navigate to="/platform/audit-logs" replace />} />

            {/* Catch-all for unknown platform sub-routes */}
            <Route path="*" element={<Navigate to="/platform" replace />} />
          </Routes>
        </Suspense>
      </PlatformAdminLayout>
    </PlatformRouteGuard>
  );
}
