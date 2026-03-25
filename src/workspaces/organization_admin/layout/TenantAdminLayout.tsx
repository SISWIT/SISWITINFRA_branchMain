import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  X,
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { useAuth } from "@/core/auth/useAuth";
import { AdminSidebar } from "../components/AdminSidebar";
import { AdminTopBar } from "../components/AdminTopBar";
import { ImpersonationBanner } from "@/workspaces/platform/layout/ImpersonationBanner";
import { isTenantUserRole } from "@/core/types/roles";
import { DashboardLayout } from "@/workspaces/employee/layout/DashboardLayout";

interface TenantAdminLayoutProps {
  children?: ReactNode;
}

export function TenantAdminLayout({ children }: TenantAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { role } = useAuth();

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

      <div className="flex-1 flex flex-col overflow-hidden relative z-10 bg-background/20 backdrop-blur-3xl">
        <ImpersonationBanner />

        <AdminTopBar onOpenSidebar={() => setMobileMenuOpen(true)} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/0">
          {children || <Outlet />}
        </main>
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
