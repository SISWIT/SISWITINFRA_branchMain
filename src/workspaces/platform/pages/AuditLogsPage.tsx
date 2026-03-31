import { useState } from "react";
import { Activity, AlertCircle, Building2, Download, ShieldAlert, Key } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/ui/shadcn/alert";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/shadcn/table";

import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { PlatformFilterBar, FilterOption } from "../shared/components/PlatformFilterBar";
import { usePlatformAuditLogs } from "../domains/audit-logs/hooks/usePlatformAuditLogs";
import { PlatformAuditLogRow } from "../domains/audit-logs/types";
import { PlatformAuditMetadataDialog } from "../shared/components/PlatformAuditMetadataDialog";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState("all");

  const [selectedLog, setSelectedLog] = useState<PlatformAuditLogRow | null>(null);

  const { data, isLoading, isError, error } = usePlatformAuditLogs(
    { page, pageSize },
    { action: actionFilter, entity: entityFilter }
  );

  const actionOptions: FilterOption[] = [
    { label: "Organization Created", value: "organization_created" },
    { label: "Subscription Updated", value: "subscription_updated" },
    { label: "Role Changed", value: "role_changed" },
    { label: "Impersonation", value: "impersonation_started" },
    { label: "Platform Setting", value: "platform_setting_changed" },
  ];

  const entityOptions: FilterOption[] = [
    { label: "Organization", value: "organization" },
    { label: "Subscription", value: "subscription" },
    { label: "User", value: "user" },
    { label: "Impersonation", value: "impersonation" },
    { label: "System", value: "system" },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes("impersonation")) return <Key className="h-4 w-4 text-amber-500" />;
    if (action.includes("security") || action.includes("delete")) return <ShieldAlert className="h-4 w-4 text-destructive" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Platform Audit Logs"
        description="Global ledger of security, administrative, and system events."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="px-6 border-b">
            <PlatformFilterBar
              searchQuery={""}
              onSearchChange={() => {}}
              searchPlaceholder="Use advanced filters"
              
              statusFilter={actionFilter}
              onStatusChange={setActionFilter}
              statusPlaceholder="Any Action"
              statusOptions={actionOptions}

              roleFilter={entityFilter}
              onRoleChange={setEntityFilter}
              rolePlaceholder="Any Entity"
              roleOptions={entityOptions}
            />
          </div>

          <div className="relative">
            {isLoading && (
              <div className="absolute inset-x-0 top-0 h-1 z-10 animate-pulse bg-primary/20">
                <div className="h-full bg-primary w-1/3 animate-ping" />
              </div>
            )}
            
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Actor / System</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Alert variant="destructive" className="max-w-md mx-auto my-4 text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Data</AlertTitle>
                        <AlertDescription>{error?.message || "Failed to query audit logs"}</AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : data?.data.length ? (
                  data.data.map((row: PlatformAuditLogRow) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(row.action)}
                          <span className="font-medium text-sm">{row.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className="w-fit">{row.entity_type}</Badge>
                          <span className="text-xs text-muted-foreground font-mono">{row.entity_id.split('-')[0]}...</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{row.actor_email}</div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            {row.organization ? (
                              <>
                                <Building2 className="h-3 w-3" />
                                {row.organization.slug}
                              </>
                            ) : (
                              <span className="italic">platform</span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">
                          {new Date(row.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(row.created_at).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedLog(row)}
                        >
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {isLoading ? "Loading events..." : "No events matched your filters."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing page {page} of {data.totalPages} ({data.count} total)
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={page >= data.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedLog && (
        <PlatformAuditMetadataDialog 
          open={!!selectedLog} 
          onOpenChange={(open) => { if (!open) setSelectedLog(null); }} 
          metadata={selectedLog.metadata} 
        />
      )}
    </div>
  );
}
