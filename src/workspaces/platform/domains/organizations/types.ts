export interface PlatformOrganizationRow {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "trial" | "cancelled" | string;
  created_at: string;
  max_users: number;

  // Subscription data (joined)
  plan_type: string;
  subscription_status: string;

  // Real-time aggregates
  active_users_count: number;
}

export interface PlatformOrganizationDetail extends PlatformOrganizationRow {
  owner_user_id: string | null;
  org_code: string;
  company_email: string | null;
  company_phone: string | null;
  company_address: string | null;
  company_website: string | null;
  max_storage_mb: number;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  updated_at: string;
}
