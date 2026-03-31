import { useMemo } from "react";
import { useAuth } from "@/core/auth/useAuth";
import { isPlatformRole } from "@/core/types/roles";
import { PlatformCapability, DEFAULT_PLATFORM_CAPABILITIES } from "./platform-capabilities";

export function usePlatformPermissions() {
  const { role } = useAuth();
  
  const isPlatformSuperAdmin = isPlatformRole(role);

  // In the future, this could be fetched from a database table 
  // if we add secondary platform operators. For now, it's static.
  const capabilities = useMemo(() => {
    if (isPlatformSuperAdmin) {
      return DEFAULT_PLATFORM_CAPABILITIES;
    }
    return new Set<PlatformCapability>();
  }, [isPlatformSuperAdmin]);

  const can = (capability: PlatformCapability): boolean => {
    return capabilities.has(capability);
  };

  return {
    can,
    capabilities,
    isPlatformSuperAdmin,
  };
}
