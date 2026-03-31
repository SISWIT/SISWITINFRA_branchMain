import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { PlatformFeatureFlagRow } from "../types";

export async function getFeatureFlags(): Promise<PlatformFeatureFlagRow[]> {
  const { data, error } = await supabase
    .from("platform_feature_flags")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    throw normalizePlatformError(error);
  }

  return data as PlatformFeatureFlagRow[];
}
