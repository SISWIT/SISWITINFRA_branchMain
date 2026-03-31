import { useMutation, useQueryClient } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { requeueFailedJobs } from "../api/requeueFailedJobs";
import { toast } from "sonner";

export function usePlatformJobMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobIds, reason }: { jobIds: string[], reason: string }) => 
      requeueFailedJobs(jobIds, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: platformKeys.health.stats() });
      toast.success("Jobs Requeued", { description: `${variables.jobIds.length} job(s) sent back to the queue.` });
    },
    onError: (error: any) => {
      toast.error("Requeue Failed", { description: error.message });
    },
  });
}
