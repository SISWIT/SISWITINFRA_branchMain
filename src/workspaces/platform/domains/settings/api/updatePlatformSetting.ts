import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { safeWriteAuditLog } from "@/core/utils/audit";

export async function updatePlatformSetting(
  key: string,
  value: string
): Promise<void> {
  const { error } = await supabase
    .from("platform_settings")
    .update({ 
      value,
      updated_at: new Date().toISOString()
    })
    .eq("key", key);

  if (error) throw normalizePlatformError(error);

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    await safeWriteAuditLog({
      action: "platform.settings.update",
      entityType: "platform_setting",
      entityId: key,
      userId: session.user.id,
      actorType: "platform_admin",
      metadata: { new_value: value }
    });
  }
}
