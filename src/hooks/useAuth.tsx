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
  AuthError,
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
  if (role === "user" || role === "employee" || role === "admin") {
    return role as AppRole;
  }
  return null;
};

/* simple timeout helper used for database calls */
const timeout = (ms: number) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), ms)
  );

/* key used to cache role data in local storage */
const ROLE_CACHE_KEY = "auth_role_cache";

/* PROVIDER */

export function AuthProvider({ children }: { children: ReactNode }) {
  /* state that holds auth and role info */
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  /* fetch role and approval status from database or cache */
  const fetchRoleAndApproval = async (userId: string) => {
    try {
      /* first check if role is already cached locally */
      const cached = localStorage.getItem(ROLE_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.userId === userId) {
          setRole(parsed.role);
          setIsApproved(parsed.approved);
          return;
        }
      }

      /* fetch role from supabase */
      const rolePromise = supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .single();

      const response = (await Promise.race([
        rolePromise,
        timeout(10000),
      ])) as PostgrestSingleResponse<
        Database["public"]["Tables"]["user_roles"]["Row"]
      >;

      const { data, error } = response;

      /* fallback to default user role if anything fails */
      if (error || !data) {
        setRole(AppRole.USER);
        setIsApproved(true);
        return;
      }

      /* map database role into app role */
      const mapped = mapRole(data.role);
      const finalRole = mapped ?? AppRole.USER;

      /* employees require approval, others do not */
      const finalApproved =
        mapped === AppRole.EMPLOYEE ? data.approved : true;

      setRole(finalRole);
      setIsApproved(finalApproved);

      /* store result in local cache */
      localStorage.setItem(
        ROLE_CACHE_KEY,
        JSON.stringify({
          userId,
          role: data.role,
          approved: data.approved,
        })
      );
    } catch (err) {
      /* fallback to safe defaults on error */
      setRole(AppRole.USER);
      setIsApproved(true);
    }
  };

  /* initialize auth state on first load */
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setLoading(true);

      try {
        /* get existing session from supabase */
        const { data } = await supabase.auth.getSession();

        if (!mounted) return;

        const session = data.session;

        setSession(session);
        setUser(session?.user ?? null);

        /* fetch role if user exists */
        if (session?.user) {
          await fetchRoleAndApproval(session.user.id);
        }
      } catch (err) {
        /* reset everything on failure */
        setSession(null);
        setUser(null);
        setRole(null);
        setIsApproved(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    /* listen to auth changes like login or logout */
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        /* when user logs out, clear all stored data */
        if (event === "SIGNED_OUT") {
          setRole(null);
          setIsApproved(null);
          localStorage.removeItem(ROLE_CACHE_KEY);
          return;
        }

        /* when user logs in, fetch role again */
        if (session?.user) {
          setLoading(true);
          await fetchRoleAndApproval(session.user.id);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  /* AUTH ACTIONS */

  /* register a new user */
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

  /* login existing user */
  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error || !data.user) {
        return { data: null, error: error as Error };
      }

      /* fetch role for logged in user */
      const roleRes = await supabase
        .from("user_roles")
        .select("role, approved")
        .eq("user_id", data.user.id)
        .maybeSingle();

      const roleData = roleRes.data;

      const mappedRole = mapRole(roleData?.role ?? null);
      const finalRole = mappedRole ?? AppRole.USER;

      /* prevent employee login if not approved */
      if (finalRole === AppRole.EMPLOYEE && !roleData?.approved) {
        await supabase.auth.signOut();
        return {
          data: null,
          error: new Error("Your account is pending admin approval."),
        };
      }

      setRole(finalRole);
      setIsApproved(roleData?.approved ?? true);

      return {
        data: { role: finalRole, isApproved: roleData?.approved ?? true },
        error: null,
      };
    } catch (err) {
      return { data: null, error: err as Error };
    }
  };

  /* logout user and clear all state */
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
    setIsApproved(null);
    localStorage.removeItem(ROLE_CACHE_KEY);
  };

  /* provide auth state to entire app */
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

/* HOOK TO USE AUTH CONTEXT */

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
