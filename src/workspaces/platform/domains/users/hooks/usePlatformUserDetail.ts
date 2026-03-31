import { useQuery } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { getPlatformUserDetail } from "../api/getPlatformUserDetail";

export function usePlatformUserDetail(userId: string) {
  return useQuery({
    queryKey: platformKeys.users.detail(userId),
    queryFn: () => getPlatformUserDetail(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
