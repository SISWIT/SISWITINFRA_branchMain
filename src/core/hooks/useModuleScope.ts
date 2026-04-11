import { useAuth } from "@/core/auth/useAuth";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { isModuleScopeReady, type ModuleScopeContext } from "@/core/utils/module-scope";

export function useModuleScope() {
  const { user, role } = useAuth();
  const { organization, organizationLoading } = useOrganization();

  const scope: ModuleScopeContext = {
    organizationId: organization?.id ?? null,
    userId: user?.id ?? null,
    role,
  };

  return {
    scope,
    organizationId: scope.organizationId,
    organizationSlug: organization?.slug ?? null,
    // Compatibility alias to avoid touching downstream query keys yet.
    tenantId: scope.organizationId,
    tenantSlug: organization?.slug ?? null,
    userId: scope.userId,
    enabled: isModuleScopeReady(scope, organizationLoading),
  };
}
