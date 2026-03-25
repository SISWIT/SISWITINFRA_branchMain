import { BarChart3 } from "lucide-react";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

interface TrendPoint {
  day: string;
  invites: number;
  approvals: number;
}

interface OrganizationAnalyticsCardProps {
  data: TrendPoint[];
}

export function OrganizationAnalyticsCard({ data }: OrganizationAnalyticsCardProps) {
  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || "var(--primary)";
  const max = Math.max(1, ...data.map((entry) => Math.max(entry.invites, entry.approvals)));

  return (
    <section className="p-6 h-full bg-card/40 backdrop-blur-md rounded-3xl border border-border/40 shadow-xl">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold tracking-tight">Invite Analytics</h3>
          <p className="text-sm text-muted-foreground font-medium mt-1">Activity over the last 7 days</p>
        </div>
        <div 
          className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
        >
          <BarChart3 className="h-6 w-6" />
        </div>
      </div>

      <div className="grid grid-cols-7 items-end gap-3 h-40">
        {data.map((entry) => {
          const inviteHeight = Math.max(15, Math.round((entry.invites / max) * 100));
          const approvalHeight = Math.max(15, Math.round((entry.approvals / max) * 100));

          return (
            <div key={entry.day} className="h-full flex flex-col justify-end space-y-3">
              <div className="flex items-end justify-center gap-2 h-full">
                <div
                  className="w-4 rounded-t-lg transition-all duration-500 hover:brightness-125 shadow-lg relative overflow-hidden group/bar"
                  style={{ 
                    height: `${approvalHeight}%`, 
                    background: `linear-gradient(to top, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.8))` 
                  }}
                  title={`${entry.approvals} approvals`}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />
                </div>
                <div
                  className="w-4 rounded-t-lg transition-all duration-500 hover:brightness-125 shadow-lg relative overflow-hidden group/bar"
                  style={{ 
                    height: `${inviteHeight}%`, 
                    background: `linear-gradient(to top, color-mix(in srgb, ${primaryColor === 'var(--primary)' ? '#3b82f6' : primaryColor}, transparent 20%), #6ad0ff)` 
                  }}
                  title={`${entry.invites} invites`}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/60" />
                  <div 
                    className="absolute inset-0 blur-md opacity-20 pointer-events-none"
                    style={{ backgroundColor: primaryColor === 'var(--primary)' ? '#3b82f6' : primaryColor }}
                  />
                </div>
              </div>
              <p className="text-center font-bold text-[10px] uppercase tracking-wider text-muted-foreground/60">{entry.day}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-border/20 flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: `linear-gradient(to top, ${primaryColor === 'var(--primary)' ? '#3b82f6' : primaryColor}, white)` }} />
          <span>New Invites</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full" style={{ background: `linear-gradient(to top, color-mix(in srgb, ${primaryColor}, #3b82f6 30%), white)` }} />
          <span>Approvals</span>
        </div>
      </div>
    </section>
  );
}
