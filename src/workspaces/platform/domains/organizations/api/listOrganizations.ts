import { supabase } from "@/core/api/client";
import { PlatformOrganizationRow } from "../types";
import { PaginatedResult, PaginationParams, getPaginationOffsets } from "../../../shared/types/pagination";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export interface ListOrganizationsFilters {
  search?: string;
  status?: string;
  plan?: string;
}

export async function listOrganizations(
  pagination: PaginationParams,
  filters: ListOrganizationsFilters
): Promise<PaginatedResult<PlatformOrganizationRow>> {
  const { from, to } = getPaginationOffsets(pagination.page, pagination.pageSize);

  let query = supabase
    .from("organizations")
    .select(
      `
      id,
      name,
      slug,
      status,
      created_at,
      max_users,
      organization_subscriptions(plan_type, status),
      organization_memberships!organization_id(count)
      `,
      { count: "exact" }
    );

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
  }
  
  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Handle pagination
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw normalizePlatformError(error);
  }

  const rows: PlatformOrganizationRow[] = (data || []).map((row: any) => {
    // Safely enforce array type since PostgREST might return a single object for zero-to-one inferences
    const subsRaw = row.organization_subscriptions;
    const subs = Array.isArray(subsRaw) ? subsRaw : (subsRaw ? [subsRaw] : []);
    const activeSub = subs.find((s: any) => s.status === 'active') || subs[0] || {};
    
    // Extract memberships count
    const membersRaw = row.organization_memberships;
    const members = Array.isArray(membersRaw) ? membersRaw : (membersRaw ? [membersRaw] : []);
    // Under aggregates, count is fetched as `{ count: N }` inside the array or object
    const activeUsersCount = members.length > 0 ? (members[0].count || 0) : 0;

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      created_at: row.created_at,
      max_users: row.max_users || 0,
      
      plan_type: activeSub.plan_type || "free",
      subscription_status: activeSub.status || "none",
      
      active_users_count: activeUsersCount,
    };
  });

  // If filtering by plan (which is on the joined table), we have to filter mostly in JS 
  // because PostgREST doesn't support complex joins filtering easily without views.
  // For a real production app, an RPC or specific view is better, but this works for MVP list endpoints.
  let finalRows = rows;
  if (filters.plan && filters.plan !== "all") {
    finalRows = rows.filter((r) => r.plan_type.toLowerCase() === filters.plan?.toLowerCase());
  }

  return {
    data: finalRows,
    count: count || 0,
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalPages: Math.ceil((count || 0) / pagination.pageSize),
  };
}
