import { useQuery } from "@tanstack/react-query";
import { getPlatformOverview } from "../api/getPlatformOverview";
import { platformKeys } from "../../../shared/api/queryKeys";

export function usePlatformOverview() {
  return useQuery({
    queryKey: platformKeys.organizations.stats(),
    queryFn: getPlatformOverview,
    refetchInterval: 60000, // Refresh every minute
  });
}
