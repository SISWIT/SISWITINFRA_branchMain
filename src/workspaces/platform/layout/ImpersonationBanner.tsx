import { AlertTriangle, LogOut } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { useImpersonation } from "@/core/hooks/useImpersonation";

export function ImpersonationBanner() {
  const { state, stopImpersonation } = useImpersonation();

  if (!state.active) {
    return null;
  }

  const displaySlug = state.organizationSlug ?? state.tenantSlug ?? "unknown";

  return (
    <div className="border-b border-destructive/40 bg-destructive/10 px-4 py-2">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <div className="text-sm">
            <span className="font-semibold">Impersonation active</span>
            {" — "}
            Organization: <span className="font-bold">{displaySlug}</span>
            {state.reason && (
              <span className="ml-2 text-muted-foreground">
                (Reason: {state.reason})
              </span>
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={() => void stopImpersonation()}
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          End Impersonation Session
        </Button>
      </div>
    </div>
  );
}
