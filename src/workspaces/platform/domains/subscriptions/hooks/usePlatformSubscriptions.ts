import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPlatformSubscriptions, ListSubscriptionsFilters } from "../api/listPlatformSubscriptions";
import { PaginationParams } from "../../../shared/types/pagination";
import { platformKeys } from "../../../shared/api/queryKeys";

export function usePlatformSubscriptions(
  pagination: PaginationParams,
  filters: ListSubscriptionsFilters
) {
  const queryKey = platformKeys.subscriptions.list({
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return useQuery({
    queryKey,
    queryFn: () => listPlatformSubscriptions(pagination, filters),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}
