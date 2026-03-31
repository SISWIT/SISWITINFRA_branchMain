import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPlatformUsers, ListUsersFilters } from "../api/listPlatformUsers";
import { PaginationParams } from "../../../shared/types/pagination";
import { platformKeys } from "../../../shared/api/queryKeys";

export function usePlatformUsers(
  pagination: PaginationParams,
  filters: ListUsersFilters
) {
  const queryKey = platformKeys.users.list({
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return useQuery({
    queryKey,
    queryFn: () => listPlatformUsers(pagination, filters),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}
