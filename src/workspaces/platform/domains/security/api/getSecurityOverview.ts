import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { ActiveImpersonationRow, SecurityStatusOverview } from "../types";

export async function getSecurityOverview(): Promise<SecurityStatusOverview> {
  const { data, error } = await supabase
    .from("impersonation_sessions")
    .select(`
      id,
      platform_super_admin_user_id,
      organization_id,
      reason,
      started_at,
      ended_at,
      organization:organizations!organization_id (name, slug)
    `)
    .is("ended_at", null) // Fetch only active sessions
    .order("started_at", { ascending: false });

  if (error) {
    throw normalizePlatformError(error);
  }

  // Fallback map for profiles since impersonation_sessions lacks a direct FK
  const adminProfilesMap = new Map<string, any>();
  
  if (data && data.length > 0) {
    const adminIds = [...new Set(data.map((row: any) => row.platform_super_admin_user_id))];
    const { data: admins } = await supabase
      .from("platform_super_admins")
      .select("user_id, email, first_name, last_name")
      .in("user_id", adminIds);
      
    if (admins) {
      admins.forEach((a: any) => adminProfilesMap.set(a.user_id, a));
    }
  }

  const activeImpersonations: ActiveImpersonationRow[] = (data || []).map((row: any) => {
    const org = Array.isArray(row.organization) ? row.organization[0] : row.organization;
    const profile = adminProfilesMap.get(row.platform_super_admin_user_id);
    
    return {
      id: row.id,
      platform_super_admin_user_id: row.platform_super_admin_user_id,
      organization_id: row.organization_id,
      reason: row.reason,
      started_at: row.started_at,
      ended_at: row.ended_at,
      organization: org ? { name: org.name, slug: org.slug } : null,
      admin_profile: profile ? {
        email: profile.email,
        full_name: profile.first_name && profile.last_name ? `${profile.first_name} ${profile.last_name}` : profile.first_name || profile.last_name,
        first_name: profile.first_name,
        last_name: profile.last_name,
      } : null,
    };
  });

  return {
    active_sessions_count: activeImpersonations.length,
    active_impersonations: activeImpersonations,
    recent_security_events: [], // Placeholder
  };
}
