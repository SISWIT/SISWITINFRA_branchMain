const clean = (value: string) => value.replace(/^\/+|\/+$/g, "");

export const RESERVED_ROOT_SEGMENTS = new Set([
  "platform",
  "organization",
  "auth",
  "products",
  "solutions",
  "pricing",
  "about",
  "contact",
  "unauthorized",
  "pending-approval",
  "favicon.ico",
  "robots.txt",
]);

export const isReservedRootSegment = (value: string | undefined): boolean => {
  if (!value) return true;
  return RESERVED_ROOT_SEGMENTS.has(value.toLowerCase());
};

export const platformPath = (path = ""): string => {
  const suffix = clean(path);
  return suffix ? `/platform/${suffix}` : "/platform";
};

export const organizationOwnerPath = (path = ""): string => {
  const suffix = clean(path);
  return suffix ? `/organization/${suffix}` : "/organization";
};

export const organizationNotificationsPath = (): string => organizationOwnerPath("notifications");

export const organizationAppPath = (organizationSlug: string, path = ""): string => {
  const slug = clean(organizationSlug);
  const suffix = clean(path);
  if (!slug) return "/";
  return suffix ? `/${slug}/app/${suffix}` : `/${slug}/app`;
};

export const organizationDashboardPath = (organizationSlug: string): string =>
  organizationAppPath(organizationSlug, "dashboard");

export const organizationPortalPath = (organizationSlug: string, path = ""): string =>
  organizationAppPath(organizationSlug, clean(`portal/${path}`));

export const organizationWorkspaceNotificationsPath = (organizationSlug: string): string =>
  organizationAppPath(organizationSlug, "notifications");

export const organizationPortalNotificationsPath = (organizationSlug: string): string =>
  organizationPortalPath(organizationSlug, "notifications");

export const organizationModulePath = (
  organizationSlug: string,
  module: "crm" | "cpq" | "clm" | "erp" | "documents",
  path = "",
): string => organizationAppPath(organizationSlug, clean(`${module}/${path}`));

export const normalizeLegacyDashboardPath = (organizationSlug: string, rest = ""): string => {
  const cleanRest = clean(rest);
  if (!cleanRest) return organizationDashboardPath(organizationSlug);
  if (cleanRest === "dashboard") return organizationDashboardPath(organizationSlug);
  if (cleanRest.startsWith("dashboard/")) {
    const nested = cleanRest.slice("dashboard/".length);
    return organizationAppPath(organizationSlug, nested);
  }
  return organizationAppPath(organizationSlug, cleanRest);
};

// Legacy aliases for existing code paths during migration.
export const tenantAppPath = organizationAppPath;
export const tenantDashboardPath = organizationDashboardPath;
export const tenantPortalPath = organizationPortalPath;
export const tenantModulePath = organizationModulePath;
export const tenantNotificationsPath = organizationWorkspaceNotificationsPath;
export const tenantPortalNotificationsPath = organizationPortalNotificationsPath;

// ---------------------------------------------------------------------------
// Platform admin route helpers
// ---------------------------------------------------------------------------

export const platformOrganizationsPath = (): string => platformPath("organizations");

export const platformOrganizationDetailPath = (id: string): string =>
  platformPath(`organizations/${clean(id)}`);

export const platformUsersPath = (): string => platformPath("users");

export const platformUserDetailPath = (id: string): string =>
  platformPath(`users/${clean(id)}`);

export const platformSubscriptionsPath = (): string => platformPath("subscriptions");

export const platformAuditLogsPath = (): string => platformPath("audit-logs");

export const platformSettingsPath = (): string => platformPath("settings");

export const platformPlansPath = (): string => platformPath("plans");

export const platformModulesPath = (): string => platformPath("modules");

export const platformSecurityPath = (): string => platformPath("security");

export const platformHealthPath = (): string => platformPath("health");

export const platformAnalyticsPath = (): string => platformPath("analytics");

export const platformNotificationsPath = (): string => platformPath("notifications");

