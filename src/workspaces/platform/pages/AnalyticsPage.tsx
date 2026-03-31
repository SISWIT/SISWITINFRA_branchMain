import { BarChart3, TrendingUp, Users, Activity, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { usePlatformAnalytics } from "../domains/analytics/hooks/usePlatformAnalytics";

export default function AnalyticsPage() {
  const { overview, isLoading, error } = usePlatformAnalytics();

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !overview) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-destructive">
        Error loading analytics data. Please try again later.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <PlatformPageHeader
        title="Advanced Domain Analytics"
        description="Event-driven telemetry for core platform entities."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Metric Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Domain Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total immutable domain changes logged.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tenants (7d)</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.recentActiveOrgs}</div>
            <p className="text-xs text-muted-foreground">Unique organizations modifying state.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Event Breakdown
            </CardTitle>
            <CardDescription>Distribution of events by type.</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.eventsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No event data currently logged.</p>
            ) : (
              <div className="space-y-4 pt-4">
                {overview.eventsByType.map(evt => (
                  <div key={evt.type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{evt.type}</span>
                    <span className="text-sm text-muted-foreground">{evt.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Organizational Velocity
            </CardTitle>
            <CardDescription>Daily active organizations performing structural actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 pt-4">
              {overview.dailyActiveOrgs.map((day, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{day.date}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden flex justify-end">
                       <div 
                         className="h-full bg-primary" 
                         style={{ width: `${Math.min(100, (day.count / Math.max(1, overview.recentActiveOrgs)) * 100)}%` }}
                       />
                    </div>
                    <span className="text-sm text-muted-foreground w-6 text-right">{day.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
