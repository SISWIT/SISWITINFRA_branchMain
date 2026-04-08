import { ReactNode, Suspense, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  X,
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Skeleton } from "@/ui/shadcn/skeleton";
import { useAuth } from "@/core/auth/useAuth";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminTopBar } from "../components/AdminTopBar";
import { ImpersonationBanner } from "@/workspaces/platform/layout/ImpersonationBanner";
import { isTenantUserRole } from "@/core/types/roles";
import { DashboardLayout } from "@/workspaces/employee/layout/DashboardLayout";

interface TenantAdminLayoutProps {
  children?: ReactNode;
}

function AdminRouteContentFallback() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Skeleton className="h-40 rounded-3xl bg-card/70" />
        <Skeleton className="h-40 rounded-3xl bg-card/60" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 rounded-2xl bg-card/60" />
        <Skeleton className="h-28 rounded-2xl bg-card/60" />
        <Skeleton className="h-28 rounded-2xl bg-card/60" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Skeleton className="h-80 rounded-3xl bg-card/60" />
        <div className="space-y-4">
          <Skeleton className="h-32 rounded-2xl bg-card/60" />
          <Skeleton className="h-44 rounded-2xl bg-card/60" />
        </div>
      </div>
    </div>
  );
}

export function TenantAdminLayout({ children }: TenantAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role } = useAuth();
  const { pathname } = useLocation();
  const hasMountedRef = useRef(false);
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }

    setIsRouteTransitioning(true);
    const timeoutId = window.setTimeout(() => setIsRouteTransitioning(false), 220);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  // If the user is a regular employee, redirect to their layout
  if (isTenantUserRole(role)) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <div className="flex h-screen bg-background relative overflow-hidden">
      {/* Marketing-Aligned Purple Atmosphere */}
      <div className="fixed -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none z-0" />
      <div className="fixed -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none z-0" />
      
      {/* Desktop Sidebar */}
      <AdminSidebar
        className="hidden lg:flex"
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed((current) => !current)}
      />

      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background/80 backdrop-blur-3xl">
        <ImpersonationBanner />

        <AdminTopBar onOpenSidebar={() => setMobileMenuOpen(true)} />

        {/* Main Content */}
        <div className="relative flex-1 overflow-hidden">
          <main className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/0">
            <Suspense fallback={<AdminRouteContentFallback />}>
              {children || <Outlet />}
            </Suspense>
          </main>
          {isRouteTransitioning && (
            <div className="pointer-events-none absolute inset-0 z-10 bg-background/20 backdrop-blur-[1px] animate-in fade-in duration-150">
              <div className="absolute inset-x-0 top-0 h-1 bg-primary/15">
                <div className="h-full w-1/3 animate-pulse bg-primary/70" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-72 bg-card border-r border-border shadow-2xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border/60">
              <span className="font-bold">Menu</span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <AdminSidebar
              collapsed={false}
              onCollapseToggle={() => undefined}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
