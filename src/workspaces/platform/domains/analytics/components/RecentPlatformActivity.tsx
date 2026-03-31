import { useQuery } from "@tanstack/react-query";
import { Activity, UserPlus, Play } from "lucide-react";
import { supabase } from "@/core/api/client";
import { platformKeys } from "../../../shared/api/queryKeys";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/ui/shadcn/card";
import { PlatformActivityEvent } from "../types";

export function RecentPlatformActivity() {
  const { data: events, isLoading } = useQuery({
    queryKey: [...platformKeys.auditLogs.all(), "recent-dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select(`
          id,
          action,
          entity_id,
          metadata,
          created_at
        `)
        .in("action", ["organization_created", "impersonation_started"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Map it to our generic type
      return (data || []).map((row: any) => {
        // Since we don't have a direct FK to profiles from audit_logs,
        // we extract the user's email from metadata (if available) or generic fallback.
        const actorEmail = row.metadata?.actor_email || row.metadata?.user_email || "system@local";
        const actorName = row.metadata?.actor_name || "Unknown";
        
        return {
          id: row.id,
          action: row.action,
          target_id: row.entity_id, // Map DB column to frontend property
          actor_name: actorName,
          actor_email: actorEmail,
          metadata: row.metadata || {},
          created_at: row.created_at,
        };
      }) as PlatformActivityEvent[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform-level events.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted/50 rounded-md animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest platform-level events.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground py-4 text-center">
            No recent activity recorded.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform-level events.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {events.map((event) => {
            const isCreation = event.action === "organization_created";
            const Icon = isCreation ? UserPlus : event.action === "impersonation_started" ? Play : Activity;
            
            return (
              <div key={event.id} className="flex gap-4">
                <div className="mt-0.5 relative flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {isCreation ? "New organization created" : event.action === "impersonation_started" ? "Impersonation session started" : event.action}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by {event.actor_email}
                    {event.metadata?.reason ? ` (Reason: ${event.metadata.reason})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
