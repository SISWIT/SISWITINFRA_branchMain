import { useParams, Link } from "react-router-dom";
import { Users, Building2, Target, DollarSign, TrendingUp, FileText } from "lucide-react";
import { StatsCard } from "@/modules/crm/components/StatsCard";
import { useDashboardStats, useOpportunities } from "@/modules/crm/hooks/useCRM";
import { OpportunityPipeline } from "@/modules/crm/components/OpportunityPipeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1))"];

export default function CRMDashboard() {
  const { tenantSlug } = useParams();
  const { data: stats } = useDashboardStats();
  const { data: opportunities = [] } = useOpportunities();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const pipelineData = stats?.opportunitiesByStage
    ? Object.entries(stats.opportunitiesByStage).map(([stage, count]) => ({
        name: stage.charAt(0).toUpperCase() + stage.slice(1).replace("_", " "),
        value: count,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-semibold">CRM Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Welcome back! Here's your sales overview.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to={`/${tenantSlug}/app/crm/leads`}>
          <StatsCard title="Total Leads" value={stats?.totalLeads || 0} icon={Users} />
        </Link>
        <Link to={`/${tenantSlug}/app/crm/accounts`}>
          <StatsCard title="Total Accounts" value={stats?.totalAccounts || 0} icon={Building2} />
        </Link>
        <Link to={`/${tenantSlug}/app/crm/opportunities`}>
          <StatsCard title="Open Opportunities" value={stats?.openOpportunities || 0} icon={Target} />
        </Link>
        <Link to={`/${tenantSlug}/app/crm/pipeline`}>
          <StatsCard
            title="Pipeline Value"
            value={formatCurrency(stats?.pipelineValue || 0)}
            subtitle={`Expected: ${formatCurrency(stats?.expectedRevenue || 0)}`}
            icon={DollarSign}
          />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to={`/${tenantSlug}/app/crm/opportunities?filter=won`}>
          <StatsCard title="Won Deals" value={stats?.wonDeals || 0} icon={TrendingUp} />
        </Link>
        <Link to={`/${tenantSlug}/app/crm/opportunities?filter=won`}>
          <StatsCard title="Won Value" value={formatCurrency(stats?.wonValue || 0)} icon={DollarSign} />
        </Link>
        <StatsCard title="Win Rate" value={`${(stats?.winRate || 0).toFixed(1)}%`} icon={Target} />
        <Link to={`/${tenantSlug}/app/crm/activities`}>
          <StatsCard title="Active Activities" value={stats?.totalQuotes || 0} icon={FileText} />
        </Link>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pipelineData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {pipelineData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Opportunities by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(250, 85%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <OpportunityPipeline opportunities={opportunities} />
        </CardContent>
      </Card>
    </div>
  );
}
