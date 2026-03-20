/**
 * Priority for roles when selecting the primary membership.
 * Lower number = higher priority.
 */
export function membershipPriority(role: string): number {
  switch (role.toLowerCase()) {
    case "owner":
      return 1;
    case "admin":
      return 2;
    case "manager":
      return 3;
    case "employee":
      return 4;
    case "client":
      return 5;
    default:
      return 99;
  }
}

export interface BaseMembership {
  id: string;
  role: string;
  created_at?: string | null;
}

/**
 * Selects the primary membership from a list based on role priority,
 * then creation date, then ID as a final tie-breaker.
 */
export function pickMembership<T extends BaseMembership>(rows: T[]): T | null {
  if (!rows.length) return null;

  const sorted = [...rows].sort((a, b) => {
    const roleOrder = membershipPriority(a.role) - membershipPriority(b.role);
    if (roleOrder !== 0) return roleOrder;

    const aCreated = new Date(a.created_at ?? 0).getTime();
    const bCreated = new Date(b.created_at ?? 0).getTime();
    if (aCreated !== bCreated) return aCreated - bCreated;

    return a.id.localeCompare(b.id);
  });

  return sorted[0] ?? null;
}
