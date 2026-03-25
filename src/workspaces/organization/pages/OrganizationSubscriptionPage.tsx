import { useState } from "react";
import { Loader2, ArrowUpRight, ShoppingBag, CreditCard, Receipt, Activity, User, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/shadcn/tabs";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { useOrganizationStats } from "@/workspaces/organization/hooks/useOrganizationStats";
import { usePlanLimits } from "@/core/hooks/usePlanLimits";
import { useBillingInfo, useCreateBillingCustomer } from "@/workspaces/organization/hooks/useBilling";
import { UpgradePrompt } from "@/ui/upgrade-prompt";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Skeleton } from "@/ui/shadcn/skeleton";
import { toast } from "sonner";
import { cn } from "@/core/utils/utils";
import {
  getResourceLabel,
  formatLimit,
  isUnlimited,
  ADD_ONS,
  type PlanType,
  type ResourceType
} from "@/core/utils/plan-limits";

const PLAN_NAMES: Record<PlanType, string> = {
  foundation: "Foundation CRM",
  growth: "Revenue Growth",
  commercial: "Commercial Control",
  enterprise: "Enterprise Governance",
};

const TRACKED_RESOURCES: ResourceType[] = [
  "contacts",
  "accounts",
  "leads",
  "opportunities",
  "products",
  "quotes",
  "contracts",
  "contract_templates",
  "documents",
  "document_templates",
  "suppliers",
  "purchase_orders",
  "storage_mb",
  "api_calls",
  "esignatures",
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-success/10 text-success border-success/20";
    case "trial":
      return "bg-info/10 text-info border-info/20";
    case "past_due":
      return "bg-warning/10 text-warning border-warning/20";
    case "cancelled":
    case "suspended":
      return "bg-destructive/10 text-destructive border-destructive/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

function getBarColor(percent: number): string {
  if (percent >= 90) return "bg-destructive";
  if (percent >= 75) return "bg-warning";
  return "bg-primary";
}

export default function OrganizationSubscriptionPage() {
  const { 
    organization, 
    organizationLoading, 
    subscription 
  } = useOrganization();
  const { data: stats, isLoading: statsLoading } = useOrganizationStats(organization?.id);
  const { usage, planType, isLoading: usageLoading } = usePlanLimits();
  const { data: billingInfo, isLoading: billingLoading } = useBillingInfo();
  const createCustomer = useCreateBillingCustomer();
  
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [billingEmail, setBillingEmail] = useState("");
  const [billingName, setBillingName] = useState("");

  const modules = [
    { name: "CRM", enabled: Boolean(subscription?.module_crm) },
    { name: "CPQ", enabled: Boolean(subscription?.module_cpq) },
    { name: "CLM", enabled: Boolean(subscription?.module_clm) },
    { name: "ERP", enabled: Boolean(subscription?.module_erp) },
    { name: "Documents", enabled: Boolean(subscription?.module_documents) },
  ];

  const status = subscription?.status ?? organization?.status ?? "unknown";
  const plan = planType;
  const planDisplayName = PLAN_NAMES[plan] ?? plan;

  const handleSetupBilling = async () => {
    if (!billingEmail || !billingName) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      await createCustomer.mutateAsync({ email: billingEmail, name: billingName });
      toast.success("Billing profile created successfully");
    } catch (err) {
      toast.error("Failed to create billing profile");
    }
  };

  if (organizationLoading) {
    return (
      <div className="flex flex-col gap-6 p-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-8 w-full max-w-xs" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription & Billing</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your plan, resource usage, and payment settings.</p>
        </div>
        <div className="flex items-center gap-2">
          {organizationLoading ? (
            <Skeleton className="h-6 w-20 rounded-full" />
          ) : (
            <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", statusBadgeClass(status))}>
              {status.replace("_", " ")}
            </span>
          )}
          {organizationLoading ? (
            <Skeleton className="h-6 w-32 rounded-full" />
          ) : (
            <span className="text-sm font-semibold px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
              {planDisplayName}
            </span>
          )}
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px] mb-8">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing Profile</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            <span className="hidden sm:inline">Invoices</span>
          </TabsTrigger>
        </TabsList>

        {!organization && !organizationLoading ? (
          <section className="org-panel">
            <h2 className="text-lg font-semibold">No organization found</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in with an organization owner account.</p>
          </section>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Plan Summary Card */}
                <article className="org-panel flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-6">Current Plan</h2>
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="text-sm font-medium mb-4">Plan Capacity</p>
                        <div className="space-y-4">
                          {statsLoading || organizationLoading ? (
                            Array.from({ length: 2 }).map((_, i) => (
                              <div key={i} className="space-y-2">
                                <div className="flex justify-between"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-12" /></div>
                                <Skeleton className="h-1.5 w-full rounded-full" />
                              </div>
                            ))
                          ) : (
                            <>
                              <UsageMeterRow
                                label="Users"
                                used={stats?.totalMembers ?? 1}
                                max={organization?.max_users ?? 1}
                              />
                              <UsageMeterRow
                                label="Storage"
                                used={0}
                                max={organization?.max_storage_mb ?? 1024}
                                unit="MB"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button onClick={() => toast.info("Redirecting to Razorpay...")} className="flex-1" disabled={organizationLoading}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Manage Billing
                        </Button>
                        <Button variant="outline" onClick={() => setUpgradeOpen(true)} className="flex-1" disabled={organizationLoading}>
                          <ArrowUpRight className="mr-2 h-4 w-4" />
                          Change Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>

                {/* Modules Card */}
                <article className="org-panel">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Platform Modules</h2>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">Included features for your current organization profile.</p>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    {organizationLoading ? (
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-14 w-full rounded-xl" />
                      ))
                    ) : (
                      modules.map((module) => (
                        <div
                          key={module.name}
                          className={cn(
                            "flex items-center justify-between p-4 rounded-xl border transition-colors",
                            module.enabled ? "bg-background border-border" : "bg-muted/10 border-dashed border-border/50 opacity-60"
                          )}
                        >
                          <span className="text-sm font-medium">{module.name}</span>
                          <span
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                              module.enabled ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                            )}
                          >
                            {module.enabled ? "Active" : "Locked"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </div>

              {/* Detailed Usage */}
              <section className="org-panel">
                <h2 className="text-xl font-semibold mb-2">Resource Usage Details</h2>
                <p className="text-sm text-muted-foreground mb-6">Real-time consumption snapshot across your organization.</p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {usageLoading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))
                  ) : (
                    TRACKED_RESOURCES.map((resource) => {
                      const entry = usage[resource];
                      if (!entry) return null;

                      return (
                        <div key={resource} className="p-4 rounded-xl border bg-card/30">
                          <UsageMeterRow
                            label={getResourceLabel(resource)}
                            used={entry.current_count}
                            max={entry.max_allowed}
                            period={entry.period}
                          />
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/* Add-ons */}
              <section className="org-panel">
                <div className="flex items-center gap-2 mb-6">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Plan Expansion</h2>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.values(ADD_ONS).map((addon) => (
                    <div key={addon.name} className="flex flex-col justify-between p-5 rounded-xl border border-border/70 bg-card/10 hover:bg-card/20 transition-colors group">
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">{addon.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{addon.description}</p>
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-2xl font-bold">₹{addon.price}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">/mo</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="mt-6 w-full" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  ))}
                </div>
              </section>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Billing Profile */}
                <article className="org-panel">
                  <div className="flex items-center gap-2 mb-6">
                    <User className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold">Billing Details</h2>
                  </div>

                  {billingLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ) : billingInfo?.customer_id ? (
                    <div className="space-y-6">
                      <div className="grid gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Customer ID</Label>
                          <p className="font-mono text-sm bg-muted/50 p-2 rounded border">{billingInfo.customer_id}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Billing Email</Label>
                          <p className="text-sm p-2 bg-muted/30 rounded">{billingInfo.billing_email}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Contact Name</Label>
                          <p className="text-sm p-2 bg-muted/30 rounded">{billingInfo.billing_contact_name}</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => toast.info("Contact support to update billing details.")}>
                        Request Update
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground mb-4">Set up your billing profile to receive invoices and manage payments.</p>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Billing Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={billingEmail}
                            onChange={(e) => setBillingEmail(e.target.value)}
                            placeholder="finance@company.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Billing Contact Name</Label>
                          <Input
                            id="name"
                            value={billingName}
                            onChange={(e) => setBillingName(e.target.value)}
                            placeholder="Full Name"
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={handleSetupBilling}
                          disabled={createCustomer.isPending}
                        >
                          {createCustomer.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <CreditCard className="mr-2 h-4 w-4" />
                          Complete Setup
                        </Button>
                      </div>
                    </div>
                  )}
                </article>

                {/* Subscription Status */}
                <div className="space-y-6">
                  <article className="org-panel">
                    <div className="flex items-center gap-2 mb-4">
                      <Info className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold">Subscription Insights</h2>
                    </div>
                    <div className="space-y-4">
                      {billingLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-border/50">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Billing Cycle</span>
                            <span className="text-sm font-medium">Monthly</span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-border/50">
                            <span className="text-sm text-muted-foreground">Period Start</span>
                            <span className="text-sm font-medium">{billingInfo?.subscription_start_date || "N/A"}</span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-muted-foreground">Renewal Date</span>
                            <span className="text-sm font-medium">{billingInfo?.subscription_end_date || "N/A"}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </article>

                  <article className="p-4 rounded-xl border border-primary/20 bg-primary/5">
                    <p className="text-xs font-medium text-primary mb-1 uppercase tracking-wider">Payment Method</p>
                    <p className="text-sm text-muted-foreground">No payment method added yet. Direct billing via Razorpay is used for plan upgrades.</p>
                  </article>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="invoices" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="org-panel flex flex-col items-center justify-center py-20 text-center">
                <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Receipt className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h2 className="text-xl font-semibold">Invoice History</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs">
                  Direct billing is active. Invoices will appear here once your automated billing cycle starts.
                </p>
                <Button variant="outline" className="mt-6" disabled>
                  Launch Billing Portal
                </Button>
              </div>
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Upgrade Prompt Modal */}
      <UpgradePrompt
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        currentPlan={plan}
      />
    </div>
  );
}

interface UsageMeterRowProps {
  label: string;
  used: number;
  max: number;
  unit?: string;
  period?: string;
}

function UsageMeterRow({ label, used, max, unit = "", period }: UsageMeterRowProps) {
  if (isUnlimited(max)) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">{label}</span>
          <span className="font-mono text-xs text-muted-foreground">
            {used} / ∞ {unit}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary/20" style={{ width: "10%" }} />
        </div>
      </div>
    );
  }

  const safeMax = Math.max(1, max);
  const percent = Math.min(100, Math.round((used / safeMax) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">
          {label}
          {period && period !== "total" && (
            <span className="ml-1 text-[10px] text-muted-foreground uppercase">
              ({period === "monthly" ? "mo" : "day"})
            </span>
          )}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {used} / {formatLimit(max)} {unit}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-500", getBarColor(percent))}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
