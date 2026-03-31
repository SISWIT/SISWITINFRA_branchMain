import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { PlatformUsageDetail } from "../types";

export async function getOrganizationUsage(organizationId: string): Promise<PlatformUsageDetail> {
  const { data, error } = await supabase.rpc("get_organization_usage", {
    p_organization_id: organizationId,
  });

  if (error) {
    throw normalizePlatformError(error);
  }

  return data as unknown as PlatformUsageDetail;
}
