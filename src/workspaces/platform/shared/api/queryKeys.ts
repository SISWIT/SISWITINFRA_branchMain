/**
 * Centralized React Query key factory for the Platform workspace.
 * Prevents key string collisions and enables targeted invalidation.
 */
export const platformKeys = {
  all: ["platform"] as const,

  organizations: {
    all: () => [...platformKeys.all, "organizations"] as const,
    list: (filters: Record<string, string | number | boolean | null>) =>
      [...platformKeys.organizations.all(), "list", filters] as const,
    detail: (id: string) => [...platformKeys.organizations.all(), "detail", id] as const,
    stats: () => [...platformKeys.organizations.all(), "stats"] as const,
  },

  users: {
    all: () => [...platformKeys.all, "users"] as const,
    list: (filters: Record<string, string | number | boolean | null>) =>
      [...platformKeys.users.all(), "list", filters] as const,
    detail: (id: string) => [...platformKeys.users.all(), "detail", id] as const,
    stats: () => [...platformKeys.users.all(), "stats"] as const,
  },

  subscriptions: {
    all: () => [...platformKeys.all, "subscriptions"] as const,
    list: (filters: Record<string, string | number | boolean | null>) =>
      [...platformKeys.subscriptions.all(), "list", filters] as const,
    detail: (id: string) => [...platformKeys.subscriptions.all(), "detail", id] as const,
    usage: (id: string) => [...platformKeys.subscriptions.all(), "usage", id] as const,
    stats: () => [...platformKeys.subscriptions.all(), "stats"] as const,
  },

  auditLogs: {
    all: () => [...platformKeys.all, "audit-logs"] as const,
    list: (filters: Record<string, string | number | boolean | null>) =>
      [...platformKeys.auditLogs.all(), "list", filters] as const,
  },

  health: {
    all: () => [...platformKeys.all, "health"] as const,
    stats: () => [...platformKeys.health.all(), "stats"] as const,
  },

  security: {
    all: () => [...platformKeys.all, "security"] as const,
    stats: () => [...platformKeys.security.all(), "stats"] as const,
    activeSessions: () => [...platformKeys.security.all(), "active-sessions"] as const,
  },

  settings: {
    all: () => [...platformKeys.all, "settings"] as const,
    featureFlags: () => [...platformKeys.settings.all(), "feature-flags"] as const,
  },

  analytics: {
    all: () => [...platformKeys.all, "analytics"] as const,
    stats: () => [...platformKeys.analytics.all(), "stats"] as const,
  },
} as const;
