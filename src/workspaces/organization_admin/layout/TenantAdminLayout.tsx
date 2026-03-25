import { ReactNode, useState } from "react";
import { Outlet } from "react-router-dom";
import {
  Menu,
  X,
  Bell,
  Search,
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { useAuth } from "@/core/auth/useAuth";
import { useTenant } from "@/core/tenant/useTenant";
import { AdminSidebar } from "../components/AdminSidebar";
import { ImpersonationBanner } from "@/workspaces/platform/layout/ImpersonationBanner";
import { isTenantUserRole } from "@/core/types/roles";
import { DashboardLayout } from "@/workspaces/employee/layout/DashboardLayout";

interface TenantAdminLayoutProps {
  children?: ReactNode;
}

export function TenantAdminLayout({ children }: TenantAdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, role } = useAuth();
  const { tenant } = useTenant();

  // If the user is a regular employee, redirect to their layout
  if (isTenantUserRole(role)) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <AdminSidebar
        className="hidden lg:flex"
        collapsed={collapsed}
        onCollapseToggle={() => setCollapsed((current) => !current)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ImpersonationBanner />
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-border/60 bg-card/50 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>Organizations</span>
              <span className="text-border">/</span>
              <span className="text-foreground">{tenant?.name || "Admin"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Global search..." 
                className="h-9 w-64 bg-muted/40 border-border/40 rounded-xl pl-9 text-xs focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-xl">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </Button>
            <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block" />
            <div className="flex items-center gap-3 pl-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold">{user?.email?.split('@')[0]}</span>
                <span className="text-[10px] text-muted-foreground capitalize">{role || "Admin"}</span>
              </div>
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-xs font-bold text-primary">
                  {user?.email?.[0].toUpperCase() || "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-muted/20">
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
