import { supabase } from "@/core/api/client";
import { PlatformAuditLogRow } from "../types";
import { PaginatedResult, PaginationParams, getPaginationOffsets } from "../../../shared/types/pagination";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export interface ListAuditLogsFilters {
  action?: string;
  entity?: string;
}

export async function listPlatformAuditLogs(
  pagination: PaginationParams,
  filters: ListAuditLogsFilters
): Promise<PaginatedResult<PlatformAuditLogRow>> {
  const { from, to } = getPaginationOffsets(pagination.page, pagination.pageSize);

  let query = supabase
    .from("audit_logs")
    .select(
      `
      id,
      action,
      entity_type,
      entity_id,
      metadata,
      created_at,
      organization:organizations(name, slug)
      `,
      { count: "exact" }
    );

  if (filters.action && filters.action !== "all") {
    query = query.eq("action", filters.action);
  }

  if (filters.entity && filters.entity !== "all") {
    query = query.eq("entity_type", filters.entity);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw normalizePlatformError(error);
  }

  const rows: PlatformAuditLogRow[] = (data || []).map((row: any) => {
    // Array safety since it might return as plural relation or single object based on view inferences
    const orgRaw = row.organization;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;

    // Extract actor information from metadata
    const actorEmail = row.metadata?.actor_email || row.metadata?.user_email || "system@local";
    const actorName = row.metadata?.actor_name || "System Actor";

    return {
      id: row.id,
      action: row.action,
      entity_type: row.entity_type,
      entity_id: row.entity_id,
      metadata: row.metadata || {},
      created_at: row.created_at,
      
      actor_name: actorName,
      actor_email: actorEmail,
      
      organization: org ? { name: org.name, slug: org.slug } : null,
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
