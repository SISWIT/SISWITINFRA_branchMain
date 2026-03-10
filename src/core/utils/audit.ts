import { typedFrom } from "@/core/api/typed-client";
import type { Database, Json } from "@/core/api/types";
import { getErrorMessage } from "@/core/utils/errors";
import { logger } from "@/core/utils/logger";

export interface AuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  organizationId?: string | null;
  // Compatibility alias while callers are migrating.
  tenantId?: string | null;
  userId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

function asJson(value: Record<string, unknown> | null | undefined): Json | null {
  return value ? (value as Json) : null;
}

/**
 * Low-level audit logger.
 * Throws on write failure.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const organizationId = input.organizationId ?? input.tenantId ?? null;
  const auditEntry: Database["public"]["Tables"]["audit_logs"]["Insert"] = {
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    organization_id: organizationId,
    tenant_id: organizationId,
    user_id: input.userId ?? null,
    old_values: asJson(input.oldValues),
    new_values: asJson(input.newValues),
    metadata: asJson(input.metadata) ?? {},
    created_at: new Date().toISOString(),
  };

  const { error } = await typedFrom("audit_logs").insert(auditEntry);
  if (error) {
    throw error;
  }
}

/**
 * Non-blocking audit logger wrapper.
 * Failures are logged for observability and never thrown to UI flows.
 */
export async function safeWriteAuditLog(input: AuditLogInput): Promise<void> {
  try {
    await writeAuditLog(input);
  } catch (error) {
    logger.error("Audit log write failed", {
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      organizationId: input.organizationId ?? input.tenantId ?? null,
      userId: input.userId ?? null,
      error: getErrorMessage(error),
    });
  }
}
