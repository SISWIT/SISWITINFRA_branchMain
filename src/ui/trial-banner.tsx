import { useCallback, useState } from "react";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { cn } from "@/core/utils/utils";
import { useSubscription } from "@/core/hooks/useSubscription";
import { PlanSelectionModal } from "@/ui/plan-selection-modal";

const DISMISS_KEY = "siswit_trial_banner_dismissed";

export function TrialBanner() {
  const { isTrial, trialDaysRemaining, isExpired, subscription, isLoading } =
    useSubscription();

  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [showPlanModal, setShowPlanModal] = useState(false);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore session storage errors
    }
  }, []);

  if (isLoading || dismissed || (!isTrial && !isExpired)) return null;

  const days = trialDaysRemaining ?? 0;
  const isUrgent = days <= 3;
  const isWarning = days <= 7 && days > 3;

  let bannerClasses: string;
  let iconClasses: string;
  let textClasses: string;
  let buttonClasses: string;

  if (isExpired) {
    bannerClasses =
      "bg-gradient-to-r from-red-950/90 via-red-900/80 to-red-950/90 border-red-500/30";
    iconClasses = "text-red-400";
    textClasses = "text-red-100";
    buttonClasses = "bg-red-500 border-0 text-white hover:bg-red-600";
  } else if (isUrgent) {
    bannerClasses =
      "bg-gradient-to-r from-red-950/80 via-red-900/60 to-red-950/80 border-red-500/20";
    iconClasses = "animate-pulse text-red-400";
    textClasses = "text-red-100";
    buttonClasses = "bg-red-500 border-0 text-white hover:bg-red-600";
  } else if (isWarning) {
    bannerClasses =
      "bg-gradient-to-r from-amber-950/80 via-amber-900/60 to-amber-950/80 border-amber-500/20";
    iconClasses = "text-amber-400";
    textClasses = "text-amber-100";
    buttonClasses = "bg-amber-500 border-0 text-black hover:bg-amber-600";
  } else {
    bannerClasses =
      "bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-emerald-950/80 border-emerald-500/20";
    iconClasses = "text-emerald-400";
    textClasses = "text-emerald-100";
    buttonClasses = "bg-emerald-500 border-0 text-white hover:bg-emerald-600";
  }

  const getMessage = () => {
    if (isExpired) {
      return "Your free trial has expired. Upgrade now to continue using all features.";
    }
    if (days === 0) {
      return "Your free trial ends today. Upgrade now to avoid service interruption.";
    }
    if (days === 1) {
      return "Your free trial ends tomorrow. Upgrade now to keep all your data.";
    }
    return `You are on a 14-day free trial. ${days} days remaining.`;
  };

  return (
    <>
      <div
        className={cn(
          "relative flex w-full items-center justify-center gap-3 border-b px-4 py-2.5",
          "animate-in slide-in-from-top-2 duration-500",
          bannerClasses,
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />

        <Sparkles className={cn("h-4 w-4 shrink-0", iconClasses)} />

        <p className={cn("text-xs font-medium sm:text-sm", textClasses)}>
          {getMessage()}
        </p>

        <Button
          size="sm"
          className={cn(
            "h-7 shrink-0 rounded-full px-3 text-[11px] font-bold uppercase tracking-wider",
            buttonClasses,
          )}
          onClick={() => setShowPlanModal(true)}
        >
          Upgrade Now
          <ArrowRight className="ml-1.5 h-3 w-3" />
        </Button>

        <button
          onClick={handleDismiss}
          className={cn(
            "absolute right-3 top-1/2 rounded-full p-1 transition-colors",
            "-translate-y-1/2 hover:bg-white/10",
            textClasses,
          )}
          aria-label="Dismiss trial banner"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <PlanSelectionModal
        open={showPlanModal}
        onOpenChange={setShowPlanModal}
        currentPlan={subscription?.plan_type ?? "foundation"}
      />
    </>
  );
}
