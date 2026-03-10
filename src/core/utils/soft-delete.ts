import { typedFrom, type TableName } from "@/core/api/typed-client";
import { logger } from "@/core/utils/logger";

interface SoftDeleteInput {
  table: TableName;
  id: string;
  userId: string | null;
  // Required for tenant isolation.
  organizationId: string;
}

interface RestoreInput {
  table: TableName;
  id: string;
  // Optional for backward compatibility during migration.
  organizationId?: string | null;
}

/**
 * Soft delete convention:
 * - set `deleted_at`
 * - set `deleted_by`
 * - keep record for audit and recovery
 */
export async function softDeleteRecord(input: SoftDeleteInput): Promise<boolean> {
  if (!input.organizationId) {
    throw new Error("softDeleteRecord requires organizationId for tenant isolation");
  }

  const { error } = await typedFrom(input.table)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: input.userId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Soft delete failed", {
      table: input.table,
      id: input.id,
      organizationId: input.organizationId,
      error,
    });
    throw new Error(error.message || `Failed to soft delete record in ${input.table}`);
  }

  return true;
}

export async function restoreSoftDeletedRecord(input: RestoreInput): Promise<boolean> {
  let query = typedFrom(input.table)
    .update({
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (input.organizationId) {
    query = query.eq("organization_id", input.organizationId);
  }

  const { error } = await query;

  if (error) {
    logger.error("Restore soft delete failed", {
      table: input.table,
      id: input.id,
      organizationId: input.organizationId ?? null,
      error,
    });
    throw new Error(error.message || `Failed to restore record in ${input.table}`);
  }

  return true;
}
