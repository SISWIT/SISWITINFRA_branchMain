import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { PlatformOrganizationDetail } from "../types";

export async function getOrganizationDetail(id: string): Promise<PlatformOrganizationDetail> {
  const [orgResult, membershipsResult] = await Promise.all([
    supabase
      .from("organizations")
      .select(`
        *,
        organization_subscriptions!organization_id (
          plan_type,
          status
        )
      `)
      .eq("id", id)
      .single(),
    supabase
      .from("organization_memberships")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", id)
      .eq("is_active", true),
  ]);

  if (orgResult.error) {
    throw normalizePlatformError(orgResult.error);
  }

  // Handle PostgREST returning arrays or objects for joins depending on constraints
  const subs = orgResult.data.organization_subscriptions as any;
  const subscription = Array.isArray(subs) ? subs[0] : subs;

  return {
    ...orgResult.data,
    plan_type: subscription?.plan_type ?? "unknown",
    subscription_status: subscription?.status ?? "unknown",
    active_users_count: membershipsResult.count ?? 0,
  } as PlatformOrganizationDetail;
}
