export interface PlatformSubscriptionRow {
  id: string;
  status: "active" | "suspended" | "cancelled" | "trial" | string;
  plan_type: string;
  module_crm: boolean;
  module_clm: boolean;
  module_cpq: boolean;
  module_erp: boolean;
  module_documents: boolean;
  updated_at: string;
  
  organization?: {
    id: string;
    name: string;
    slug: string;
    status: string;
  } | null;
}

export interface PlatformResourceMetrics {
  current_count: number;
  max_allowed: number;
  period: string;
  usage_percent: number;
}

export interface PlatformUsageDetail {
  [resourceType: string]: PlatformResourceMetrics;
}

export interface PlatformLimitUpdate {
  organization_id: string;
  resource_type: string;
  max_allowed: number;
}
