export type AuthPersistenceMode = "local" | "session";

const AUTH_PERSISTENCE_PREFERENCE_KEY = "siswit.auth.persistence";
const DEFAULT_AUTH_PERSISTENCE_MODE: AuthPersistenceMode = "local";

type WebStorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

type SupabaseStorageLike = WebStorageLike & {
  isServer?: boolean;
};

function getStorage(mode: AuthPersistenceMode): WebStorageLike | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return mode === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function getPreferredMode(): AuthPersistenceMode {
  const preferenceStorage = getStorage("local");
  const storedMode = preferenceStorage?.getItem(AUTH_PERSISTENCE_PREFERENCE_KEY);

  return storedMode === "session" ? "session" : DEFAULT_AUTH_PERSISTENCE_MODE;
}

function getPrimaryAndSecondaryStorage(): [WebStorageLike | null, WebStorageLike | null] {
  const preferredMode = getPreferredMode();
  const primary = getStorage(preferredMode);
  const secondary = getStorage(preferredMode === "local" ? "session" : "local");

  return [primary, secondary];
}

export function getRememberMeDefault(): boolean {
  return getPreferredMode() === "local";
}

export function setAuthPersistenceMode(rememberMe: boolean): void {
  const preferenceStorage = getStorage("local");
  if (!preferenceStorage) {
    return;
  }

  preferenceStorage.setItem(
    AUTH_PERSISTENCE_PREFERENCE_KEY,
    rememberMe ? "local" : "session",
  );
}

export const authSessionStorage: SupabaseStorageLike = {
  isServer: false,
  getItem(key) {
    const [primary, secondary] = getPrimaryAndSecondaryStorage();
    const primaryValue = primary?.getItem(key);

    if (primaryValue !== null && primaryValue !== undefined) {
      return primaryValue;
    }

    // Fallback: migrate from old store to current preferred store
    const secondaryValue = secondary?.getItem(key) ?? null;
    if (secondaryValue !== null && primary) {
      primary.setItem(key, secondaryValue);
      secondary?.removeItem(key);
    }
    return secondaryValue;
  },
  setItem(key, value) {
    const [primary, secondary] = getPrimaryAndSecondaryStorage();
    primary?.setItem(key, value);
    // Always clean the other store to prevent ghost sessions
    secondary?.removeItem(key);
  },
  removeItem(key) {
    getStorage("local")?.removeItem(key);
    getStorage("session")?.removeItem(key);
  },
};
