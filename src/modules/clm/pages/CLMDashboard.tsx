import { FileText, FileCheck, FileClock, FileX, PenTool, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { Button } from "@/ui/shadcn/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link, useParams } from "react-router-dom";
import { StatsCard } from "@/modules/crm/components/StatsCard";
import { format } from "date-fns";
import { Badge } from "@/ui/shadcn/badge";
import { useCLMDashboardStats } from "@/modules/clm/hooks/useCLM";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_review: "bg-warning/15 text-warning",
  pending_approval: "bg-warning/15 text-warning",
  approved: "bg-info/15 text-info",
  sent: "bg-primary/15 text-primary",
  signed: "bg-success/15 text-success",
  expired: "bg-destructive/15 text-destructive",
  cancelled: "bg-secondary text-secondary-foreground",
};

export default function CLMDashboard() {
  const { tenantSlug } = useParams();
  const { data: stats } = useCLMDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
  };

  const statusData = stats?.contractsByStatus
    ? Object.entries(stats.contractsByStatus).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).replace("_", " "),
      value: count,
    }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        {/* Title Section */}
        <div className="space-y-1">
          <h1 className="text-xl md:text-3xl font-semibold">
            CLM Dashboard
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Contract Lifecycle Management - Manage contracts from creation to signature
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            asChild
          >
            <Link to={`/${tenantSlug}/app/clm/templates`}>
              Manage Templates
            </Link>
          </Button>

          <Button
            size="sm"
            className="w-full sm:w-auto"
            asChild
          >
            <Link to={`/${tenantSlug}/app/clm/contracts/new`}>
              Create Contract
            </Link>
          </Button>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to={`/${tenantSlug}/app/clm/contracts`}>
          <StatsCard title="Total Contracts" value={stats?.totalContracts || 0} icon={FileText} />
        </Link>
        <Link to={`/${tenantSlug}/app/clm/templates`}>
          <StatsCard title="Templates" value={stats?.totalTemplates || 0} icon={FileCheck} />
        </Link>
        <Link to={`/${tenantSlug}/app/clm/contracts`}>
          <StatsCard title="Contract Value" value={formatCurrency(stats?.totalValue || 0)} icon={TrendingUp} />
        </Link>
        <StatsCard title="Sign Rate" value={`${stats?.signRate || 0}%`} icon={PenTool} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to={`/${tenantSlug}/app/clm/contracts?status=draft`}>
          <StatsCard title="Draft Contracts" value={stats?.draftContracts || 0} icon={Clock} />
        </Link>
        <Link to={`/${tenantSlug}/app/clm/contracts?status=pending`}>
          <StatsCard title="Pending Review" value={stats?.pendingContracts || 0} icon={FileClock} />
        </Link>
        <Link to={`/${tenantSlug}/app/clm/contracts?status=signed`}>
          <StatsCard title="Signed Contracts" value={stats?.signedContracts || 0} icon={CheckCircle2} />
        </Link>
        <Link to={`/${tenantSlug}/app/clm/contracts?status=expired`}>
          <StatsCard title="Expired Contracts" value={stats?.expiredContracts || 0} icon={FileX} />
        </Link>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contracts by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, index) => (
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
            <CardTitle>Contract Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts & Quick Actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentContracts?.length ? (
                stats.recentContracts.map((contract) => (
                  <div key={contract.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div>
                      <p className="font-medium">{contract.name}</p>
                      <p className="text-sm text-muted-foreground">{contract.contract_number || "No number"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={STATUS_COLORS[contract.status || "draft"] || ""}>{(contract.status || "draft").replace("_", " ")}</Badge>
                      <span className="text-sm text-muted-foreground">{contract.created_at ? format(new Date(contract.created_at), "MMM d") : ""}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">No contracts yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to={`/${tenantSlug}/app/clm/contracts/new`}>
                  <FileText className="h-6 w-6" />
                  <span>New Contract</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to={`/${tenantSlug}/app/clm/templates`}>
                  <FileCheck className="h-6 w-6" />
                  <span>Templates</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to={`/${tenantSlug}/app/clm/contracts`}>
                  <FileClock className="h-6 w-6" />
                  <span>All Contracts</span>
                </Link>
              </Button>
              <Button variant="outline" className="h-auto py-4 flex flex-col gap-2" asChild>
                <Link to={`/${tenantSlug}/app/clm/scan`}>
                  <PenTool className="h-6 w-6" />
                  <span>Scan Contract</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
