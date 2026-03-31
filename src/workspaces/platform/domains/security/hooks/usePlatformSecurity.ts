import { useQuery } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { getSecurityOverview } from "../api/getSecurityOverview";

export function usePlatformSecurity() {
  return useQuery({
    queryKey: platformKeys.security.stats(),
    queryFn: getSecurityOverview,
    refetchInterval: 15000, // Poll every 15 seconds to see active sessions
  });
}
