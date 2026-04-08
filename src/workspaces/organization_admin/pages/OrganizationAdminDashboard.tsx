import { useMemo } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  AreaChart,
  Area,
} from "recharts";
import {
  UserPlus,
  CreditCard,
  Users as UsersIcon,
  ShieldCheck,
  Briefcase,
  Bell,
  Clock3,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { format, subDays, isAfter } from "date-fns";
import { useAuth } from "@/core/auth/useAuth";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { tenantAppPath } from "@/core/utils/routes";
import { Badge } from "@/ui/shadcn/badge";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Skeleton } from "@/ui/shadcn/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/shadcn/table";
import { 
  useOrganizationAdminDashboard,
  type DashboardChartItem,
  type DashboardAuditLog
} from "../hooks/useOrganizationAdminDashboard";

function DashboardMetricSkeleton() {
  return (
    <Card className="border-border bg-card/60 backdrop-blur-sm">
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-9 w-14" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DashboardTableSkeleton() {
  return (
    <Card className="border-border bg-card/60 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-24 rounded-xl" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function OrganizationAdminDashboard() {
  const { user, fullName } = useAuth();
  const { organization, memberships, organizationLoading } = useOrganization();
  const { tenantSlug = "" } = useParams<{ tenantSlug: string }>();
  const navigate = useNavigate();
  const { data: dashboardData, isLoading, isError, refetch } = useOrganizationAdminDashboard();

  const primaryColor = organization?.primary_color || "var(--primary)";
  
  const userName = useMemo(() => {
    if (fullName) return fullName;
    const firstName = String(user?.user_metadata?.first_name ?? "").trim();
    const lastName = String(user?.user_metadata?.last_name ?? "").trim();
    const derivedName = `${firstName} ${lastName}`.trim();
    if (derivedName) return derivedName;
    return user?.email?.split("@")[0] ?? "Admin";
  }, [user?.email, user?.user_metadata, fullName]);

  const orgName = organization?.name || "Your Organization";
  const isDashboardHydrating = (organizationLoading || isLoading) && !dashboardData;

  // Process operational data
  const barChartData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return {
        name: format(d, "dd MMM"),
        leads: 0,
        contracts: 0,
        total: 0
      };
    });

    if (!dashboardData?.charts) return days;
    const sevenDaysAgo = subDays(new Date(), 7);

    dashboardData.charts.leads?.forEach((lead: DashboardChartItem) => {
      if (!lead.created_at) return;
      const d = new Date(lead.created_at);
      if (isAfter(d, sevenDaysAgo)) {
        const entry = days.find(x => x.name === format(d, "dd MMM"));
        if (entry) {
          entry.leads += 1;
          entry.total += 1;
        }
      }
    });

    dashboardData.charts.contracts?.forEach((contract: DashboardChartItem) => {
      if (!contract.created_at) return;
      const d = new Date(contract.created_at);
      if (isAfter(d, sevenDaysAgo)) {
        const entry = days.find(x => x.name === format(d, "dd MMM"));
        if (entry) {
          entry.contracts += 1;
          entry.total += 1;
        }
      }
    });

    return days;
  }, [dashboardData?.charts]);

  if (isDashboardHydrating) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <section className="rounded-[2rem] border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-lg">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-6 w-40 rounded-full" />
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-full max-w-md" />
              <Skeleton className="h-4 w-72" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Skeleton className="h-12 w-44 rounded-2xl" />
              <Skeleton className="h-12 w-44 rounded-2xl" />
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <DashboardMetricSkeleton key={index} />
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <Card className="lg:col-span-8 border-border bg-card/60 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-8">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-4 w-52" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-24 rounded-full" />
                <Skeleton className="h-7 w-28 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="h-[400px] w-full">
              <Skeleton className="h-full w-full rounded-2xl" />
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-border bg-card/60 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex gap-4">
                  <Skeleton className="mt-1 h-2 w-2 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
              <Skeleton className="h-10 w-full rounded-xl" />
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardTableSkeleton />
          <DashboardTableSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
      <div className="flex h-[80vh] flex-col items-center justify-center gap-4 text-center">
        <div
          className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderTopColor: primaryColor }}
        />
        <div className="space-y-1">
          <p className="font-semibold">Unable to load command center data</p>
          <p className="text-sm text-muted-foreground">
            The dashboard metrics did not finish syncing. Retry to fetch the latest organization data.
          </p>
        </div>
        <Button variant="outline" onClick={() => void refetch()}>
          Retry Sync
        </Button>
      </div>
    );
  }

  const { kpis, lists } = dashboardData;

  const stats = [
    { 
      label: "Total Leads", 
      value: kpis.leads, 
      icon: Briefcase, 
      color: primaryColor,
      trend: `${dashboardData.trends.leads > 0 ? '+' : ''}${dashboardData.trends.leads}%`,
      subtext: "CRM Pipeline" 
    },
    { 
      label: "Contracts", 
      value: kpis.contracts, 
      icon: ShieldCheck, 
      color: "#10b981", 
      trend: `${dashboardData.trends.contracts > 0 ? '+' : ''}${dashboardData.trends.contracts}%`,
      subtext: "CLM Active"
    },
    { 
      label: "Team Size", 
      value: memberships?.length || 0, 
      icon: UsersIcon, 
      color: "#f59e0b", 
      trend: "Online",
      subtext: "Active Users"
    },
    { 
      label: "Pending Invites", 
      value: kpis.invitations, 
      icon: Clock3, 
      color: "#6366f1", 
      trend: "Action Required",
      subtext: "Onboarding"
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6 sm:p-8 lg:p-10 shadow-lg">
        <div 
          className="absolute -right-20 -top-20 h-64 w-64 rounded-full blur-[100px] opacity-20 pointer-events-none"
          style={{ backgroundColor: primaryColor }}
        />
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="rounded-full bg-primary/5 border-primary/20 text-primary py-1 px-3 mb-2">
              <Layers className="mr-2 h-3 w-3" />
              Organizational Command
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-br from-foreground via-foreground/80 to-foreground/70 bg-clip-text text-transparent">
              Hello, {userName}
            </h1>
            <p className="text-muted-foreground max-w-md">
              Welcome to the <span className="font-bold text-foreground">{orgName}</span> administration hub. Here is your organization's high-level operational pulse.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button 
              onClick={() => navigate(tenantAppPath(tenantSlug, "invitations"))} 
              className="h-12 rounded-2xl px-6 font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-primary text-primary-foreground"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Add Team Member
            </Button>
            <Button 
              variant="outline"
              onClick={() => navigate(tenantAppPath(tenantSlug, "subscription"))} 
              className="h-12 rounded-2xl px-6 font-semibold bg-background/80 backdrop-blur-sm border-border hover:bg-muted/50 transition-all"
            >
              <CreditCard className="mr-2 h-5 w-5" />
              Manage Billing
            </Button>
          </div>
        </div>
      </section>

      {/* KPI Command Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="group relative overflow-hidden border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-all duration-300">
            <div 
              className="absolute right-0 top-0 h-1 w-0 group-hover:w-full transition-all duration-500"
              style={{ backgroundColor: stat.color }}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="p-3 rounded-2xl bg-muted/50 group-hover:scale-110 transition-transform"
                  style={{ color: stat.color }}
                >
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="bg-primary/5 text-[10px] font-bold">
                    {stat.trend}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight">{stat.value}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{stat.subtext}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dynamic Activity & Operational Data */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Core Operational Pulse */}
        <Card className="lg:col-span-8 border-border bg-card/60 shadow-sm overflow-hidden flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-8">
            <div className="space-y-1">
              <CardTitle className="text-xl">Operational Pulse</CardTitle>
              <p className="text-xs text-muted-foreground font-medium">Weekly trend cross-module activity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: primaryColor }} />
                CRM Leads
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-500">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                CLM Contracts
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={barChartData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.5)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 500 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    borderRadius: "1rem", 
                    border: "1px solid hsl(var(--border) / 0.6)",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke={primaryColor} 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="contracts" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={0}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Global Audit Feed */}
        <Card className="lg:col-span-4 border-border bg-card/60 shadow-sm flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Global Activity</CardTitle>
              <Badge variant="outline" className="text-[10px] font-bold px-2">Live Feed</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 px-6 pb-6">
            {lists.auditLogs.length > 0 ? lists.auditLogs.map((log: DashboardAuditLog) => (
              <div key={log.id} className="relative pl-6 pb-4 border-l border-border last:border-0 last:pb-0">
                <div 
                  className="absolute left-[-5px] top-1 h-2 w-2 rounded-full border-2 border-background"
                  style={{ backgroundColor: primaryColor }}
                />
                <p className="text-sm font-semibold leading-none mb-1">
                  {log.action?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                  Targeted {log.entity_type} {log.entity_type === 'user' ? 'Management' : 'Operation'}
                </p>
                <p className="text-[10px] text-muted-foreground/60 font-medium">
                  {log.created_at ? format(new Date(log.created_at), "MMM dd • h:mm a") : "Just now"}
                </p>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <div className="p-4 rounded-full bg-muted/30 mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <p className="text-xs text-muted-foreground font-medium">No recent audit activity found.</p>
              </div>
            )}
            <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-semibold border-border/60 hover:bg-muted/50 mt-4">
              View All Logs
              <ArrowUpRight className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Snapshot Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Core Leads Snapshot */}
        <Card className="border-border bg-card/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Organization Leads</CardTitle>
            <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-semibold hover:bg-muted/50 rounded-xl">
              CRM Hub
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider">Lead</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.leads.slice(0, 5).map((lead) => (
                  <TableRow key={lead.id} className="border-border/60 hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-[10px] text-primary">
                          {(lead.first_name?.[0] || lead.company?.[0] || "L").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold leading-none">{lead.first_name} {lead.last_name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">{lead.company || "Individual"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] capitalize bg-background/50">
                        {lead.status || "New"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      $0.00
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Core Contracts Snapshot */}
        <Card className="border-border bg-card/60 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl">Recent Contracts</CardTitle>
            <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-semibold hover:bg-muted/50 rounded-xl">
              CLM Hub
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-border">
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider">Title</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-wider text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.contracts.slice(0, 5).map((contract) => (
                  <TableRow key={contract.id} className="border-border/60 hover:bg-muted/20 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div className="max-w-[150px]">
                          <p className="text-sm font-semibold leading-none truncate">{contract.name}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Expires {contract.end_date ? format(new Date(contract.end_date), "MMM dd, yyyy") : "TBD"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full px-2 py-0 text-[10px] capitalize bg-background/50">
                        {contract.status || "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-sm">
                      ${(contract.total_value || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
