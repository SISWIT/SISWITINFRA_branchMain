import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2,
  Database, 
  Users, 
  BarChart3, 
  LayoutGrid, 
  HardDrive
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { getGlobalUsageStats, GlobalUsageStat } from "../domains/subscriptions/api/getGlobalUsageStats";
import { platformKeys } from "../shared/api/queryKeys";

export default function UsageDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: [...platformKeys.subscriptions.all(), "global-usage"],
    queryFn: getGlobalUsageStats,
  });

  const [filter, setFilter] = useState<string>("all");

  const filteredStats = useMemo(() => {
    if (!stats) return [];
    if (filter === "all") return stats;
    return stats.filter(s => s.resource_type.includes(filter));
  }, [stats, filter]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Common resources icons
  const getIcon = (type: string) => {
    if (type.includes("storage")) return <HardDrive className="h-4 w-4" />;
    if (type.includes("user")) return <Users className="h-4 w-4" />;
    if (type.includes("api")) return <BarChart3 className="h-4 w-4" />;
    return <Database className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Resource Usage Analytics"
        description="Global cross-tenant data metrics for storage, users, and API consumption."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setFilter("all")}>Reset View</Button>
            <Button variant="outline" onClick={() => setFilter("storage")}>Storage Focus</Button>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredStats.map((stat: GlobalUsageStat) => (
          <Card key={stat.resource_type} className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-base font-bold capitalize flex items-center gap-2">
                  {getIcon(stat.resource_type)}
                  {stat.resource_type.replace("_", " ")}
                </CardTitle>
                <CardDescription>
                  Tracking across {stat.org_count} organizations
                </CardDescription>
              </div>
              <Badge variant="secondary">Total: {stat.total_usage.toLocaleString()}</Badge>
            </CardHeader>
            <CardContent>
              <div className="mt-4 space-y-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">Top Consumers</h4>
                <div className="space-y-2">
                  {stat.top_consumers.map((consumer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50 text-sm">
                       <div className="flex items-center gap-2">
                          <div className="w-5 text-center text-[10px] font-mono text-muted-foreground">{idx + 1}</div>
                          <span className="font-medium">{consumer.organization_name}</span>
                       </div>
                       <div className="flex items-center gap-3">
                          <span className="font-mono text-xs">{consumer.usage.toLocaleString()}</span>
                          {/* We don't have org ID here easily in current API, but slug is there for detail links if we want them */}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!filteredStats.length && (
         <div className="flex flex-col items-center justify-center py-20 border rounded-xl border-dashed">
            <LayoutGrid className="h-10 w-10 text-muted-foreground/20 mb-4" />
            <p className="text-muted-foreground">No matching resource data found in the tracking registry.</p>
         </div>
      )}
    </div>
  );
}
