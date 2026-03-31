import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export interface GlobalUsageStat {
  resource_type: string;
  total_usage: number;
  org_count: number;
  top_consumers: {
    organization_name: string;
    organization_slug: string;
    usage: number;
  }[];
}

export async function getGlobalUsageStats(): Promise<GlobalUsageStat[]> {
  // Since we don't have a complex global RPC yet, we'll fetch the top records directly from usage_tracking
  const { data, error } = await supabase
    .from("usage_tracking")
    .select(`
      resource_type,
      current_count,
      organizations!organization_id (
        name,
        slug
      )
    `)
    .order("current_count", { ascending: false });

  if (error) {
    throw normalizePlatformError(error);
  }

  // Aggregate into GlobalUsageStat format
  const statsMap = new Map<string, GlobalUsageStat>();

  data.forEach((item: any) => {
    const type = item.resource_type;
    const usage = item.current_count;
    const org = item.organizations;

    if (!statsMap.has(type)) {
      statsMap.set(type, {
        resource_type: type,
        total_usage: 0,
        org_count: 0,
        top_consumers: [],
      });
    }

    const stat = statsMap.get(type)!;
    stat.total_usage += usage;
    stat.org_count += 1;
    
    if (stat.top_consumers.length < 5) {
      stat.top_consumers.push({
        organization_name: org?.name || "Unknown",
        organization_slug: org?.slug || "unknown",
        usage: usage,
      });
    }
  });

  return Array.from(statsMap.values());
}
