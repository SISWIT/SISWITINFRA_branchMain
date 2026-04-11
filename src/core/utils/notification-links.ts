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

const INTERNAL_APP_LINK_PATTERN = /^\/([^/]+)\/app(?:\/|$)/i;
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
