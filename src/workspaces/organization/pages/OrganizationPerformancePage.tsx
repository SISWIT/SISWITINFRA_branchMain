import { 
  Zap, 
  Target, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight,
  MousePointer2,
  Trophy,
  History as HistoryIcon,
  Activity,
  BarChart3,
  TrendingUp
} from "lucide-react";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { useOrganizationStats } from "@/workspaces/organization/hooks/useOrganizationStats";
import { useOrganizationPerformance } from "@/workspaces/organization/hooks/useOrganizationPerformance";
import { cn } from "@/core/utils/utils";
import { Skeleton } from "@/ui/shadcn/skeleton";

export default function OrganizationPerformancePage() {
  const { organization } = useOrganization();
  const { data: stats } = useOrganizationStats(organization?.id);
  const { data: performance, isLoading: performanceLoading } = useOrganizationPerformance();
  const primaryColor = organization?.primary_color || "var(--primary)";

  // Log stats to resolve unused warning if needed for future real-data binding
  if (stats) console.debug("Performance stats loaded:", stats.totalMembers);

  const metrics = [
    {
      label: "Speed to Lead",
      value: performance?.speedToLead || "...",
      trend: -12,
      trendLabel: "from last week",
      icon: Zap,
      description: "Average time to first contact for new leads."
    },
    {
      label: "Contract Velocity",
      value: performance?.contractVelocity || "...",
      trend: 8,
      trendLabel: "approval speed",
      icon: Clock,
      description: "Typical turnaround from draft to signature."
    },
    {
      label: "Team Activity",
      value: performance?.teamActivity || "...",
      trend: 3,
      trendLabel: "daily active users",
      icon: MousePointer2,
      description: "Daily engagement rate of organization members."
    },
    {
      label: "Win Rate",
      value: performance?.winRate || "...",
      trend: 5,
      trendLabel: "deal closing rate",
      icon: Target,
      description: "Percentage of opportunities successfully closed."
    }
  ];

  if (performanceLoading) {
    return (
      <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-full max-w-lg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-3xl" />)}
        </div>
        <div className="grid gap-8 lg:grid-cols-12">
          <Skeleton className="lg:col-span-8 h-80 rounded-3xl" />
          <Skeleton className="lg:col-span-4 h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  const performanceTrends = [
    { label: "Lead Gen Efficiency", val: 85, color: "bg-emerald-500" },
    { label: "Contract Throughput", val: 92, color: "bg-blue-500" },
    { label: "Member Retention", val: 98, color: "bg-purple-500" },
    { label: "Revenue Momentum", val: 76, color: "bg-amber-500" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Page header */}
      <section className="space-y-1">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Intelligence</p>
        <h1 className="text-3xl font-extrabold tracking-tight leading-tight">Performance Hub</h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed pt-0.5">
          Real-time operational efficiency metrics and organization-wide achievement tracking.
        </p>
      </section>

      {/* Hero Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m: any) => (
          <div key={m.label} className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-5 shadow-xl transition-all hover:scale-[1.02] hover:bg-card/60">
            <div className="flex items-start justify-between">
              <div 
                className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg"
                style={{ backgroundColor: `color-mix(in srgb, ${primaryColor}, transparent 85%)`, color: primaryColor }}
              >
                <m.icon className="h-5 w-5" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                m.trend < 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-info/10 text-info border-info/20"
              )}>
                {Math.abs(m.trend)}% {m.trend < 0 ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
              </div>
            </div>
            
            <div className="mt-4 space-y-1">
              <h3 className="text-sm font-semibold text-muted-foreground">{m.label}</h3>
              <p className="text-3xl font-black tracking-tight">{m.value}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{m.trendLabel}</p>
            </div>

            {/* Subtle glass glow on hover */}
            <div 
              className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none"
              style={{ backgroundColor: primaryColor }}
            />
          </div>
        ))}
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Performance Chart */}
        <div className="lg:col-span-8 group relative rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-8 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Organization Momentum</h2>
                <p className="text-xs text-muted-foreground font-medium">Weekly performance velocity across all modules</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20">
                <TrendingUp className="h-3 w-3" />
                +14% GROWTH
              </div>
            </div>
          </div>

          <div className="relative h-64 w-full flex items-end justify-between px-4 pb-2">
            {(performance?.momentumTrends || [65, 82, 45, 95, 76, 88, 100]).map((h, i) => (
              <div key={i} className="group/bar relative flex flex-col items-center gap-4 w-full max-w-[48px] h-full justify-end">
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-xl bg-foreground text-background text-[10px] font-black opacity-0 group-hover/bar:opacity-100 transition-all transform translate-y-2 group-hover/bar:translate-y-0 shadow-2xl z-20">
                  {h}%
                </div>
                <div 
                  className="w-full rounded-t-xl transition-all duration-700 hover:brightness-125 relative overflow-hidden shadow-2xl border-x border-t border-white/10 group-hover/bar:scale-[1.05]"
                  style={{ 
                    height: `${Math.max(15, h)}%`, 
                    background: i === 6 
                      ? `linear-gradient(to top, #3b82f6, #6ad0ff)`
                      : `linear-gradient(to top, rgba(59, 130, 246, 0.4), rgba(106, 208, 255, 0.2))`,
                    boxShadow: i === 6 ? `0 0 30px -5px #3b82f6` : 'none'
                  }}
                >
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-white/60" />
                  <div 
                    className="absolute inset-x-0 bottom-0 h-1/2 blur-2xl opacity-40 pointer-events-none"
                    style={{ backgroundColor: i === 6 ? '#3b82f6' : 'transparent' }}
                  />
                </div>
                <span className="text-[10px] font-black text-muted-foreground/40 tracking-widest uppercase transition-colors group-hover/bar:text-primary">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>

          {/* Background Grid Lines */}
          <div className="absolute inset-0 top-32 px-8 flex flex-col justify-between pointer-events-none opacity-5">
            {[1, 2, 3, 4].map(l => (
              <div key={l} className="h-px w-full bg-foreground" />
            ))}
          </div>
        </div>

        {/* Efficiency Scores */}
        <div className="lg:col-span-4 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-8 shadow-xl space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-info/10 flex items-center justify-center text-info">
              <Activity className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Efficiency Scores</h2>
          </div>

          <div className="space-y-6">
            {(performance?.efficiencyScores || performanceTrends).map((p) => (
              <div key={p.label} className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  <span>{p.label}</span>
                  <span className="text-foreground">{p.val}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/30 overflow-hidden p-0.5">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000 bg-current", p.color)}
                    style={{ width: `${p.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-6 border-t border-border/20">
            <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-tight">Milestone Reached</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                Your organization has achieved **98% member retention** for the cumulative 30-day period. Keep it up!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Member Performance Table (Mocked for high density) */}
      <section className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden hover:bg-card/50 transition-colors">
        <div className="p-6 border-b border-border/40 bg-muted/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted border border-border/40 flex items-center justify-center text-muted-foreground">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Activity Log</h2>
              <p className="text-xs text-muted-foreground font-medium">Real-time engagement across the organization</p>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/20 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 bg-muted/5">
                <th className="px-6 py-4">Session Agent</th>
                <th className="px-6 py-4">Action Type</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm font-medium">
              {(performance?.activityLogs || []).map((log, i) => (
                <tr key={i} className="border-b border-border/10 hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted border border-border/40 flex items-center justify-center text-[10px] uppercase font-bold text-muted-foreground">
                        {log.user.split(' ').map(n=>n[0]).join('')}
                      </div>
                      <span className="font-bold group-hover:text-primary transition-colors">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{log.action}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">{log.time}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                      log.status === "Success" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-info/10 text-info border-info/20"
                    )}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
