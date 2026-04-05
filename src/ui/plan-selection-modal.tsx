import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";
import { Badge } from "@/ui/shadcn/badge";
import {
  ArrowRight,
  Building2,
  Check,
  Crown,
  Loader2,
  Rocket,
  Shield,
  Zap,
} from "lucide-react";
import type { PlanType } from "@/core/utils/plan-limits";
import { PLAN_PRICES, getUpgradePlanFor } from "@/core/utils/plan-limits";
import { useSubscription } from "@/core/hooks/useSubscription";
import { cn } from "@/core/utils/utils";

interface PlanSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan: PlanType;
}

const PLAN_ORDER: PlanType[] = [
  "foundation",
  "growth",
  "commercial",
  "enterprise",
];

const PLAN_META: Record<
  PlanType,
  {
    name: string;
    tagline: string;
    icon: typeof Zap;
    color: string;
    gradient: string;
    features: string[];
  }
> = {
  foundation: {
    name: "Foundation CRM",
    tagline: "For small teams getting started",
    icon: Zap,
    color: "text-blue-400",
    gradient: "from-blue-500/20 to-blue-600/5",
    features: [
      "Up to 5 users",
      "500 contacts",
      "CRM + CPQ + Documents",
      "1 GB storage",
      "10 e-signatures/mo",
      "Email support",
    ],
  },
  growth: {
    name: "Revenue Growth",
    tagline: "For growing sales teams",
    icon: Rocket,
    color: "text-violet-400",
    gradient: "from-violet-500/20 to-violet-600/5",
    features: [
      "Up to 25 users",
      "5,000 contacts",
      "+ Contract Management (CLM)",
      "10 GB storage",
      "100 e-signatures/mo",
      "Priority support",
    ],
  },
  commercial: {
    name: "Commercial Control",
    tagline: "For large organizations",
    icon: Building2,
    color: "text-amber-400",
    gradient: "from-amber-500/20 to-amber-600/5",
    features: [
      "Up to 100 users",
      "50,000 contacts",
      "+ ERP (all 5 modules)",
      "100 GB storage",
      "1,000 e-signatures/mo",
      "Dedicated support",
    ],
  },
  enterprise: {
    name: "Enterprise Governance",
    tagline: "For enterprises at scale",
    icon: Shield,
    color: "text-emerald-400",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    features: [
      "Unlimited users",
      "Unlimited contacts",
      "All modules + governance",
      "500 GB storage",
      "Unlimited e-signatures",
      "24/7 dedicated support",
    ],
  },
};

export function PlanSelectionModal({
  open,
  onOpenChange,
  currentPlan,
}: PlanSelectionModalProps) {
  const { initiateCheckout, isCheckoutPending, isTrial } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const recommendedPlan = getUpgradePlanFor(currentPlan);
  const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);

  const handleSelectPlan = async (plan: PlanType) => {
    // If user is on a trial, allow selecting ANY plan including foundation
    // If user has a paid plan, don't let them re-select the same plan
    if (!isTrial && plan === currentPlan) return;

    setSelectedPlan(plan);
    try {
      // The dialog stays open showing the loading spinner while the
      // backend creates the subscription.  The onBeforeOpen callback
      // fires right before razorpay.open() — that is where we close
      // this dialog so the Radix focus-trap is released.
      await initiateCheckout(plan, {
        onBeforeOpen: () => onOpenChange(false),
      });
    } catch {
      // Error handling is centralized in useSubscription.
    } finally {
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] gap-0 overflow-y-auto border-border/40 bg-card/95 p-0 backdrop-blur-xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-bold tracking-tight">
            Choose Your Plan
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Select the plan that best fits your team. Upgrade or downgrade
            anytime.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-4">
          {PLAN_ORDER.map((plan, index) => {
            const meta = PLAN_META[plan];
            const Icon = meta.icon;
            // On trial, no plan is "current" so all are selectable
            const isCurrent = !isTrial && plan === currentPlan;
            const isRecommended = plan === recommendedPlan;
            const isDowngrade = !isTrial && index < currentPlanIndex;
            const isPending = isCheckoutPending && selectedPlan === plan;

            return (
              <div
                key={plan}
                className={cn(
                  "relative flex flex-col rounded-2xl border-2 p-5 transition-all duration-300",
                  "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
                  isRecommended
                    ? "border-primary/60 bg-gradient-to-b shadow-lg shadow-primary/10"
                    : isCurrent
                      ? "border-muted-foreground/30 bg-muted/20"
                      : "border-border/40 bg-card/40",
                  isRecommended && meta.gradient,
                )}
              >
                {isRecommended && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary px-3 py-0.5 text-[10px] text-primary-foreground shadow-lg">
                    <Crown className="mr-1 h-3 w-3" />
                    Recommended
                  </Badge>
                )}

                <div className="mb-3 flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className={cn("h-4.5 w-4.5", meta.color)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold leading-tight">
                      {meta.name}
                    </h3>
                    <p className="text-[10px] leading-tight text-muted-foreground">
                      {meta.tagline}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold tracking-tight">
                    INR {PLAN_PRICES[plan].toLocaleString("en-IN")}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    /month
                  </span>
                </div>

                <ul className="mb-5 flex-1 space-y-2">
                  {meta.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <Button variant="outline" className="w-full rounded-xl" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant={isRecommended ? "default" : "outline"}
                    className={cn(
                      "w-full rounded-xl font-semibold",
                      isRecommended && "bg-primary shadow-md hover:bg-primary/90",
                    )}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCheckoutPending}
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isDowngrade ? "Downgrade" : "Select Plan"}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-6 pb-6">
          <p className="text-center text-[11px] text-muted-foreground">
            All prices are in INR and billed monthly through Razorpay.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
