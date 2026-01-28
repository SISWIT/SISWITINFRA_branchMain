import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { AppRole } from "@/types/roles";

// TYPES

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;

  signUp: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<{ error: Error | null }>;

  signIn: (
    email: string,
    password: string
  ) => Promise<{
    data: { role: AppRole } | null;
    error: Error | null;
  }>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// PROVIDER

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  // FETCH USER ROLE
  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data?.role) {
      setRole(data.role as AppRole);
    } else {
      setRole(null);
    }
  };

  // AUTH STATE LISTENER + SESSION SAFETY
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchUserRole(session.user.id);
          } else {
            setRole(null);
          }
        } catch (error: any) {
          // THIS is the laptop killer bug fix
          if (error?.code === "session_not_found") {
            console.warn("Session not found. Resetting auth state.");

            await supabase.auth.signOut();

            localStorage.clear();
            sessionStorage.clear();

            if ("indexedDB" in window) {
              const dbs = await indexedDB.databases();
              dbs.forEach((db) => {
                if (db.name) indexedDB.deleteDatabase(db.name);
              });
            }

            window.location.href = "/auth";
          }
        } finally {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // SIGN UP
  const signUp = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    return { error: error as Error | null };
  };

  // SIGN IN (WITH APPROVAL CHECK)
  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      return { data: null, error: error as Error };
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .maybeSingle();

    if (roleError || !roleData) {
      await supabase.auth.signOut();
      return {
        data: null,
        error: new Error(
          "Your account has not been approved by an admin yet."
        ),
      };
    }

    return {
      data: { role: roleData.role as AppRole },
      error: null,
    };
  };

  // SIGN OUT
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRole(null);
  };

  // PROVIDER
  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
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

// HOOK

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AppRole };
