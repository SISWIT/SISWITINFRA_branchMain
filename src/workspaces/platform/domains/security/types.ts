export interface ActiveImpersonationRow {
  id: string;
  platform_super_admin_user_id: string;
  organization_id: string;
  reason: string;
  started_at: string;
  ended_at: string | null;
  
  organization?: {
    name: string;
    slug: string;
  } | null;
  
  admin_profile?: {
    email: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
  } | null;
}

export interface SecurityStatusOverview {
  active_sessions_count: number;
  recent_security_events: any[]; // Placeholder for now
  active_impersonations: ActiveImpersonationRow[];
}
