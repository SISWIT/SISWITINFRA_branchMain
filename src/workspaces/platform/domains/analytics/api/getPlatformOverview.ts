import { supabase } from "@/core/api/client";
import { PlatformOverview } from "../types";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export async function getPlatformOverview(): Promise<PlatformOverview> {
  // @tsexpect-error RPC added in migration 056, db types will have it after next generation
  const { data, error } = await supabase.rpc("get_platform_overview");

  if (error) {
    throw normalizePlatformError(error);
  }

  // The RPC returns json
  return data as unknown as PlatformOverview;
}
