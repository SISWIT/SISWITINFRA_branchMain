import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
  redirectTo?: string;
}

export function ProtectedRoute({ children, allowedRoles, redirectTo = "/auth" }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

// Route guard for employee-only routes
export function EmployeeRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["employee"]}>
      {children}
    </ProtectedRoute>
  );
}

// Route guard for user (client) only routes
export function UserRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      {children}
    </ProtectedRoute>
  );
}
