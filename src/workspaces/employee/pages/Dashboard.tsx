"use client";

import { useEffect, useMemo, useState, ComponentType } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { Button } from "@/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/ui/shadcn/dropdown-menu";
import { useAuth } from "@/core/auth/useAuth";
import { useModuleScope } from "@/core/hooks/useModuleScope";
import { supabase } from "@/core/api/client";
import { useToast } from "@/core/hooks/use-toast";
import { tenantAppPath } from "@/core/utils/routes";
import { Progress } from "@/ui/shadcn/progress";
import {
  Calculator,
  FileText,
  Users,
  TrendingUp,
  Bell,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileStack,
  Boxes,
  Activity,
  Calendar,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* --- TYPES --- */

interface Profile {
  first_name: string | null;
  last_name: string | null;
  company: string | null;
}

interface DbActivity {
  subject: string | null;
  created_at: string | null;
  is_completed: boolean | null;
}

type ActivityStatus = "completed" | "pending" | "failed" | string;

interface Activity {
  title: string;
  time: string;
  status: ActivityStatus;
}

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  progress: number;
  icon: ComponentType<{ className?: string }>;
  color: string;
}

interface QuickAction {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  route: string;
}

const buildDashboardRoutes = (tenantSlug: string) => ({
  NEW_QUOTE: tenantAppPath(tenantSlug, "cpq/quotes/new"),
  NEW_CONTRACT: tenantAppPath(tenantSlug, "clm/contracts"),
  CREATE_DOC: tenantAppPath(tenantSlug, "documents/create"),
  INVENTORY: tenantAppPath(tenantSlug, "erp/inventory"),
  CONTACTS: tenantAppPath(tenantSlug, "crm/contacts"),
  ACTIVITIES: tenantAppPath(tenantSlug, "crm/activities"),
});

