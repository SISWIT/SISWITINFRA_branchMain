import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { PlatformSettingRow } from "../types";

export async function getPlatformSettings(): Promise<PlatformSettingRow[]> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .order("key", { ascending: true });

  if (error) {
    throw normalizePlatformError(error);
  }

  return data as PlatformSettingRow[];
}
