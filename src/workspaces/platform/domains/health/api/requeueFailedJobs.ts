import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";
import { safeWriteAuditLog } from "@/core/utils/audit";

export async function requeueFailedJobs(jobIds: string[], reason: string): Promise<void> {
  if (!jobIds || jobIds.length === 0) return;

  const { error } = await supabase
    .from("background_jobs")
    .update({
      status: "queued",
      attempts: 0,
      last_error: null,
      locked_by: null,
      locked_at: null,
      updated_at: new Date().toISOString()
    })
    .in("id", jobIds)
    .eq("status", "failed"); // Safety check: only reset jobs that are actually failed

  if (error) {
    throw normalizePlatformError(error);
  }

  // Log the action for platform transparency
  await safeWriteAuditLog({
    action: "jobs.requeued",
    entityType: "background_jobs",
    entityId: jobIds.join(","),
    actorType: "platform_admin",
    metadata: {
      job_ids: jobIds,
      reason,
      count: jobIds.length
    }
  });
}
