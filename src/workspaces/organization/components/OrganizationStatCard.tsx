import { ArrowUpRight, LucideIcon } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

interface OrganizationStatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: LucideIcon;
  trend?: string;
  className?: string;
}

export function OrganizationStatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon,
  trend,
  className 
}: OrganizationStatCardProps) {
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || "var(--primary)";

  return (
    <article 
      className={cn(
        "group relative overflow-hidden p-6 rounded-[2rem] border border-border bg-card/70 backdrop-blur-md shadow-xl transition-all duration-500 hover:shadow-2xl hover:-translate-y-1",
        className
      )}
    >
      <div 
        className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-[60px] opacity-10 transition-opacity group-hover:opacity-20 pointer-events-none"
        style={{ backgroundColor: primaryColor }}
      />

      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-extrabold tracking-tight">{value}</h3>
            {trend && (
              <span 
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `color-mix(in srgb, ${primaryColor}, transparent 80%)`, color: primaryColor }}
              >
                {trend}
              </span>
            )}
          </div>
        </div>
        <div 
          className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3"
          style={{ backgroundColor: `color-mix(in srgb, ${primaryColor}, transparent 85%)`, color: primaryColor }}
        >
          {Icon ? <Icon className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
        </div>
      </div>
      
      <p className="mt-4 text-xs font-medium text-muted-foreground/80 leading-relaxed">
        {subtitle}
      </p>
    </article>
  );
}
