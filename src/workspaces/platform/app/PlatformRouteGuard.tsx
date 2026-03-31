import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { PlatformAdminRoute } from "@/core/auth/components/ProtectedRoute";
import { PlatformCapability } from "@/workspaces/platform/shared/auth/platform-capabilities";
import { usePlatformPermissions } from "@/workspaces/platform/shared/auth/usePlatformPermissions";

interface PlatformRouteGuardProps {
  children: ReactNode;
  requiredCapability?: PlatformCapability;
}

/**
 * Dedicated guard for `/platform/*` routes.
 * Wraps PlatformAdminRoute and provides granular capability-based gating.
 */
export function PlatformRouteGuard({ children, requiredCapability }: PlatformRouteGuardProps) {
  const { can } = usePlatformPermissions();

  if (requiredCapability && !can(requiredCapability)) {
    // Return unauthorized if they lack the required generic capability
    // PlatformAdminRoute already ensures they are at least a platform admin
    return <Navigate to="/unauthorized" replace />;
  }

  return <PlatformAdminRoute>{children}</PlatformAdminRoute>;
}
