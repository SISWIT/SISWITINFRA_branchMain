import { supabase } from "@/core/api/client";
import { PlatformUserRow } from "../types";
import { PaginatedResult, PaginationParams, getPaginationOffsets } from "../../../shared/types/pagination";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export interface ListUsersFilters {
  search?: string;
  role?: string;
  state?: string;
}

export async function listPlatformUsers(
  pagination: PaginationParams,
  filters: ListUsersFilters
): Promise<PaginatedResult<PlatformUserRow>> {
  const { from, to } = getPaginationOffsets(pagination.page, pagination.pageSize);

  let query = supabase
    .from("organization_memberships")
    .select(
      `
      id,
      user_id,
      email,
      role,
      is_active,
      account_state,
      created_at,
      organization:organizations!organization_id(name, slug)
      `,
      { count: "exact" }
    );

  // Filters
  if (filters.search) {
    // PostgREST ilike on ENUM columns causes operator lookup failures that can trigger 404/400s.
    // For now we search solely by email.
    query = query.ilike("email", `%${filters.search}%`);
  }

  if (filters.role && filters.role !== "all") {
    query = query.eq("role", filters.role as any);
  }

  if (filters.state && filters.state !== "all") {
    query = query.eq("account_state", filters.state as any);
  }

  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw normalizePlatformError(error);
  }

  // Safety cast the joined object
  const rows: PlatformUserRow[] = (data || []).map((row: any) => {
    // If it's plural for some reason, grab the first one
    const orgRaw = row.organization;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;

    return {
      id: row.id,
      user_id: row.user_id,
      email: row.email,
      role: row.role,
      is_active: row.is_active,
      account_state: row.account_state,
      created_at: row.created_at,
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
