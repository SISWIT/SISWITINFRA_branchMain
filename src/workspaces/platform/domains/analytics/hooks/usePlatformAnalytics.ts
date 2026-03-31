import { useQuery } from "@tanstack/react-query";
import { getAnalyticsOverview } from "../api/getAnalyticsOverview";
import { platformKeys } from "../../../shared/api/queryKeys";

export function usePlatformAnalytics() {
  const query = useQuery({
    queryKey: platformKeys.analytics.all(),
    queryFn: getAnalyticsOverview,
    refetchInterval: 30000, // refresh every 30 seconds for live feel
  });

  return {
    overview: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  };
}
