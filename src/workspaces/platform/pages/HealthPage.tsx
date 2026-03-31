import { useState } from "react";
import { 
  Loader2, 
  Activity, 
  AlertTriangle, 
  PlayCircle, 
  CheckCircle2, 
  RefreshCcw, 
  Server
} from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { usePlatformHealth } from "../domains/health/hooks/usePlatformHealth";
import { usePlatformJobMutation } from "../domains/health/hooks/usePlatformJobMutation";

export default function HealthPage() {
  const { data, isLoading, refetch } = usePlatformHealth();
  const mutation = usePlatformJobMutation();
  const [isRequeueing, setIsRequeueing] = useState<string | null>(null);

  const handleRequeue = async (jobId: string) => {
    setIsRequeueing(jobId);
    await mutation.mutateAsync({ jobIds: [jobId], reason: "Manual requeue from health dashboard" });
    setIsRequeueing(null);
  };

  const handleRequeueAll = async () => {
    if (!data?.recentFailedJobs) return;
    const ids = data.recentFailedJobs.map(j => j.id);
    await mutation.mutateAsync({ jobIds: ids, reason: "Bulk requeue from health dashboard" });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { jobStats, recentFailedJobs } = data || { 
    jobStats: { queued: 0, processing: 0, failed: 0, succeeded: 0, total: 0 }, 
    recentFailedJobs: [] 
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="System Health & Jobs"
        description="Monitor background workers, queue status, and system integrations."
        actions={
          <div className="flex gap-2">
             <Button variant="outline" onClick={() => refetch()}><RefreshCcw className="mr-2 h-4 w-4" /> Refresh Data</Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queued Jobs</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.queued}</div>
            <p className="text-xs text-muted-foreground">Waiting for workers</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.processing}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Jobs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${jobStats.failed > 0 ? 'text-red-500' : ''}`}>
              {jobStats.failed}
            </div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Succeeded (All Time)</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats.succeeded.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Completed successfully</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Failed Jobs</CardTitle>
            <CardDescription>
              Jobs that exceeded maximum retry attempts or crashed critically.
            </CardDescription>
          </div>
          {recentFailedJobs.length > 0 && (
            <Button variant="secondary" size="sm" onClick={handleRequeueAll} disabled={mutation.isPending}>
              Requeue All Shown
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {recentFailedJobs.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground flex flex-col items-center border border-dashed rounded-lg">
               <CheckCircle2 className="h-10 w-10 text-green-500/50 mb-3" />
               <p>The queue is healthy. No recent job failures.</p>
            </div>
          ) : (
             <div className="space-y-4">
               {recentFailedJobs.map(job => (
                 <div key={job.id} className="p-4 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 rounded-lg flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div className="space-y-2 flex-1">
                       <div className="flex items-center gap-2">
                          <Badge variant="destructive">{job.job_type}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">ID: {job.id.substring(0,8)}</span>
                          <span className="text-xs text-muted-foreground">&middot; {new Date(job.created_at).toLocaleString()}</span>
                       </div>
                       
                       <div className="text-sm font-medium text-foreground">
                          {job.organization ? (
                             <span className="flex items-center gap-1">
                                <Server className="h-3 w-3" /> {job.organization.name}
                             </span>
                          ) : "System Level Job"}
                       </div>

                       <div className="text-sm bg-white dark:bg-black/40 p-2 border rounded font-mono text-red-600 dark:text-red-400 break-all overflow-hidden line-clamp-2">
                          {job.last_error || "Unknown Error"}
                       </div>
                       
                       <div className="text-xs font-semibold text-muted-foreground">
                          Failed after {job.attempts} / {job.max_attempts} attempts
                       </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="shrink-0"
                      onClick={() => handleRequeue(job.id)}
                      disabled={isRequeueing === job.id || mutation.isPending}
                    >
                      {isRequeueing === job.id ? "Working..." : "Requeue Job"}
                    </Button>
                 </div>
               ))}
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
