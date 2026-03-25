import { AlertTriangle, BellRing, ShieldAlert, X, Shield } from "lucide-react";
import type { ComponentType } from "react";
import { Button } from "@/ui/shadcn/button";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { cn } from "@/core/utils/utils";
import type { OrganizationOwnerAlert } from "@/workspaces/organization/hooks/useOrganizationOwnerData";

interface OrganizationAlertsPanelProps {
  alerts: OrganizationOwnerAlert[];
  onDismiss?: (alertId: string) => void;
  title?: string;
}

function getAlertConfig(severity: OrganizationOwnerAlert["severity"]): {
  icon: ComponentType<{ className?: string }>;
  color: string;
} {
  switch (severity) {
    case "critical":
      return { icon: ShieldAlert, color: "text-destructive" };
    case "warning":
      return { icon: AlertTriangle, color: "text-amber-500" };
    default:
      return { icon: BellRing, color: "text-blue-500" };
  }
}

export function OrganizationAlertsPanel({ alerts, onDismiss, title = "System Alerts" }: OrganizationAlertsPanelProps) {
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || "var(--primary)";

  return (
    <section className="p-8 h-full bg-card/40 backdrop-blur-md rounded-[2rem] border border-border/40 shadow-xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">Required administrative actions</p>
        </div>
        <div 
          className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          <Shield className="h-6 w-6" />
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-border/40 bg-background/20 p-10 text-center">
          <p className="text-sm text-muted-foreground font-medium">System status is operational.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => {
            const config = getAlertConfig(alert.severity);
            const Icon = config.icon;
            
            return (
              <article
                key={alert.id}
                className="group relative flex items-start gap-4 rounded-2xl border border-border/20 bg-background/40 p-4 transition-all hover:bg-background/60 hover:shadow-md"
              >
                <div className={cn(
                  "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center bg-card shadow-sm border border-border/10",
                  config.color
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold group-hover:text-primary transition-colors">{alert.title}</p>
                  <p className="text-[11px] font-medium text-muted-foreground/80 mt-1 leading-relaxed">{alert.description}</p>
                </div>

                {onDismiss && (
                  <Button
                    onClick={() => onDismiss(alert.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
