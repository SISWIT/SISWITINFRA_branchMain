import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { SystemHealthOverview, BackgroundJobRow } from "../types";

export async function getSystemHealth(): Promise<SystemHealthOverview> {
  // Execute parallel count queries for job statuses
  const countsPromise = Promise.all([
    supabase.from("background_jobs").select("id", { count: "exact", head: true }).eq("status", "queued"),
    supabase.from("background_jobs").select("id", { count: "exact", head: true }).eq("status", "processing"),
    supabase.from("background_jobs").select("id", { count: "exact", head: true }).eq("status", "failed"),
    supabase.from("background_jobs").select("id", { count: "exact", head: true }).eq("status", "succeeded"),
  ]);

  // Fetch recent failed jobs
  const failedJobsQuery = supabase
    .from("background_jobs")
    .select(`
      id,
      job_type,
      status,
      priority,
      attempts,
      max_attempts,
      last_error,
      created_at,
      finished_at,
      organization:organizations(name, slug)
    `)
    .eq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(20);

  const [[queuedResult, processingResult, failedResult, succeededResult], recentFailedResult] = await Promise.all([
    countsPromise,
    failedJobsQuery,
  ]);

  // Handle any potential errors
  if (queuedResult.error) throw normalizePlatformError(queuedResult.error);
  if (processingResult.error) throw normalizePlatformError(processingResult.error);
  if (failedResult.error) throw normalizePlatformError(failedResult.error);
  if (succeededResult.error) throw normalizePlatformError(succeededResult.error);
  if (recentFailedResult.error) throw normalizePlatformError(recentFailedResult.error);

  const queued = queuedResult.count || 0;
  const processing = processingResult.count || 0;
  const failed = failedResult.count || 0;
  const succeeded = succeededResult.count || 0;

  const recentFailedJobs: BackgroundJobRow[] = (recentFailedResult.data || []).map((row: any) => {
    const orgRaw = row.organization;
    const org = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw;
    
    return {
      ...row,
      organization: org ? { name: org.name, slug: org.slug } : null,
    };
  });

  return {
    jobStats: {
      queued,
      processing,
      failed,
      succeeded,
      total: queued + processing + failed + succeeded,
    },
    recentFailedJobs,
  };
}
