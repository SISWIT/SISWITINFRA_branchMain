import type { AppRole } from "@/types/roles";
import { canReadAllTenantRows, isOwnerScopedRole } from "@/types/roles";

export interface ModuleScopeContext {
  tenantId: string | null;
  userId: string | null;
  role: AppRole | null;
}

interface ScopedQuery<TQuery> {
  eq: (column: string, value: string) => TQuery;
  is: (column: string, value: null) => TQuery;
  or: (filters: string) => TQuery;
}

interface ReadScopeOptions {
  ownerColumns?: string[];
  includeSoftDeleted?: boolean;
}

interface CreatePayloadOptions {
  ownerColumn?: string | null;
  createdByColumn?: string | null;
}

export function isModuleScopeReady(scope: ModuleScopeContext, tenantLoading: boolean): boolean {
  return Boolean(scope.tenantId && scope.userId && scope.role && !tenantLoading);
}

export function requireTenantScope(scope: ModuleScopeContext): { tenantId: string; userId: string } {
  if (!scope.userId) {
    throw new Error("User not authenticated");
  }
  if (!scope.tenantId) {
    throw new Error("Tenant context is required");
  }
  return { tenantId: scope.tenantId, userId: scope.userId };
}

export function applyModuleReadScope<TQuery extends ScopedQuery<TQuery>>(
  query: TQuery,
  scope: ModuleScopeContext,
  options: ReadScopeOptions = {},
): TQuery {
  const { tenantId, userId } = requireTenantScope(scope);
  const ownerColumns = options.ownerColumns ?? ["owner_id"];
  const includeSoftDeleted = options.includeSoftDeleted ?? false;

  let scoped = query.eq("tenant_id", tenantId);
  if (!includeSoftDeleted) {
    scoped = scoped.is("deleted_at", null);
  }

  if (!canReadAllTenantRows(scope.role) && isOwnerScopedRole(scope.role) && ownerColumns.length > 0) {
    const ownerFilter = ownerColumns.map((column) => `${column}.eq.${userId}`).join(",");
    if (ownerFilter) {
      scoped = scoped.or(ownerFilter);
    }
  }

  return scoped;
}

export function applyModuleMutationScope<TQuery extends ScopedQuery<TQuery>>(
  query: TQuery,
  scope: ModuleScopeContext,
  ownerColumns: string[] = ["owner_id"],
): TQuery {
  const { tenantId, userId } = requireTenantScope(scope);
  let scoped = query.eq("tenant_id", tenantId);

  if (!canReadAllTenantRows(scope.role) && isOwnerScopedRole(scope.role) && ownerColumns.length > 0) {
    const ownerFilter = ownerColumns.map((column) => `${column}.eq.${userId}`).join(",");
    if (ownerFilter) {
      scoped = scoped.or(ownerFilter);
    }
  }

  return scoped;
}

export function buildModuleCreatePayload<TPayload extends Record<string, unknown>>(
  payload: TPayload,
  scope: ModuleScopeContext,
  options: CreatePayloadOptions = {},
): TPayload {
  const { tenantId, userId } = requireTenantScope(scope);
  const ownerColumn = options.ownerColumn === undefined ? "owner_id" : options.ownerColumn;
  const createdByColumn = options.createdByColumn;

  const nextPayload = {
    ...payload,
    tenant_id: tenantId,
  } as TPayload;

  if (ownerColumn) {
    (nextPayload as Record<string, unknown>)[ownerColumn] = userId;
  }

  if (createdByColumn) {
    return {
      ...nextPayload,
      [createdByColumn]: userId,
    } as TPayload;
  }

  return nextPayload;
}
