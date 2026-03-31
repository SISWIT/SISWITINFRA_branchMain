import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/core/auth/useAuth";
import { useTenant } from "@/core/tenant/useTenant";
import { useImpersonation } from "@/core/hooks/useImpersonation";
import { isPlatformRole } from "@/core/types/roles";

interface TenantSlugGuardProps {
  children: ReactNode;
}

export function TenantSlugGuard({ children }: TenantSlugGuardProps) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { user, role, loading } = useAuth();
  const { tenant, tenantLoading, memberships, switchTenantBySlug } = useTenant();
  const { state: impersonation } = useImpersonation();
  const [resolving, setResolving] = useState(false);
  const lastSwitchedSlugRef = useRef<string | null>(null);

  const hasMembership = useMemo(() => {
    if (!tenantSlug) return false;
    return memberships.some((m) => m.tenant?.slug === tenantSlug);
  }, [memberships, tenantSlug]);

  useEffect(() => {
    if (!tenantSlug || loading || tenantLoading || !user) return;

    // Platform admins: do NOT auto-start impersonation.
    // The ProtectedRoute guard already requires an active impersonation session.
    // If the slug does not match the current impersonation, redirect will happen at the route level.
    if (isPlatformRole(role)) {
      return;
    }

    if (tenant?.slug === tenantSlug) return;
    if (!hasMembership) return;
    if (tenantSlug === lastSwitchedSlugRef.current) return;

    lastSwitchedSlugRef.current = tenantSlug;
    setResolving(true);
    void switchTenantBySlug(tenantSlug).finally(() => setResolving(false));
  }, [
    hasMembership,
    loading,
    role,
    switchTenantBySlug,
    tenant?.slug,
    tenantLoading,
    tenantSlug,
    user,
  ]);

  if (loading || tenantLoading || resolving) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  // Platform admins: require active impersonation matching this slug
  if (isPlatformRole(role)) {
    if (
      impersonation.active &&
      impersonation.organizationSlug === tenantSlug
    ) {
      return <>{children}</>;
    }
    // Impersonation not active or slug mismatch — redirect to platform
    return <Navigate to="/platform" replace />;
  }

  if (!tenantSlug || !hasMembership) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
