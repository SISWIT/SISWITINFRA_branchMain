import { Building2, Users, DollarSign, AlertOctagon, Activity } from "lucide-react";
import { PlatformMetricCard } from "../../../shared/components/PlatformMetricCard";
import { PlatformOverview } from "../types";

interface PlatformOverviewGridProps {
  data?: PlatformOverview;
  isLoading: boolean;
}

export function PlatformOverviewGrid({ data, isLoading }: PlatformOverviewGridProps) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-xl border bg-card animate-pulse" />
        ))}
      </div>
    );
  }

  const mrrFormatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(data.estimated_mrr);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <PlatformMetricCard
        title="Organizations"
        value={data.total_organizations}
        description={`${data.active_organizations} active · ${data.trial_organizations} trial`}
        icon={<Building2 className="h-4 w-4" />}
      />
      <PlatformMetricCard
        title="Total Users"
        value={data.total_users}
        description="Across all workspaces"
        icon={<Users className="h-4 w-4" />}
      />
      <PlatformMetricCard
        title="Estimated MRR"
        value={mrrFormatted}
        description="Based on active plans"
        icon={<DollarSign className="h-4 w-4" />}
      />
      
      {/* Show health or suspicious activity as the 4th card */}
      {data.recent_suspicious_activity_count > 0 ? (
        <PlatformMetricCard
          title="Security Alerts"
          className="border-red-500/50 bg-red-500/5"
          value={data.recent_suspicious_activity_count}
          valueClassName="text-red-600 dark:text-red-400"
          description="Suspicious events in last 24h"
          icon={<AlertOctagon className="h-4 w-4 text-red-500" />}
        />
      ) : data.failed_jobs_count > 0 ? (
        <PlatformMetricCard
          title="System Health"
          className="border-amber-500/50 bg-amber-500/5"
          value={`${data.failed_jobs_count} Errors`}
          valueClassName="text-amber-600 dark:text-amber-400"
          description="Background jobs failed recently"
          icon={<Activity className="h-4 w-4 text-amber-500" />}
        />
      ) : (
        <PlatformMetricCard
          title="System Health"
          value="Healthy"
          valueClassName="text-green-600 dark:text-green-400"
          description="No recent errors or alerts"
          icon={<Activity className="h-4 w-4" />}
        />
      )}
    </div>
  );
}
