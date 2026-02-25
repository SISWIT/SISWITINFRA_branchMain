import { supabase } from "@/integrations/supabase/client";

export interface AuditLogInput {
  action: string;
  entityType: string;
  entityId: string;
  tenantId?: string | null;
  userId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Non-blocking audit logger.
 * Keep failures silent in UI flows, but return boolean for optional telemetry.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<boolean> {
  try {
    const unsafeSupabase = supabase as unknown as {
      from: (table: string) => {
        insert: (payload: unknown) => Promise<{ error: { message?: string } | null }>;
      };
    };

    const { error } = await unsafeSupabase.from("audit_logs").insert({
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      tenant_id: input.tenantId ?? null,
      user_id: input.userId ?? null,
      old_values: input.oldValues ?? null,
      new_values: input.newValues ?? null,
      metadata: input.metadata ?? null,
      created_at: new Date().toISOString(),
    });
    return !error;
  } catch {
    return false;
  }
}
