import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertTriangle,
  ArrowUpRight,
  Lock,
  ShieldX,
  XCircle,
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { PlanSelectionModal } from "@/ui/plan-selection-modal";
import { useSubscription } from "@/core/hooks/useSubscription";
import type { PlanType } from "@/core/utils/plan-limits";

/**
 * SubscriptionGate — renders a full-screen blocking overlay when the
 * organization's subscription is cancelled.  Drop this into ANY layout
 * (OrganizationOwnerLayout, DashboardLayout, etc.) so cancelled orgs
 * cannot access anything until they resubscribe.
 *
 * It checks `isCancelled` from useSubscription and renders *nothing*
 * when the subscription is active/trial.
 *
 * The overlay is hidden on the /organization/subscription page so users
 * can still view their billing details and resubscribe from that page.
 */
export function SubscriptionGate() {
  const { isCancelled, subscription, isLoading } = useSubscription();
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't block while loading or if not cancelled
  if (isLoading || !isCancelled) return null;

  // Allow the subscription page itself to be viewed
  const isOnSubscriptionPage = location.pathname === "/organization/subscription";

  const cancelledAt = subscription?.cancelled_at;
  const formattedDate = cancelledAt
    ? new Date(cancelledAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  // Don't render the blocking overlay on the subscription page or when plan modal is open
  const showOverlay = !planModalOpen && !isOnSubscriptionPage;

  return (
    <>
      {/* Full-screen overlay that blocks all interaction */}
      {showOverlay && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md">
        {/* Atmospheric glows */}
        <div className="pointer-events-none absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-500/5 dark:bg-red-500/5 blur-[180px]" />
        <div className="pointer-events-none absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-red-500/3 dark:bg-red-500/3 blur-[180px]" />

        <div className="relative flex flex-col items-center text-center max-w-lg mx-auto px-6">
          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/20 shadow-lg shadow-red-100 dark:shadow-red-500/10">
            <ShieldX className="h-10 w-10 text-red-500 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-white">
            Subscription Cancelled
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm leading-relaxed max-w-sm mb-8">
            Your organization&apos;s subscription was cancelled
            {formattedDate ? ` on ${formattedDate}` : ""}. 
            All services are currently suspended.
          </p>

          {/* What's locked */}
          <div className="w-full rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-5 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Lock className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                All services are suspended
              </p>
            </div>
            <ul className="space-y-2 text-left">
              {[
                "All module access (CRM, CPQ, CLM, ERP, Documents) is locked",
                "Team members cannot log in or perform actions",
                "Invitations and client approvals are disabled",
                "Data is preserved but read-only access is restricted",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400 dark:text-red-500/60" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          <div className="w-full rounded-xl border border-amber-300 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-3 mb-8">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs text-amber-700 dark:text-amber-300/80 text-left">
                Resubscribe now to instantly restore access to all your modules,
                team members, and data. Your data is safe and will be fully
                available once you reactivate.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              size="lg"
              className="flex-1 font-bold text-sm rounded-xl shadow-lg"
              onClick={() => setPlanModalOpen(true)}
            >
              <ArrowUpRight className="mr-2 h-4 w-4" />
              Resubscribe Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 font-medium text-sm rounded-xl border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => navigate("/organization/subscription")}
            >
              View Subscription Details
            </Button>
          </div>

          <p className="mt-6 text-[11px] text-zinc-400 dark:text-zinc-500">
            Need help? Contact support at{" "}
            <a
              href="mailto:support@siswit.com"
              className="text-primary hover:underline"
            >
              support@siswit.com
            </a>
          </p>
        </div>
      </div>
      )}

      <PlanSelectionModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        currentPlan={"foundation" as PlanType}
      />
    </>
  );
}
