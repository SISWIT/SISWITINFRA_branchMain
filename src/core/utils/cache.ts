import { QueryClient } from "@tanstack/react-query";

// W-05: shared instance for app-wide query cache
export const queryClient = new QueryClient();

/**
 * Clears all React Query caches.
 * Used during logout to prevent stale data leakage across sessions.
 */
export function clearAllCaches() {
  queryClient.clear();
}
