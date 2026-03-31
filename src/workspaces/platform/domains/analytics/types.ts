export interface PlatformOverview {
  total_organizations: number;
  active_organizations: number;
  trial_organizations: number;
  total_users: number;
  estimated_mrr: number;
  failed_jobs_count: number;
  recent_suspicious_activity_count: number;
}

export interface PlatformActivityEvent {
  id: string;
  action: string;
  actor_name: string;
  actor_email: string;
  target_id: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlatformDomainEventRow {
  id: string;
  event_type: string;
  organization_id: string | null;
  actor_user_id: string | null;
  target_entity_type: string | null;
  target_entity_id: string | null;
  payload: any;
  created_at: string;
  processed_at: string | null;
}

export interface AnalyticsOverview {
  totalEvents: number;
  recentActiveOrgs: number;
  eventsByType: { type: string; count: number }[];
  dailyActiveOrgs: { date: string; count: number }[];
}
