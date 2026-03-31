export type PlatformCapability =
  | "platform.organizations.read"
  | "platform.organizations.write"
  | "platform.organizations.suspend"
  | "platform.users.read"
  | "platform.users.write"
  | "platform.billing.read"
  | "platform.billing.write"
  | "platform.audit.read"
  | "platform.security.read"
  | "platform.settings.write"
  | "platform.impersonation.start";

export const DEFAULT_PLATFORM_CAPABILITIES: Set<PlatformCapability> = new Set([
  "platform.organizations.read",
  "platform.organizations.write",
  "platform.organizations.suspend",
  "platform.users.read",
  "platform.users.write",
  "platform.billing.read",
  "platform.billing.write",
  "platform.audit.read",
  "platform.security.read",
  "platform.settings.write",
  "platform.impersonation.start",
]);
