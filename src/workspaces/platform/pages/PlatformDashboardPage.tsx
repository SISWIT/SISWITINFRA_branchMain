import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/ui/shadcn/alert";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { PlatformOverviewGrid } from "../domains/analytics/components/PlatformOverviewGrid";
import { RecentPlatformActivity } from "../domains/analytics/components/RecentPlatformActivity";
import { usePlatformOverview } from "../domains/analytics/hooks/usePlatformOverview";
import { usePlatformPermissions } from "../shared/auth/usePlatformPermissions";

export default function PlatformDashboardPage() {
  const { data, isLoading, error } = usePlatformOverview();
  const { isPlatformSuperAdmin } = usePlatformPermissions();

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Platform Overview"
        description="High-level metrics and system health across all instances."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load dashboard data</AlertTitle>
          <AlertDescription>
            {error.message}
            {isPlatformSuperAdmin && (
              <span className="block mt-2 font-mono text-xs opacity-80">
                Hint: Make sure migration 056_platform_dashboard_overview.sql was applied to the database.
              </span>
            )}
          </AlertDescription>
        </Alert>
      ) : (
        <PlatformOverviewGrid data={data} isLoading={isLoading} />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <RecentPlatformActivity />
        {/* We can add a usage graph or billing projections chart here in the future */}
      </div>
    </div>
  );
}
