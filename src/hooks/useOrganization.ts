import { useContext } from "react";
import { OrganizationContext } from "@/hooks/organization-context";
import type { ModuleType } from "@/types/organization";

export function useOrganization() {
  const ctx = useContext(OrganizationContext);
  if (!ctx) {
    throw new Error("useOrganization must be used inside OrganizationProvider");
  }
  return ctx;
}

export function useOrganizationModuleAccess(module: ModuleType) {
  const { hasModule, subscription, organization } = useOrganization();

  return {
    hasAccess: hasModule(module),
    isEnabled: subscription ? hasModule(module) : false,
    isLoading: !subscription && !organization,
    module,
  };
}
