import { useMutation, useQueryClient } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { updateOrganizationLimit } from "../api/updateOrganizationLimit";
import { PlatformLimitUpdate } from "../types";
import { toast } from "sonner";

export function usePlatformLimitMutation(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: PlatformLimitUpdate) => updateOrganizationLimit(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.subscriptions.usage(organizationId) });
      toast.success("Limit Updated", { description: "The resource limit has been updated successfully." });
    },
    onError: (error: any) => {
      toast.error("Update Failed", { description: error.message });
    },
  });
}
