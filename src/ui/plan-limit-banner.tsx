// src/ui/plan-limit-banner.tsx
// Displays warning/blocked banners when approaching or reaching plan limits.
// Author: Solanki

import { AlertTriangle, Ban, ArrowUpRight } from "lucide-react";
import { usePlanLimits } from "@/core/hooks/usePlanLimits";
import type { ResourceType } from "@/core/utils/plan-limits";
import {
  getResourceLabel,
  formatLimit,
  getUsagePercent,
  isUnlimited,
} from "@/core/utils/plan-limits";
import { Button } from "@/ui/shadcn/button";
import { useNavigate } from "react-router-dom";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

interface PlanLimitBannerProps {
  resource: ResourceType;
  className?: string;
}

export function PlanLimitBanner({ resource, className = "" }: PlanLimitBannerProps) {
  const navigate = useNavigate();
  const { organization } = useOrganization();
  const { getUsageForResource, isResourceNearLimit, isResourceAtLimit } = usePlanLimits();

  const usage = getUsageForResource(resource);

  if (!usage || isUnlimited(usage.max_allowed)) {
    return null;
  }

  const isBlocked = isResourceAtLimit(resource);
  const isWarning = isResourceNearLimit(resource) && !isBlocked;

  if (!isWarning && !isBlocked) {
    return null;
  }

  const label = getResourceLabel(resource);
  const percent = getUsagePercent(usage.current_count, usage.max_allowed);
  const maxFormatted = formatLimit(usage.max_allowed);

  const handleUpgrade = () => {
    if (organization?.slug) {
      navigate("/organization/plans");
    }
  };

  if (isBlocked) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm ${className}`}
        role="alert"
      >
        <Ban className="h-5 w-5 shrink-0 text-destructive" />
        <div className="flex-1">
          <p className="font-medium text-destructive">
            {label} limit reached ({usage.current_count}/{maxFormatted})
          </p>
          <p className="mt-0.5 text-xs text-destructive/80">
            You cannot create more {label.toLowerCase()} on your current plan. Upgrade to increase your limit.
          </p>
        </div>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleUpgrade}
          className="shrink-0"
        >
          <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
          Upgrade Plan
        </Button>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm ${className}`}
      role="status"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
      <div className="flex-1">
        <p className="font-medium text-warning">
          {label} usage at {percent}% ({usage.current_count}/{maxFormatted})
        </p>
        <p className="mt-0.5 text-xs text-warning/80">
          You are approaching your plan limit. Consider upgrading for more capacity.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleUpgrade}
        className="shrink-0 border-warning/50 text-warning hover:bg-warning/10"
      >
        <ArrowUpRight className="mr-1 h-3.5 w-3.5" />
        View Plans
      </Button>
    </div>
  );
}
