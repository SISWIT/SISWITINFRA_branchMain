import { Clock3 } from "lucide-react";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { cn } from "@/core/utils/utils";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  state: string;
}

interface OrganizationActivityCardProps {
  title: string;
  items: ActivityItem[];
}

export function OrganizationActivityCard({ title, items }: OrganizationActivityCardProps) {
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || "var(--primary)";

  const getStateStyles = (state: string) => {
    switch (state.toLowerCase()) {
      case "accepted":
      case "active":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "expired":
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "pending":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-muted text-muted-foreground border-border/40";
    }
  };

  return (
    <section className="p-8 h-full bg-card/60 backdrop-blur-md rounded-[2rem] border border-border shadow-xl">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">{title}</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">Recent timeline activity</p>
        </div>
        <div 
          className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          <Clock3 className="h-6 w-6" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-border/40 bg-background/20 p-10 text-center">
          <p className="text-sm text-muted-foreground font-medium">No recent activity found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-border/20 bg-background/40 p-4 transition-all hover:bg-background/60 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold group-hover:text-primary transition-colors">{item.title}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5">{item.subtitle}</p>
              </div>
              <span className={cn(
                "shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border",
                getStateStyles(item.state)
              )}>
                {item.state}
              </span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
