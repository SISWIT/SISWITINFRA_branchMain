import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { safeWriteAuditLog } from "@/core/utils/audit";

export async function forceEndImpersonation(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from("impersonation_sessions")
    .update({
      ended_at: new Date().toISOString(),
      // In a real system, we might add ended_by to track WHO killed the session
    })
    .eq("id", sessionId)
    .is("ended_at", null);

  if (error) {
    throw normalizePlatformError(error);
  }

  // Log the action for platform transparency
  await safeWriteAuditLog({
    action: "impersonation.force_ended",
    entityType: "impersonation_sessions",
    entityId: sessionId,
    actorType: "platform_admin",
    metadata: {
      session_id: sessionId,
      reason: "Force terminated by another Super Admin"
    }
  });
}
