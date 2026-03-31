import { useQuery } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { getOrganizationUsage } from "../api/getOrganizationUsage";

export function usePlatformUsage(organizationId: string) {
  return useQuery({
    queryKey: platformKeys.subscriptions.usage(organizationId),
    queryFn: () => getOrganizationUsage(organizationId),
    enabled: !!organizationId,
    staleTime: 1000 * 30, // 30 seconds fresh
  });
}
