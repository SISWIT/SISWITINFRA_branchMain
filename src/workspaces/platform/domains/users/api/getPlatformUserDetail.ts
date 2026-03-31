import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { PlatformUserDetail, PlatformUserMembership } from "../types";

export async function getPlatformUserDetail(userId: string): Promise<PlatformUserDetail> {
  const [profileResult, membershipsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("organization_memberships")
      .select("id, email, role, is_active, account_state, created_at, organization_id, organizations!organization_id(name, slug)")
      .eq("user_id", userId)
  ]);

  if (profileResult.error) {
    throw normalizePlatformError(profileResult.error);
  }

  if (membershipsResult.error) {
    throw normalizePlatformError(membershipsResult.error);
  }

  const memberships: PlatformUserMembership[] = (membershipsResult.data || []).map((m: any) => ({
    id: m.id,
    organization_id: m.organization_id,
    organization_name: m.organizations?.name || "Unknown",
    organization_slug: m.organizations?.slug || "unknown",
    role: m.role,
    is_active: m.is_active,
    account_state: m.account_state,
    created_at: m.created_at,
  }));

  const pData = profileResult.data;

  return {
    user_id: pData?.user_id || userId,
    email: (membershipsResult.data && membershipsResult.data.length > 0 ? membershipsResult.data[0].email : null),
    first_name: pData?.first_name || pData?.full_name || null,
    last_name: pData?.last_name || null,
    job_title: pData?.company || "Unknown Company",
    phone_number: pData?.phone || null,
    created_at: pData?.created_at || new Date().toISOString(),
    updated_at: pData?.updated_at || new Date().toISOString(),
    memberships,
  };
}
