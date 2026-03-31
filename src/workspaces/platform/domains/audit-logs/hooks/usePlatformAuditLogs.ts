import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { listPlatformAuditLogs, ListAuditLogsFilters } from "../api/listPlatformAuditLogs";
import { PaginationParams } from "../../../shared/types/pagination";
import { platformKeys } from "../../../shared/api/queryKeys";

export function usePlatformAuditLogs(
  pagination: PaginationParams,
  filters: ListAuditLogsFilters
) {
  const queryKey = platformKeys.auditLogs.list({
    ...filters,
    page: pagination.page,
    pageSize: pagination.pageSize,
  });

  return useQuery({
    queryKey,
    queryFn: () => listPlatformAuditLogs(pagination, filters),
    placeholderData: keepPreviousData,
    staleTime: 30000,
  });
}
