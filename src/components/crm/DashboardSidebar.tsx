import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  Target,
  Calendar,
  FileText,
  FileSignature,
  Package,
  Settings,
  ChevronLeft,
  ChevronRight,
  FileStack,
  FilePlus,
  History,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    title: "CRM",
    items: [
      { title: "Leads", icon: Users, path: "/dashboard/crm/leads" },
      { title: "Accounts", icon: Building2, path: "/dashboard/crm/accounts" },
      { title: "Contacts", icon: UserCircle, path: "/dashboard/crm/contacts" },
      { title: "Opportunities", icon: Target, path: "/dashboard/crm/opportunities" },
      { title: "Pipeline", icon: Target, path: "/dashboard/crm/pipeline" },
      { title: "Activities", icon: Calendar, path: "/dashboard/crm/activities" },
    ],
  },
  {
    title: "CPQ",
    items: [
      { title: "Products", icon: Package, path: "/dashboard/cpq/products" },
      { title: "Quotes", icon: FileText, path: "/dashboard/cpq/quotes" },
    ],
  },
  {
    title: "CLM",
    items: [
      { title: "Contracts", icon: FileSignature, path: "/dashboard/clm/contracts" },
      { title: "Templates", icon: FileText, path: "/dashboard/clm/templates" },
    ],
  },
  {
    title: "Documents",
    items: [
      { title: "All Documents", icon: FileStack, path: "/dashboard/documents" },
      { title: "Create Document", icon: FilePlus, path: "/dashboard/documents/create" },
      { title: "Templates", icon: FileText, path: "/dashboard/documents/templates" },
      { title: "History", icon: History, path: "/dashboard/documents/history" },
      { title: "Pending Signatures", icon: Send, path: "/dashboard/documents/pending" },
    ],
  },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setCollapsed(window.innerWidth < 768);
    };

    // Run once on mount
    handleResize();

    // Listen for resize
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);


  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r border-border flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <span className="font-bold text-xl text-gradient">Siriusinfra</span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((section, idx) => (
          <div key={idx} className="mb-4">
            {"path" in section ? (
              <NavLink
                to={section.path}
                end
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )
                }
              >
                <section.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{section.title}</span>}
              </NavLink>
            ) : (
              <>
                {!collapsed && (
                  <h3 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {section.title}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items?.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Settings */}
      <div className="border-t border-border p-2">
        <NavLink
          to="/dashboard/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-4 py-2 rounded-lg transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )
          }
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Settings</span>}
        </NavLink>
      </div>
    </aside>
  );
}