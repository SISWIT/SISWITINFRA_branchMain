import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Clock,
  DollarSign,
  FileStack,
  FileText,
  Package,
  TrendingUp,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link, useParams } from "react-router-dom";

import { useProducts, useQuotes } from "@/modules/cpq/hooks/useCPQ";
import { StatsCard } from "@/modules/crm/components/StatsCard";
import { tenantAppPath } from "@/core/utils/routes";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--destructive))",
];

const PLACEHOLDER_BARS = [
  { label: "Draft", height: "48%" },
  { label: "Pending", height: "74%" },
  { label: "Approved", height: "58%" },
  { label: "Sent", height: "36%" },
];

export default function CPQDashboard() {
  const { tenantSlug } = useParams();
  const { data: quotes } = useQuotes();
  const { data: products } = useProducts();

  const stats = {
    totalProducts: products?.length || 0,
    totalQuotes: quotes?.length || 0,
    draftQuotes: quotes?.filter((q) => q.status === "draft").length || 0,
    approvedQuotes: quotes?.filter((q) => q.status === "approved" || q.status === "accepted").length || 0,
    pendingQuotes: quotes?.filter((q) => q.status === "pending_approval" || q.status === "sent").length || 0,
    totalValue: quotes?.reduce((sum, q) => sum + (q.total || 0), 0) || 0,
    approvalRate:
      quotes && quotes.length > 0
        ? (((quotes.filter((q) => q.status === "approved" || q.status === "accepted").length) / quotes.length) * 100).toFixed(1)
        : "0",
    quotesByStatus: {
      draft: quotes?.filter((q) => q.status === "draft").length || 0,
      pending: quotes?.filter((q) => q.status === "pending_approval" || q.status === "sent").length || 0,
      approved: quotes?.filter((q) => q.status === "approved" || q.status === "accepted").length || 0,
      rejected: quotes?.filter((q) => q.status === "rejected").length || 0,
      expired: quotes?.filter((q) => q.status === "expired").length || 0,
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const statusData = Object.entries(stats.quotesByStatus).map(([status, count]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
  }));

  const hasProducts = stats.totalProducts > 0;
  const hasQuotes = stats.totalQuotes > 0;
  const hasChartData = statusData.some((entry) => entry.value > 0);
  const onboardingSteps = [
    {
      title: "Add products",
      description: hasProducts
        ? "Your product catalog already has items ready for quoting."
        : "Build the product and pricing catalog your team will quote against.",
      href: tenantAppPath(tenantSlug ?? "", "cpq/products"),
      cta: hasProducts ? "Review products" : "Add products",
      completed: hasProducts,
      icon: Package,
    },
    {
      title: "Create templates",
      description: "Save reusable quote structures so the team can launch repeatable proposals faster.",
      href: tenantAppPath(tenantSlug ?? "", "cpq/templates"),
      cta: "Open templates",
      completed: false,
      icon: FileStack,
    },
    {
      title: "Create a quote",
      description: hasQuotes
        ? "Quote activity has started. Keep building momentum from the quotes list."
        : "Start the first customer-ready quote to unlock real pipeline insights here.",
      href: tenantAppPath(tenantSlug ?? "", "cpq/quotes/new"),
      cta: hasQuotes ? "Open quotes" : "Create quote",
      completed: hasQuotes,
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold md:text-3xl">CPQ Dashboard</h1>
          <p className="text-sm text-muted-foreground md:text-base">
            Configure, Price, Quote - manage products, templates, and quote activity.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
            <Link to={tenantAppPath(tenantSlug ?? "", "cpq/products")}>Manage Products</Link>
          </Button>
          <Button size="sm" className="w-full sm:w-auto" asChild>
            <Link to={tenantAppPath(tenantSlug ?? "", "cpq/quotes/new")}>Create Quote</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Products" value={stats.totalProducts} icon={Package} />
        <StatsCard title="Total Quotes" value={stats.totalQuotes} icon={FileText} />
        <StatsCard title="Quote Value" value={formatCurrency(stats.totalValue)} icon={DollarSign} />
        <StatsCard title="Approval Rate" value={`${stats.approvalRate}%`} icon={TrendingUp} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Draft Quotes" value={stats.draftQuotes} icon={Clock} />
        <StatsCard title="Pending Approval" value={stats.pendingQuotes} icon={AlertCircle} />
        <StatsCard title="Approved Quotes" value={stats.approvedQuotes} icon={CheckCircle2} />
        <StatsCard title="Avg Quote Size" value={formatCurrency(stats.totalValue / Math.max(stats.totalQuotes, 1))} icon={Calculator} />
      </div>

      {!hasQuotes && (
        <Card className="border-dashed border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>{hasProducts ? "Your catalog is ready. Now create the first quote." : "Your CPQ workspace is ready for setup."}</CardTitle>
            <CardDescription>
              {hasProducts
                ? "Once the first quote moves through draft, approval, and sent states, this dashboard will start showing real CPQ activity."
                : "New employees start with an empty dashboard. Use the checklist below to set up products, templates, and the first quote instead of staring at blank charts."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-3 md:grid-cols-3">
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-xl border border-border/70 bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-lg bg-primary/10 p-2.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      {step.completed && (
                        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="mt-4 font-medium">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.description}</p>
                    <Button variant="outline" className="mt-4 w-full" asChild>
                      <Link to={step.href}>{step.cta}</Link>
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">What unlocks this dashboard</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3 rounded-lg bg-background px-3 py-2.5">
                  <span className="text-muted-foreground">Quotes by status</span>
                  <span className="font-medium">Create and update quote states</span>
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg bg-background px-3 py-2.5">
                  <span className="text-muted-foreground">Quote value</span>
                  <span className="font-medium">Add priced line items</span>
                </div>
                <div className="flex items-start justify-between gap-3 rounded-lg bg-background px-3 py-2.5">
                  <span className="text-muted-foreground">Approval rate</span>
                  <span className="font-medium">Approve or accept quotes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quotes by Status</CardTitle>
            {!hasChartData && (
              <CardDescription>
                {hasQuotes
                  ? "Status insights will appear after quotes move through more lifecycle stages."
                  : "Create your first quote to populate status distribution here."}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {hasChartData ? (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/10 px-6 text-center">
                <div className="relative mb-6 flex h-32 w-32 items-center justify-center rounded-full border-[14px] border-dashed border-muted">
                  <div className="absolute inset-4 rounded-full border border-dashed border-muted-foreground/30" />
                  <div className="text-center">
                    <p className="text-2xl font-semibold">{stats.totalQuotes}</p>
                    <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Quotes</p>
                  </div>
                </div>
                <p className="text-sm font-medium">No quote lifecycle data yet</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                  Once quotes move through draft, approval, and sent stages, the status mix will appear here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quote Distribution</CardTitle>
            {!hasChartData && (
              <CardDescription>Preview the kind of activity distribution this chart will show once quoting begins.</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {hasChartData ? (
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
            ) : (
              <div className="flex h-[300px] flex-col justify-between rounded-xl border border-dashed border-border bg-muted/10 p-6">
                <div>
                  <p className="text-sm font-medium">Waiting for live quote activity</p>
                  <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                    This space will highlight how quotes are spread across lifecycle stages once your team starts creating and updating them.
                  </p>
                </div>
                <div className="flex h-40 items-end gap-3">
                  {PLACEHOLDER_BARS.map((bar) => (
                    <div key={bar.label} className="flex flex-1 flex-col items-center gap-2">
                      <div className="w-full rounded-t-lg bg-muted" style={{ height: bar.height }} />
                      <span className="text-xs text-muted-foreground">{bar.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to={tenantAppPath(tenantSlug ?? "", "cpq/quotes/new")}>
                <Calculator className="h-6 w-6" />
                <span>New Quote</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to={tenantAppPath(tenantSlug ?? "", "cpq/products")}>
                <Package className="h-6 w-6" />
                <span>Products</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to={tenantAppPath(tenantSlug ?? "", "cpq/quotes")}>
                <FileText className="h-6 w-6" />
                <span>All Quotes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4" asChild>
              <Link to={tenantAppPath(tenantSlug ?? "", "cpq/templates")}>
                <FileStack className="h-6 w-6" />
                <span>Templates</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
