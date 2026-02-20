"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  Session,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/roles";
import { Database } from "@/integrations/supabase/types";

/* TYPES */

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isApproved: boolean | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    signupType: "employee" | "customer"
  ) => Promise<{ error: Error | null }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{
    data: { role: AppRole; isApproved: boolean } | null;
    error: Error | null;
  }>;
  signOut: () => Promise<void>;
}

/* CONTEXT */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* HELPERS */

const mapRole = (role: string | null): AppRole | null => {
  if (!role) return null;
  // Ensure the string matches the AppRole enum/type exactly
  const validRoles = ["user", "employee", "admin"];
  if (validRoles.includes(role)) {
    return role as AppRole;
  }
  return null;
};

const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );

const ROLE_CACHE_KEY = "auth_role_cache";

/* PROVIDER */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Helper to fetch role data. 
   * Returns the data so signIn() can use it for validation 
   * while also updating the internal state.
   */
  const fetchRoleAndApproval = async (userId: string) => {
    try {
      // 1. Check Cache
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.userId === userId) {
          setRole(parsed.role);
          setIsApproved(parsed.approved);
          return { role: parsed.role as AppRole, approved: parsed.approved as boolean };
        }
      }

      // 2. Fetch from DB
      const rolePromise = supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const response = (await Promise.race([
        rolePromise,
        timeout(10000),
      ])) as PostgrestSingleResponse<
        Database["public"]["Tables"]["user_roles"]["Row"]
      >;

      const { data, error } = response;

      // Default fallback
      if (error || !data) {
        setRole(AppRole.USER);
        setIsApproved(true);
        return { role: AppRole.USER, approved: true };
      }

      const mapped = mapRole(data.role);
      const finalRole = mapped ?? AppRole.USER;
      const finalApproved = mapped === AppRole.EMPLOYEE ? data.approved : true;

      // Update State
      setRole(finalRole);
      setIsApproved(finalApproved);

      // Update Cache
      localStorage.setItem(
        ROLE_CACHE_KEY,
        JSON.stringify({
          userId,
          role: finalRole,
          approved: finalApproved,
        })
      );

      return { role: finalRole, approved: finalApproved };
    } catch (err) {
      setRole(AppRole.USER);
      setIsApproved(true);
      return { role: AppRole.USER, approved: true };
    }
  };

  /* INITIALIZATION & LISTENER */
  useEffect(() => {
    let mounted = true;
    // Track if we've already initialized to prevent double initialization
    let initialized = false;

    const init = async () => {
      if (initialized) return;
      initialized = true;
      
      setLoading(true);
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const currentSession = data.session;
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await fetchRoleAndApproval(currentSession.user.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (event === "SIGNED_OUT") {
          setRole(null);
          setIsApproved(null);
          localStorage.removeItem(ROLE_CACHE_KEY);
          // Reset initialized flag so next sign-in works properly
          initialized = false;
          setLoading(false);
        } 
        else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          if (currentSession?.user) {
            // Only set loading if we don't have a role yet
            const currentRole = role;
            if (!currentRole) setLoading(true);
            await fetchRoleAndApproval(currentSession.user.id);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array - effect runs once on mount, prevents infinite loop

  /* AUTH ACTIONS */

  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    signupType: "employee" | "customer"
  ) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            signup_type: signupType,
          },
        },
      });
      return { error: error as Error | null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Step 1: Attempt Login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return { data: null, error: error as Error };
      }

      // Step 2: Fetch permissions immediately for validation
      // We don't set state here manually; fetchRoleAndApproval handles the update
      // and onAuthStateChange will also trigger, but fetchRoleAndApproval's cache logic
      // prevents redundant DB hits.
      const { role: finalRole, approved } = await fetchRoleAndApproval(data.user.id);

      // Step 3: Business Logic Validation (Approval Check)
      if (finalRole === AppRole.EMPLOYEE && !approved) {
        await supabase.auth.signOut();
        return {
          data: null,
          error: new Error("Your account is pending admin approval."),
        };
      }

      return {
        data: { role: finalRole, isApproved: approved },
        error: null,
      };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  const signOut = async () => {
    // The onAuthStateChange listener "SIGNED_OUT" block handles state cleanup
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isApproved,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};