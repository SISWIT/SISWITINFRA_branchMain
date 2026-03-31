import { useMutation, useQueryClient } from "@tanstack/react-query";
import { platformKeys } from "../../../shared/api/queryKeys";
import { updateOrganizationModules, PlatformModuleUpdate } from "../api/updateOrganizationModules";
import { toast } from "sonner";

export function usePlatformModulesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: PlatformModuleUpdate) => updateOrganizationModules(update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.subscriptions.all() });
      toast.success("Modules Updated", { description: "The organization features have been updated." });
    },
    onError: (error: any) => {
      toast.error("Update Failed", { description: error.message });
    },
  });
}
