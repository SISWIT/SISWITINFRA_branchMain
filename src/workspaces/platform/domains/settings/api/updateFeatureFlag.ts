import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { safeWriteAuditLog } from "@/core/utils/audit";

export async function updateFeatureFlag(
  key: string,
  is_enabled: boolean
): Promise<void> {
  const { error } = await supabase
    .from("platform_feature_flags")
    .update({ 
      is_enabled,
      updated_at: new Date().toISOString()
    })
    .eq("key", key);

  if (error) throw normalizePlatformError(error);

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    await safeWriteAuditLog({
      action: "platform.feature_flag.update",
      entityType: "platform_feature_flag",
      entityId: key,
      userId: session.user.id,
      actorType: "platform_admin",
      metadata: { new_state: is_enabled }
    });
  }
}
