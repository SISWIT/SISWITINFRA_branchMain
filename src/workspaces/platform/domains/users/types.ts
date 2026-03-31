export interface PlatformUserRow {
  id: string; // the membership id
  user_id: string; // the auth.users id
  email: string;
  role: string;
  is_active: boolean;
  account_state: "active" | "pending_verification" | "pending_approval" | "suspended" | string;
  created_at: string;
  
  organization?: {
    name: string;
    slug: string;
  } | null;
}

export interface PlatformUserMembership {
  id: string; // membership id
  organization_id: string;
  organization_name: string;
  organization_slug: string;
  role: string;
  is_active: boolean;
  account_state: string;
  created_at: string;
}

export interface PlatformUserDetail {
  user_id: string; // auth.users id
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
  memberships: PlatformUserMembership[];
}
