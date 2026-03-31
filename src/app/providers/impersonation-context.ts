import { createContext } from "react";

export const IMPERSONATION_STORAGE_KEY = "siswit_impersonation_state";

export interface ImpersonationState {
  active: boolean;
  sessionId: string | null;
  /** Canonical organization ID — preferred over tenantId. */
  organizationId: string | null;
  /** Canonical organization slug — preferred over tenantSlug. */
  organizationSlug: string | null;
  /** @deprecated Use organizationId. Kept for backward compatibility. */
  tenantId: string | null;
  /** @deprecated Use organizationSlug. Kept for backward compatibility. */
  tenantSlug: string | null;
  startedAt: string | null;
  reason?: string | null;
}

export interface StartImpersonationInput {
  /** Canonical organization ID — required. */
  organizationId: string;
  /** Canonical organization slug — required. */
  organizationSlug: string;
  /** @deprecated Use organizationId. Accepted for backward compatibility. */
  tenantId?: string;
  /** @deprecated Use organizationSlug. Accepted for backward compatibility. */
  tenantSlug?: string;
  /** Reason for impersonation — required by platform policy. */
  reason: string;
}

export interface ImpersonationContextType {
  state: ImpersonationState;
  startImpersonation: (input: StartImpersonationInput) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export const defaultImpersonationState: ImpersonationState = {
  active: false,
  sessionId: null,
  organizationId: null,
  organizationSlug: null,
  tenantId: null,
  tenantSlug: null,
  startedAt: null,
  reason: null,
};

export const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);
