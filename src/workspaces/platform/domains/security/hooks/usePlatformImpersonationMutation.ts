import { useMutation, useQueryClient } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { forceEndImpersonation } from "../api/forceEndImpersonation";
import { toast } from "sonner";

export function usePlatformImpersonationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => forceEndImpersonation(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.security.stats() });
      toast.success("Session Terminated", { description: "The active impersonation session was forcefully ended." });
    },
    onError: (error: any) => {
      toast.error("Termination Failed", { description: error.message });
    },
  });
}
