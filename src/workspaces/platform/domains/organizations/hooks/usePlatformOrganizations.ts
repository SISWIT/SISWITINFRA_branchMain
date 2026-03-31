import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { listOrganizations, ListOrganizationsFilters } from "../api/listOrganizations";
import { PaginationParams } from "../../../shared/types/pagination";

export function usePlatformOrganizations(
  pagination: PaginationParams,
  filters: ListOrganizationsFilters
) {
  // stable query key using the factory
  const queryKey = platformKeys.organizations.list({
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return useQuery({
    queryKey,
    queryFn: () => listOrganizations(pagination, filters),
    placeholderData: keepPreviousData, // smoother pagination transitions
    staleTime: 30000,
  });
}
