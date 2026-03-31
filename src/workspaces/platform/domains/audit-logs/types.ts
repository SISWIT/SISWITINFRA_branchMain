export interface PlatformAuditLogRow {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata: any;
  created_at: string;
  
  actor_name: string;
  actor_email: string;
  
  organization?: {
    name: string;
    slug: string;
  } | null;
}
