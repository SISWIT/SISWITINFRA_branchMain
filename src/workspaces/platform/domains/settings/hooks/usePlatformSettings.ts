import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPlatformSettings } from "../api/getPlatformSettings";
import { getFeatureFlags } from "../api/getFeatureFlags";
import { updatePlatformSetting } from "../api/updatePlatformSetting";
import { updateFeatureFlag } from "../api/updateFeatureFlag";
import { platformKeys } from "../../../shared/api/queryKeys";

export function usePlatformSettings() {
  const queryClient = useQueryClient();

  const settingsQuery = useQuery({
    queryKey: platformKeys.settings.all(),
    queryFn: getPlatformSettings,
  });

  const featureFlagsQuery = useQuery({
    queryKey: platformKeys.settings.featureFlags(),
    queryFn: getFeatureFlags,
  });

  const updateSetting = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updatePlatformSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.settings.all() });
    },
  });

  const toggleFeatureFlag = useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      updateFeatureFlag(key, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: platformKeys.settings.featureFlags() });
    },
  });

  return {
    settings: settingsQuery.data ?? [],
    featureFlags: featureFlagsQuery.data ?? [],
    isSettingsLoading: settingsQuery.isLoading,
    isFlagsLoading: featureFlagsQuery.isLoading,
    settingsError: settingsQuery.error,
    flagsError: featureFlagsQuery.error,
    updateSetting,
    toggleFeatureFlag,
  };
}
