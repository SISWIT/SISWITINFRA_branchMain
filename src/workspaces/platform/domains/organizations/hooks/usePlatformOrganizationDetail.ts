import { useQuery } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { getOrganizationDetail } from "../api/getOrganizationDetail";

export function usePlatformOrganizationDetail(id: string) {
  return useQuery({
    queryKey: platformKeys.organizations.detail(id),
    queryFn: () => getOrganizationDetail(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
