import { useQuery } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { getSystemHealth } from "../api/getSystemHealth";

export function usePlatformHealth() {
  return useQuery({
    queryKey: platformKeys.health.stats(),
    queryFn: getSystemHealth,
    refetchInterval: 60000, // Poll every minute
  });
}
