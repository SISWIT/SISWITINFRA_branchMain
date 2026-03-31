import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, UserCheck, CalendarDays, ExternalLink, Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { Alert, AlertDescription, AlertTitle } from "@/ui/shadcn/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/ui/shadcn/tabs";

import { usePlatformOrganizationDetail } from "../domains/organizations/hooks/usePlatformOrganizationDetail";
import { OrganizationStatusBadge } from "../domains/organizations/components/OrganizationStatusBadge";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";

import { usePlatformUsage } from "../domains/subscriptions/hooks/usePlatformUsage";
import { LimitOverrideDialog } from "../domains/subscriptions/components/LimitOverrideDialog";
import { useState } from "react";
import { Progress } from "@/ui/shadcn/progress";
import { Badge } from "@/ui/shadcn/badge";

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading, isError, error } = usePlatformOrganizationDetail(id!);
  const { data: usage, isLoading: isUsageLoading } = usePlatformUsage(id!);

  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [isLimitDialogOpen, setIsLimitDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="p-6">
        <Button variant="ghost" asChild className="mb-6 -ml-4 hover:bg-transparent">
          <Link to="/platform/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
          </Link>
        </Button>
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTitle>Error Loading Organization</AlertTitle>
          <AlertDescription>{error?.message || "Organization not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Button variant="ghost" asChild className="-ml-4 mb-2 h-8 hover:bg-transparent text-muted-foreground">
          <Link to="/platform/organizations">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Organizations
          </Link>
        </Button>
        <PlatformPageHeader
          title={org.name}
          description={`Organization ID: ${org.id}`}
          actions={
            <div className="flex gap-2">
              <Button variant="outline">Suspend Organization</Button>
              <Button>Edit Configuration</Button>
            </div>
          }
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <OrganizationStatusBadge status={org.status} />
        <OrganizationStatusBadge status={org.plan_type} className="bg-primary/10 text-primary" />
        <span className="inline-flex items-center rounded-md bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
          /{org.slug}
        </span>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="billing">Billing & Limits</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{org.active_users_count}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Limit: {org.max_users} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Date Created</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(org.created_at).toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated {new Date(org.updated_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Company Details</CardTitle>
                <CardDescription>Primary contact and identity information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground">Org Code</span>
                  <span className="font-mono">{org.org_code}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4"/> Email</span>
                  <span>{org.company_email || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4"/> Phone</span>
                  <span>{org.company_phone || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4"/> Address</span>
                  <span>{org.company_address || "Not provided"}</span>
                </div>
                <div className="flex items-center justify-between py-2 text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><ExternalLink className="h-4 w-4"/> Website</span>
                  {org.company_website ? (
                    <a href={org.company_website} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                      {org.company_website}
                    </a>
                  ) : "Not provided"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Platform Management</CardTitle>
                <CardDescription>Advanced administrative controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground">Owner User ID</span>
                  <span className="font-mono text-xs">{org.owner_user_id || "Unassigned"}</span>
                </div>
                 <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span className="text-muted-foreground">Storage Limit</span>
                  <span>{org.max_storage_mb} MB</span>
                </div>
                <div className="pt-4 space-y-2">
                   <Button variant="secondary" className="w-full justify-start">
                     Reset Workspace Cache
                   </Button>
                   <Button variant="secondary" className="w-full justify-start">
                     Force Password Reset All Users
                   </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground h-40 flex items-center justify-center">
              Member list implementation pending
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage & Limits</CardTitle>
              <CardDescription>
                Manual overrides set here will bypass global plan default limits.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isUsageLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : !usage || Object.keys(usage).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No usage data tracked for this organization.</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {Object.entries(usage)
                      .filter(([key]) => ["storage_mb", "contacts", "users", "api_calls"].includes(key))
                      .map(([key, metrics]) => (
                        <div key={key} className="space-y-2 p-4 border rounded-lg bg-muted/20">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold capitalize">{key.replace("_", " ")}</span>
                            <span className="text-muted-foreground">
                              {metrics.current_count.toLocaleString()} / {metrics.max_allowed >= 999999999 ? "∞" : metrics.max_allowed.toLocaleString()}
                            </span>
                          </div>
                          <Progress value={Math.min(metrics.usage_percent, 100)} className="h-2" />
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase tracking-wider">
                            <span>{metrics.usage_percent}% utilized</span>
                            <Button 
                              variant="link" 
                              className="h-auto p-0 text-[10px]"
                              onClick={() => {
                                setSelectedResource(key);
                                setIsLimitDialogOpen(true);
                              }}
                            >
                              Adjust Limit
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>

                  <div className="rounded-md border">
                    <div className="bg-muted/50 p-2 text-xs font-semibold grid grid-cols-4 items-center">
                       <span className="pl-4">Resource Type</span>
                       <span>Period</span>
                       <span>Current Count</span>
                       <span className="text-right pr-4">Action</span>
                    </div>
                    <div className="divide-y overflow-hidden">
                      {Object.entries(usage).map(([key, metrics]) => (
                        <div key={key} className="p-3 grid grid-cols-4 items-center text-sm hover:bg-muted/30">
                           <span className="font-medium capitalize pl-4">{key.replace("_", " ")}</span>
                           <Badge variant="outline" className="w-fit text-[10px] h-5">{metrics.period}</Badge>
                           <span className="text-muted-foreground">{metrics.current_count.toLocaleString()}</span>
                           <div className="text-right pr-4">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-primary"
                                onClick={() => {
                                  setSelectedResource(key);
                                  setIsLimitDialogOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <LimitOverrideDialog
            organizationId={id!}
            resourceType={selectedResource || ""}
            currentLimit={selectedResource ? usage?.[selectedResource]?.max_allowed || 0 : 0}
            isOpen={isLimitDialogOpen}
            onOpenChange={setIsLimitDialogOpen}
          />
        </TabsContent>

        <TabsContent value="audit">
           <Card>
            <CardContent className="p-6 text-center text-muted-foreground h-40 flex items-center justify-center">
              Audit log feed implementation pending
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
