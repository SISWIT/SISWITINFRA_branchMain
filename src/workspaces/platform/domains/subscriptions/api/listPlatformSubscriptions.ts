import { supabase } from "@/core/api/client";
import { PlatformSubscriptionRow } from "../types";
import { PaginatedResult, PaginationParams, getPaginationOffsets } from "../../../shared/types/pagination";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export interface ListSubscriptionsFilters {
  status?: string;
  plan?: string;
}

export async function listPlatformSubscriptions(
  pagination: PaginationParams,
  filters: ListSubscriptionsFilters
): Promise<PaginatedResult<PlatformSubscriptionRow>> {
  const { from, to } = getPaginationOffsets(pagination.page, pagination.pageSize);

  let query = supabase
    .from("organization_subscriptions")
    .select(
      `
      id,
      status,
      plan_type,
      module_crm,
      module_clm,
      module_cpq,
      module_erp,
      module_documents,
      updated_at,
      organization:organizations(id, name, slug, status)
      `,
      { count: "exact" }
    );

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status as any);
  }

  if (filters.plan && filters.plan !== "all") {
    query = query.eq("plan_type", filters.plan as any);
  }

  query = query.order("updated_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw normalizePlatformError(error);
  }

  const rows: PlatformSubscriptionRow[] = (data || []).map((row: any) => {
    // Array safety since it might return as plural relation or single object based on view inferences
    const orgRaw = row.organization;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;

    return {
      id: row.id,
      status: row.status,
      plan_type: row.plan_type,
      module_crm: row.module_crm,
      module_clm: row.module_clm,
      module_cpq: row.module_cpq,
      module_erp: row.module_erp,
      module_documents: row.module_documents,
      updated_at: row.updated_at,
      organization: org ? { id: org.id, name: org.name, slug: org.slug, status: org.status } : null,
    };
  });

  return {
    data: rows,
    count: count || 0,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil((count || 0) / pagination.pageSize),
  };
}
