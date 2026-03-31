export interface BackgroundJobRow {
  id: string;
  job_type: string;
  status: "queued" | "processing" | "failed" | "succeeded" | "cancelled" | string;
  priority: number;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  created_at: string;
  finished_at: string | null;
  organization?: {
    name: string;
    slug: string;
  } | null;
}

export interface SystemHealthOverview {
  jobStats: {
    queued: number;
    processing: number;
    failed: number;
    succeeded: number;
    total: number;
  };
  recentFailedJobs: BackgroundJobRow[];
}
