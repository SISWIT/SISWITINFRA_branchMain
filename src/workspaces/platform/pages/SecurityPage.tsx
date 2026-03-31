import { useState } from "react";
import { 
  Loader2, 
  ShieldAlert, 
  UserX, 
  Clock 
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { usePlatformSecurity } from "../domains/security/hooks/usePlatformSecurity";
import { usePlatformImpersonationMutation } from "../domains/security/hooks/usePlatformImpersonationMutation";
import { PlatformDangerActionDialog } from "../shared/components/PlatformDangerActionDialog";

export default function SecurityPage() {
  const { data, isLoading, refetch } = usePlatformSecurity();
  const mutation = usePlatformImpersonationMutation();
  const [sessionToKill, setSessionToKill] = useState<string | null>(null);

  const handleKillSession = async () => {
    if (!sessionToKill) return;
    await mutation.mutateAsync(sessionToKill);
    setSessionToKill(null);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { active_sessions_count, active_impersonations } = data || { active_sessions_count: 0, active_impersonations: [] };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Security & Impersonation"
        description="Monitor and forcibly terminate active administrative sessions across the platform."
        actions={
          <Button variant="outline" onClick={() => refetch()}>Refresh View</Button>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <ShieldAlert className="h-4 w-4 text-amber-500" /> 
               Active Impersonations
            </CardTitle>
            <CardDescription>Super Admins currently inside workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{active_sessions_count}</div>
            <p className="text-sm text-muted-foreground mt-2">Sessions are tracked for auditing.</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Session Ledger</CardTitle>
            <CardDescription>Live feed of who is impersonating which organization.</CardDescription>
          </CardHeader>
          <CardContent>
            {active_impersonations.length === 0 ? (
               <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                 No active impersonation sessions at this time.
               </div>
            ) : (
               <div className="space-y-4">
                 {active_impersonations.map(session => (
                    <div key={session.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg justify-between items-start">
                       <div className="space-y-1">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {session.admin_profile?.full_name || session.admin_profile?.email || "Unknown Admin"}
                            <span className="text-muted-foreground text-xs font-normal">in</span>
                            <span className="text-primary hover:underline cursor-pointer">
                               {session.organization?.name || "Unknown Org"}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                             <Clock className="h-3 w-3" /> Started: {new Date(session.started_at).toLocaleString()}
                          </div>
                          <div className="text-xs bg-muted p-2 rounded mt-2 font-mono">
                             <span className="font-semibold">Reason:</span> {session.reason}
                          </div>
                       </div>
                       <Button 
                          variant="destructive" 
                          size="sm"
                          className="shrink-0"
                          onClick={() => setSessionToKill(session.id)}
                       >
                         <UserX className="h-4 w-4 mr-2" /> Force End
                       </Button>
                    </div>
                 ))}
               </div>
            )}
          </CardContent>
        </Card>
      </div>

      <PlatformDangerActionDialog
        open={!!sessionToKill}
        onOpenChange={(open) => !open && setSessionToKill(null)}
        title="Force End Impersonation"
        description="This will instantly drop the administrator out of the tenant workspace and invalidate their temporary context."
        requireMatchString="END SESSION"
        onConfirm={handleKillSession}
        isProcessing={mutation.isPending}
      />
    </div>
  );
}
