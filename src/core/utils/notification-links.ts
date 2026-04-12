import type { NotificationType } from "@/core/types/notifications";

interface NotificationLinkMembershipLike {
  organization_id?: string | null;
  tenant_id?: string | null;
  organization?: { slug?: string | null } | null;
  tenant?: { slug?: string | null } | null;
}

interface ResolveNotificationLinkOptions {
  link?: string | null;
  notificationOrganizationId?: string | null;
  activeTenantSlug?: string | null;
  memberships?: NotificationLinkMembershipLike[];
}

interface ResolveNotificationNavigationTargetOptions extends ResolveNotificationLinkOptions {
  role?: string | null;
  currentPathname?: string | null;
  notificationType?: NotificationType | null;
}

interface ResolveNotificationHistoryRouteOptions {
  role?: string | null;
  currentPathname?: string | null;
  activeTenantSlug?: string | null;
}

const INTERNAL_APP_LINK_PATTERN = /^\/([^/]+)\/app(?:\/|$)/i;
const TENANT_APP_LINK_PATTERN = /^\/[^/]+\/app(?:\/(.*))?$/i;
const TENANT_PORTAL_PATH_PATTERN = /^\/([^/]+)\/app\/portal(?:\/|$)/i;
const PLATFORM_WORKSPACE_PATH_PATTERN = /^\/platform(?:\/|$)/i;
const OWNER_WORKSPACE_PATH_PATTERN = /^\/organization(?:\/|$)/i;
const UUID_SEGMENT_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function extractMembershipSlug(membership: NotificationLinkMembershipLike): string | null {
  const slug =
    membership.organization?.slug ??
    membership.tenant?.slug ??
    null;

  if (!slug) return null;
  const trimmed = slug.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function buildOrganizationIdToSlugMap(
  memberships: NotificationLinkMembershipLike[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();

  for (const membership of memberships ?? []) {
    const organizationId = membership.organization_id ?? membership.tenant_id ?? null;
    const slug = extractMembershipSlug(membership);
    if (!organizationId || !slug) continue;
    map.set(organizationId, slug);
  }

  return map;
}

/**
 * Notification links may be persisted with organization UUIDs
 * (e.g. "/<org-id>/app/..."), while route guards expect slug paths
 * (e.g. "/<org-slug>/app/..."). This normalizes those links.
 */
export function resolveNotificationLink(options: ResolveNotificationLinkOptions): string | undefined {
  const { link, notificationOrganizationId, activeTenantSlug, memberships } = options;
  if (!link) return undefined;

  const match = link.match(INTERNAL_APP_LINK_PATTERN);
  if (!match) return link;

  const routeOrgSegment = match[1];
  if (!UUID_SEGMENT_PATTERN.test(routeOrgSegment)) {
    return link;
  }

  const orgIdToSlugMap = buildOrganizationIdToSlugMap(memberships);
  const replacementSlug =
    (notificationOrganizationId ? orgIdToSlugMap.get(notificationOrganizationId) : undefined) ??
    orgIdToSlugMap.get(routeOrgSegment) ??
    activeTenantSlug ??
    null;

  if (!replacementSlug) {
    return link;
  }

  return link.replace(/^\/[^/]+(?=\/app(?:\/|$))/i, `/${replacementSlug}`);
}

function shouldKeepOwnerInOwnerWorkspace(role?: string | null, currentPathname?: string | null): boolean {
  if (!role || !currentPathname) return false;

  const normalizedRole = role.toLowerCase();
  if (normalizedRole !== "owner" && normalizedRole !== "admin") {
    return false;
  }

  return OWNER_WORKSPACE_PATH_PATTERN.test(currentPathname);
}

function ownerFallbackPathByNotificationType(notificationType?: NotificationType | null): string {
  switch (notificationType) {
    case "member_joined":
      return "/organization/users";
    case "plan_limit_warning":
    case "plan_limit_reached":
    case "subscription_created":
    case "subscription_cancelled":
    case "plan_upgraded":
    case "plan_downgraded":
    case "payment_success":
    case "payment_failed":
    case "trial_started":
    case "trial_ended":
      return "/organization/subscription";
    default:
      return "/organization/alerts";
  }
}

function mapTenantAppLinkToOwnerPath(link: string, notificationType?: NotificationType | null): string {
  const match = link.match(TENANT_APP_LINK_PATTERN);
  if (!match) return link;

  const normalizedSuffix = (match[1] ?? "").trim().toLowerCase();
  if (!normalizedSuffix || normalizedSuffix === "dashboard" || normalizedSuffix.startsWith("dashboard/")) {
    return "/organization/overview";
  }

  if (normalizedSuffix === "users" || normalizedSuffix.startsWith("users/")) {
    return "/organization/users";
  }
  if (normalizedSuffix === "invitations" || normalizedSuffix.startsWith("invitations/")) {
    return "/organization/invitations";
  }
  if (normalizedSuffix === "approvals" || normalizedSuffix.startsWith("approvals/")) {
    return "/organization/approvals";
  }
  if (
    normalizedSuffix === "subscription" ||
    normalizedSuffix.startsWith("subscription/") ||
    normalizedSuffix === "plans" ||
    normalizedSuffix.startsWith("plans/") ||
    normalizedSuffix === "billing" ||
    normalizedSuffix.startsWith("billing/")
  ) {
    return "/organization/subscription";
  }
  if (normalizedSuffix === "alerts" || normalizedSuffix.startsWith("alerts/")) {
    return "/organization/alerts";
  }
  if (normalizedSuffix === "settings" || normalizedSuffix.startsWith("settings/")) {
    return "/organization/settings";
  }

  return ownerFallbackPathByNotificationType(notificationType);
}

/**
 * Resolves where the bell "View all history" action should navigate for
 * the current workspace context.
 */
export function resolveNotificationHistoryRoute(
  options: ResolveNotificationHistoryRouteOptions,
): string {
  const { role, currentPathname, activeTenantSlug } = options;
  const pathname = currentPathname ?? "";

  if (OWNER_WORKSPACE_PATH_PATTERN.test(pathname)) {
    return "/organization/notifications";
  }

  if (PLATFORM_WORKSPACE_PATH_PATTERN.test(pathname)) {
    return "/platform/notifications";
  }

  const portalMatch = pathname.match(TENANT_PORTAL_PATH_PATTERN);
  if (portalMatch?.[1]) {
    return `/${portalMatch[1]}/app/portal/notifications`;
  }

  const tenantAppMatch = pathname.match(TENANT_APP_LINK_PATTERN);
  if (tenantAppMatch?.[0]) {
    const slugMatch = pathname.match(/^\/([^/]+)\/app(?:\/|$)/i);
    const slug = slugMatch?.[1];
    if (slug) return `/${slug}/app/notifications`;
  }

  if (activeTenantSlug) {
    return `/${activeTenantSlug}/app/notifications`;
  }

  const normalizedRole = role?.toLowerCase();
  if (normalizedRole === "platform_super_admin" || normalizedRole === "platform_admin") {
    return "/platform/notifications";
  }

  return "/organization/notifications";
}

/**
 * Resolves the clickable destination for notification actions.
 *
 * Rules:
 * - Normalize legacy UUID tenant links to slug routes.
 * - If owner/admin is currently inside /organization, keep navigation
 *   inside owner workspace instead of jumping into /:tenantSlug/app.
 */
export function resolveNotificationNavigationTarget(
  options: ResolveNotificationNavigationTargetOptions,
): string | undefined {
  const { role, currentPathname, notificationType, ...linkOptions } = options;
  const normalizedLink = resolveNotificationLink(linkOptions);
  if (!normalizedLink) return undefined;

  if (!shouldKeepOwnerInOwnerWorkspace(role, currentPathname)) {
    return normalizedLink;
  }

  if (!TENANT_APP_LINK_PATTERN.test(normalizedLink)) {
    return normalizedLink;
  }

  return mapTenantAppLinkToOwnerPath(normalizedLink, notificationType);
}