const buildQuickActions = (routes: ReturnType<typeof buildDashboardRoutes>): QuickAction[] => [
  {
    icon: Calculator,
    title: "Create Quote",
    description: "Start a new CPQ quote",
    color: "from-primary to-primary/60",
    route: routes.NEW_QUOTE,
  },
  {
    icon: FileText,
    title: "New Contract",
    description: "Draft a new contract",
    color: "from-accent to-accent/60",
    route: routes.NEW_CONTRACT,
  },
  {
    icon: FileStack,
    title: "Create Document",
    description: "Generate a new document",
    color: "from-chart-4 to-chart-4/60",
    route: routes.CREATE_DOC,
  },
  {
    icon: Boxes,
    title: "Update Inventory",
    description: "Manage stock levels",
    color: "from-orange-500 to-orange-500/60",
    route: routes.INVENTORY,
  },
  {
    icon: Users,
    title: "Add Contact",
    description: "Add a new customer",
    color: "from-chart-3 to-chart-3/60",
    route: routes.CONTACTS,
  },
];

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { organizationId } = useModuleScope();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();

  const dashboardRoutes = useMemo(() => buildDashboardRoutes(tenantSlug), [tenantSlug]);
  const quickActions = useMemo(() => buildQuickActions(dashboardRoutes), [dashboardRoutes]);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<Stat[]>([
    { label: "Open Quotes", value: "0", change: "+11%", trend: "up", progress: 65, icon: Calculator, color: "text-blue-400" },
    { label: "Active Contracts", value: "0", change: "+14%", trend: "up", progress: 82, icon: FileText, color: "text-purple-400" },
    { label: "Documents Generated", value: "0", change: "+5%", trend: "up", progress: 45, icon: FileStack, color: "text-emerald-400" },
    { label: "Inventory Value", value: "$0", change: "+2%", trend: "up", progress: 30, icon: Boxes, color: "text-orange-400" },
    { label: "Revenue MTD", value: "0", change: "+5%", trend: "up", progress: 58, icon: TrendingUp, color: "text-indigo-400" },
  ]);

  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [performanceData, setPerformanceData] = useState<{name: string, quotes: number, contracts: number}[]>([]);

  const userId = user?.id;

  useEffect(() => {
    const initializeDashboard = async () => {
      if (!userId || !organizationId) return;
      setDataLoading(true);

      try {
        const [
          profileRes,
          quotesRes,
          contractsRes,
          docsRes,
          invRes,
          revRes,
          activitiesRes,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("first_name, last_name, company")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("quotes")
            .select("id", { count: "exact" })
            .eq("organization_id", organizationId as string)
            .in("status", ["draft", "pending_approval"]),
          supabase
            .from("contracts")
            .select("id", { count: "exact" })
            .eq("organization_id", organizationId as string)
            .not("status", "eq", "expired")
            .neq("status", "cancelled"),
          supabase
            .from("auto_documents")
            .select("id", { count: "exact" })
            .eq("organization_id", organizationId as string),
          supabase.rpc("get_inventory_value"),
          supabase.rpc("get_revenue_mtd" as any, {
            p_start_date: new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            )
              .toISOString()
              .split("T")[0],
            p_end_date: new Date().toISOString().split("T")[0],
            p_org_id: organizationId,
          }),
          supabase
            .from("activities")
            .select("subject, created_at, is_completed")
            .eq("organization_id", organizationId as string)
            .order("created_at", { ascending: false })
            .limit(6) as any,
        ]);

        if (profileRes.data) setProfile(profileRes.data as Profile);

        // --- CALCULATE PERFORMANCE TRENDS ---
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const last6Months = Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          return {
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            label: months[d.getMonth()],
            key: `${d.getFullYear()}-${d.getMonth()}`,
            quotes: 0,
            contracts: 0
          };
        }).reverse();

        // Fetch all quotes and contracts from last 6 months for trend calculation
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString();
        
        const [historicalQuotes, historicalContracts] = await Promise.all([
          supabase
            .from("quotes")
            .select("created_at")
            .eq("organization_id", organizationId as string)
            .gte("created_at", sixMonthsAgo),
          supabase
            .from("contracts")
            .select("created_at")
            .eq("organization_id", organizationId as string)
            .gte("created_at", sixMonthsAgo)
        ]);

        const qData = historicalQuotes.data || [];
        const cData = historicalContracts.data || [];

        const chartAgg = last6Months.map(m => {
          const qCount = qData.filter(q => {
            if (!q.created_at) return false;
            const d = new Date(q.created_at);
            return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
          }).length;
          const cCount = cData.filter(c => {
            if (!c.created_at) return false;
            const d = new Date(c.created_at);
            return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
          }).length;
          return { name: m.label, quotes: qCount, contracts: cCount };
        });

        // Current vs Previous for % Change
        const currentMonth = last6Months[last6Months.length - 1];
        const prevMonth = last6Months[last6Months.length - 2];
        
        const qCurr = qData.filter(q => q.created_at && new Date(q.created_at).getMonth() === currentMonth.monthIndex).length;
        const qPrev = qData.filter(q => q.created_at && new Date(q.created_at).getMonth() === prevMonth.monthIndex).length;
        const qChange = qPrev === 0 ? 100 : Math.round(((qCurr - qPrev) / qPrev) * 100);

        const cCurr = cData.filter(c => c.created_at && new Date(c.created_at).getMonth() === currentMonth.monthIndex).length;
        const cPrev = cData.filter(c => c.created_at && new Date(c.created_at).getMonth() === prevMonth.monthIndex).length;
        const cChange = cPrev === 0 ? 100 : Math.round(((cCurr - cPrev) / cPrev) * 100);

        setPerformanceData(chartAgg.slice(1)); // Show last 6 months on chart

        const inventoryValue = Number((invRes as any).data ?? 0);
        const revenueMTD = Number((revRes as any).data ?? 0);

        setStats((prev) =>
          prev.map((s) => {
            switch (s.label) {
              case "Open Quotes":
                return { 
                  ...s, 
                  value: String(quotesRes.count ?? 0), 
                  change: `${qChange >= 0 ? '+' : ''}${qChange}%`,
                  trend: qChange >= 0 ? "up" : "down",
                  progress: Math.min(100, (quotesRes.count ?? 0) * 10) 
                };
              case "Active Contracts":
                return { 
                  ...s, 
                  value: String(contractsRes.count ?? 0), 
                  change: `${cChange >= 0 ? '+' : ''}${cChange}%`,
                  trend: cChange >= 0 ? "up" : "down",
                  progress: Math.min(100, (contractsRes.count ?? 0) * 12) 
                };
              case "Documents Generated":
                return { ...s, value: String(docsRes.count ?? 0), progress: Math.min(100, (docsRes.count ?? 0) * 5) };
              case "Inventory Value":
                return {
                  ...s,
                  value: `$${inventoryValue.toLocaleString()}`,
                  progress: Math.min(100, (inventoryValue / 100000) * 100),
                };
              case "Revenue MTD":
                return {
                  ...s,
                  value: `$${revenueMTD.toLocaleString()}`,
                  progress: Math.min(100, (revenueMTD / 1000000) * 100),
                };
              default:
                return s;
            }
          })
        );

        const activitiesData = (activitiesRes as any).data as DbActivity[] | null;
        if (activitiesData) {
          setRecentActivity(
            activitiesData.map((a) => ({
              title: a.subject || "No Subject",
              time: a.created_at
                ? new Date(a.created_at).toLocaleString()
                : "Unknown",
              status: a.is_completed ? "completed" : "pending",
            }))
          );
        }
      } catch (err) {
        toast({
          title: "Dashboard error",
          description: "We couldn't refresh your latest business data.",
          variant: "destructive",
        });
      } finally {
        setDataLoading(false);
      }
    };

    initializeDashboard();
  }, [userId, organizationId, toast]);

  if (authLoading || (dataLoading && !profile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const firstName =
    profile?.first_name ||
    user.user_metadata?.first_name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="min-h-screen text-foreground font-sans selection:bg-primary/30 transition-colors duration-300">
      <main className="p-3 md:p-4 max-w-[1500px] mx-auto space-y-4 animate-in fade-in duration-700">
        
        {/* HEADER AREA: Banner + Quick Action Button */}
        <header className="flex flex-col lg:flex-row gap-4">
          {/* Main Banner */}
          <div className="flex-1 relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-primary/10 via-card to-card border border-border/50 p-5 md:p-6 shadow-sm">
            {/* Background Decorative Blob */}
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/10 blur-[80px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full justify-center">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Employer: Command Deck
                </span>
                <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-[9px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Organization Linked
                </span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[9px] uppercase tracking-wider font-semibold text-primary">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  Live Snapshot
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-2">
                Welcome back, <span className="text-primary">{firstName}</span> 👋
              </h1>
              <p className="text-sm md:text-base text-muted-foreground max-w-xl leading-relaxed">
                Your full business pulse is consolidated here, from quote velocity and contract pipeline to document throughput and operational revenue.
              </p>

              <div className="mt-4 flex flex-wrap gap-3 opacity-70">
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" /> Workspace: Employee
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" /> Updated: {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Top Column: Actions & Quick Links */}
          <div className="w-full lg:w-[300px] space-y-3">
            {/* Main Quick Action Card */}
            <div className="rounded-[1.25rem] bg-card border border-border p-4 flex flex-col justify-between h-full shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex -space-x-1.5">
                  <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground shadow-sm">
                    <Users className="w-3 h-3" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary border border-border flex items-center justify-center text-primary-foreground shadow-sm z-10">
                    <Zap className="w-3 h-3" />
                  </div>
                </div>
                <div className="text-[10px] font-medium text-muted-foreground italic">System Ready</div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Platform Hub</h3>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-full text-muted-foreground"
                    onClick={() => navigate(tenantAppPath(tenantSlug, "alerts"))}
                  >
                    <Bell className="w-4 h-4" />
                  </Button>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm font-bold group">
                      <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                      Quick Action
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                    <DropdownMenuLabel>Create New</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {quickActions.map((a) => (
                      <DropdownMenuItem
                        key={a.title}
                        onClick={() => navigate(a.route)}
                        className="cursor-pointer"
                      >
                        <a.icon className="w-4 h-4 mr-2 text-primary" />
                        {a.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {quickActions.slice(0, 3).map((a) => (
                    <button
                      key={a.title}
                      onClick={() => navigate(a.route)}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted border border-transparent hover:border-border transition-all group text-left"
                    >
                      <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{a.title}</span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* BOTTOM CONTENT AREA: Left (Stats + Chart) | Right (Actions + Alerts) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

          {/* LEFT SECTION (Col 8) */}
          <div className="xl:col-span-8 space-y-4">

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {stats.slice(0, 3).map((s, i) => (
                <div key={s.label} className="group relative rounded-xl bg-card border border-border p-3.5 hover:shadow-md transition-all duration-300 overflow-hidden">
                  <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg bg-primary/10 border border-primary/20 ${s.color}`}>
                      <s.icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold tracking-tight">
                        {s.change}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="text-2xl font-bold tracking-tight group-hover:scale-105 transition-transform origin-left duration-300">{s.value}</div>
                      <div className="text-[10px] font-medium text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</div>
                    </div>

                    <div className="space-y-1">
                      <Progress value={s.progress} className="h-1 bg-muted" indicatorClassName="bg-primary opacity-80" />
                      <div className="flex justify-between text-[9px] font-medium text-muted-foreground/50">
                        <span>Monthly Goal</span>
                        <span>{s.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PERFORMANCE CHART */}
            <div className="rounded-[1.25rem] bg-card border border-border p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
                <div>
                  <h2 className="text-base font-bold">Quote & Contract Performance</h2>
                  <p className="text-[11px] text-muted-foreground/70">Tracking business pipeline velocity</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border text-[9px] font-semibold text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" /> Quotes
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted border border-border text-[9px] font-semibold text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Contracts
                  </div>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      dy={8}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="quotes"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorQuotes)"
                    />
                    <Area
                      type="monotone"
                      dataKey="contracts"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorContracts)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION (Col 4) */}
          <div className="xl:col-span-4 space-y-4">

            {/* QUICK ACTIONS VERTICAL LIST */}
            <div className="rounded-[1.25rem] bg-card border border-border p-4 shadow-sm">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-sm font-bold">Quick Actions</h2>
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-[8px] text-muted-foreground border border-border uppercase tracking-tighter">+ 5% Growth</span>
              </div>

              <div className="space-y-2">
                {quickActions.map((a) => (
                  <button
                    key={a.title}
                    onClick={() => navigate(a.route)}
                    className="group w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-all border border-transparent hover:border-border"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm bg-gradient-to-br ${a.color} group-hover:scale-105 transition-transform duration-300`}>
                      <a.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-[13px] font-semibold">{a.title}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{a.description}</div>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground/30 group-hover:text-primary transition-colors translate-x-0 group-hover:translate-x-0.5 duration-300" />
                  </button>
                ))}
              </div>
            </div>

            {/* ALERTS SECTION */}
            <div className="rounded-[1.25rem] bg-card border border-border p-4 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-sm font-bold">Alerts</h2>
                <Button size="icon" variant="ghost" className="w-7 h-7 rounded-full text-muted-foreground">
                  <Activity className="w-3 h-3" />
                </Button>
              </div>

              {recentActivity.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground/30 text-xs italic">
                  All clear for now...
                </div>
              ) : (
                <div className="space-y-2">
                  {recentActivity.slice(0, 4).map((a, i) => (
                    <div key={i} className="group flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border hover:bg-muted/40 transition-all cursor-pointer">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${a.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : a.status === "pending" ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"}`}>
                        {a.status === "completed" ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold group-hover:text-primary transition-colors">{a.title}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">{a.time}</div>
                      </div>
                      {i === 0 && <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-[8px] text-primary border border-primary/20 font-bold">Pending</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;

