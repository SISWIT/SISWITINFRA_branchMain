import { useMemo } from "react";
import { 
  ShieldAlert, 
  CreditCard, 
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Info,
  UserPlus,
  Settings,
  FileText
} from "lucide-react";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent } from "@/ui/shadcn/card";
import { useOrganizationAdminDashboard } from "../hooks/useOrganizationAdminDashboard";
import { format } from "date-fns";
import { cn } from "@/core/utils/utils";

export default function OrganizationAlertsPage() {
  const { data: dashboardData, isLoading } = useOrganizationAdminDashboard();

  const alerts = useMemo(() => {
    if (!dashboardData?.lists?.auditLogs) return [];

    return dashboardData.lists.auditLogs.map(log => {
      const action = log.action?.toLowerCase() || "";
      const entity = log.entity_type?.toLowerCase() || "";
      
      let type: "critical" | "warning" | "info" | "success" = "info";
      let icon = Info;

      if (action.includes("deleted") || action.includes("removed")) {
        type = "warning";
        icon = AlertTriangle;
      } else if (action.includes("created") || action.includes("added")) {
        type = "success";
        icon = CheckCircle2;
      } else if (action.includes("failed") || action.includes("error")) {
        type = "critical";
        icon = ShieldAlert;
      }

      if (entity === "user") icon = UserPlus;
      if (entity === "contract") icon = FileText;
      if (entity === "settings") icon = Settings;
      if (entity === "billing") icon = CreditCard;

      return {
        id: log.id,
        type,
        title: log.action?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "System Event",
        description: `Administrative ${log.entity_type} action recorded by the system.`,
        timestamp: log.created_at ? format(new Date(log.created_at), "MMM dd, h:mm a") : "Recently",
        module: log.entity_type?.toUpperCase() || "SYSTEM",
        icon
      };
    });
  }, [dashboardData?.lists?.auditLogs]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "critical": return "border-destructive/40 bg-destructive/10 text-destructive";
      case "warning": return "border-orange-500/40 bg-orange-500/10 text-orange-500";
      case "success": return "border-emerald-500/40 bg-emerald-500/10 text-emerald-500";
      default: return "border-blue-500/40 bg-blue-500/10 text-blue-500";
    }
  };

  const getModuleBadge = (module: string) => {
    switch (module) {
      case "BILLING": return "bg-primary/10 text-primary border-primary/20";
      case "SECURITY": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "SYSTEM": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "CRM": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "USER": return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Alerts</h1>
          <p className="text-muted-foreground">Monitor real-time system health and administrative activities.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 rounded-xl">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </section>

      {alerts.length > 0 ? (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <article 
              key={alert.id}
              className={cn(
                "group relative flex items-start gap-4 p-5 rounded-[1.5rem] border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
                getTypeStyles(alert.type)
              )}
            >
              <div className="mt-1 h-10 w-10 shrink-0 rounded-xl bg-background/50 backdrop-blur-sm flex items-center justify-center shadow-sm">
                <alert.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">{alert.title}</h3>
                    <Badge variant="outline" className={cn("text-[10px] uppercase font-bold px-2 py-0", getModuleBadge(alert.module))}>
                      {alert.module}
                    </Badge>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">{alert.timestamp}</span>
                </div>
                <p className="text-sm opacity-80 leading-relaxed">
                  {alert.description}
                </p>
                <div className="pt-2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                  <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold hover:bg-background/40">
                    View Audit Details
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-10 flex flex-col items-center justify-center text-center">
          <CardContent className="flex flex-col items-center justify-center p-10">
            <div className="bg-muted p-4 rounded-full mb-4">
              <Clock className="h-10 w-10 text-muted-foreground/40" />
            </div>
            <h3 className="font-semibold text-lg">No recent activity</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Real-time alerts will appear here as team members perform administrative actions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
