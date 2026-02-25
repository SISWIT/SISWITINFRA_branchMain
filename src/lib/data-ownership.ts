import { PostgrestFilterBuilder } from "@supabase/postgrest-js";

export interface OwnershipContext {
  tenantId?: string | null;
  userId?: string | null;
  isPlatformAdmin?: boolean;
}

/**
 * Core ownership rule:
 * - Platform admins may access all tenants.
 * - Non-platform users must be tenant-scoped.
 * - Mutations should stamp tenant_id and created_by/owner_id where applicable.
 */
export function applyTenantOwnershipScope<T>(
  query: PostgrestFilterBuilder<Record<string, unknown>, T, unknown>,
  context: OwnershipContext,
) {
  if (context.isPlatformAdmin) return query;
  if (!context.tenantId) return query;
  const scopedQuery = query as unknown as {
    eq: (column: string, value: string) => PostgrestFilterBuilder<Record<string, unknown>, T, unknown>;
  };
  return scopedQuery.eq("tenant_id", context.tenantId);
}

export function withOwnershipCreate<T extends Record<string, unknown>>(
  payload: T,
  context: OwnershipContext,
): T & { tenant_id?: string; created_by?: string; owner_id?: string } {
  const next: T & { tenant_id?: string; created_by?: string; owner_id?: string } = {
    ...payload,
  };

  if (!context.isPlatformAdmin && context.tenantId) {
    next.tenant_id = context.tenantId;
  }
  if (context.userId) {
    if (!("created_by" in next)) next.created_by = context.userId;
    if (!("owner_id" in next)) next.owner_id = context.userId;
  }
  return next;
}
