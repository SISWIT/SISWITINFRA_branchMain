import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { Button } from "@/ui/shadcn/button";
import { AlertTriangle, ArrowUpRight, XCircle } from "lucide-react";
import { PlanSelectionModal } from "@/ui/plan-selection-modal";
import type { PlanType } from "@/core/utils/plan-limits";

interface CancellationOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cancelledAt?: string | null;
  cancelReason?: string | null;
}

export function CancellationOverlay({
  open,
  onOpenChange,
  cancelledAt,
  cancelReason,
}: CancellationOverlayProps) {
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const formattedDate = cancelledAt
    ? new Date(cancelledAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md border-destructive/30 bg-card/95 backdrop-blur-xl">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">
              Subscription Cancelled
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2">
              Your subscription has been cancelled
              {formattedDate ? ` on ${formattedDate}` : ""}.
              Your access has been downgraded to the{" "}
              <span className="font-semibold text-foreground">
                Foundation CRM
              </span>{" "}
              plan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    What changed
                  </p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Access restricted to CRM, CPQ, and Documents only</li>
                    <li>• CLM and ERP modules are now locked</li>
                    <li>• Resource limits reduced to Foundation tier</li>
                    <li>• Priority support downgraded to email support</li>
                  </ul>
                </div>
              </div>
            </div>

            {cancelReason && (
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  Cancellation Reason
                </p>
                <p className="text-sm text-foreground">{cancelReason}</p>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <Button
                className="w-full font-semibold"
                onClick={() => {
                  onOpenChange(false);
                  setPlanModalOpen(true);
                }}
              >
                <ArrowUpRight className="mr-2 h-4 w-4" />
                Resubscribe Now
              </Button>
              <Button
                variant="ghost"
                className="w-full text-muted-foreground"
                onClick={() => onOpenChange(false)}
              >
                Continue with Foundation Plan
              </Button>
            </div>

            <p className="text-center text-[11px] text-muted-foreground">
              You can re-subscribe anytime to unlock higher-tier features.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <PlanSelectionModal
        open={planModalOpen}
        onOpenChange={setPlanModalOpen}
        currentPlan={"foundation" as PlanType}
      />
    </>
  );
}
