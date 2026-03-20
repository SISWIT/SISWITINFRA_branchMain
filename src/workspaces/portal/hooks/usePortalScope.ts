import { useMemo } from "react";
import { useAuth } from "@/core/auth/useAuth";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

export function usePortalScope() {
  const { user } = useAuth();
  const { organization, organizationLoading, memberships } = useOrganization();

  const membership = useMemo(() => {
    if (!organization?.id || !user?.id) {
      return null;
    }

    return (
      memberships.find(
        (item) =>
          item.organization_id === organization.id &&
          item.user_id === user.id &&
          item.is_active &&
          item.role === 'client'
      ) ?? null
    );
  }, [memberships, organization?.id, user?.id]);

  const portalEmail = membership?.email?.trim() || null;
  const contactId = membership?.contact_id || null;
  const accountId = membership?.account_id || null;

  return {
    organizationId: organization?.id ?? null,
    organizationLoading,
    portalEmail,
    contactId,
    accountId,
    userId: user?.id ?? null,
    isReady: Boolean(!organizationLoading && organization?.id && user?.id && membership),
  };
}
