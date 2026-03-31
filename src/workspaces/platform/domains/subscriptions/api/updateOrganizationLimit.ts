import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { PlatformLimitUpdate } from "../types";

export async function updateOrganizationLimit(update: PlatformLimitUpdate): Promise<void> {
  const { error } = await supabase
    .from("plan_limits")
    .upsert({
      organization_id: update.organization_id,
      resource_type: update.resource_type,
      max_allowed: update.max_allowed,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "organization_id, resource_type",
    });

  if (error) {
    throw normalizePlatformError(error);
  }
}
