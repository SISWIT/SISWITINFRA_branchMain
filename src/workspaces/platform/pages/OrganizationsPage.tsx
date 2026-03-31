import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, Building2, Loader2, MoreHorizontal, Play, UserCheck } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/ui/shadcn/alert";
import { Button } from "@/ui/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { Input } from "@/ui/shadcn/input";
import { Label } from "@/ui/shadcn/label";
import { Card, CardContent } from "@/ui/shadcn/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/shadcn/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/ui/shadcn/table";

import { useImpersonation } from "@/core/hooks/useImpersonation";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { PlatformFilterBar } from "../shared/components/PlatformFilterBar";
import { usePlatformOrganizations } from "../domains/organizations/hooks/usePlatformOrganizations";
import { PlatformOrganizationRow } from "../domains/organizations/types";
import { usePlatformPermissions } from "../shared/auth/usePlatformPermissions";
import { OrganizationStatusBadge } from "../domains/organizations/components/OrganizationStatusBadge";

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const { startImpersonation } = useImpersonation();
  const { can } = usePlatformPermissions();
  const canImpersonate = can("platform.impersonation.start");

  // State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const [impersonationTarget, setImpersonationTarget] = useState<PlatformOrganizationRow | null>(null);
  const [reason, setReason] = useState("");
  const [isImpersonating, setIsImpersonating] = useState(false);

  // Data
  const { data, isLoading, isError, error } = usePlatformOrganizations(
    { page, pageSize },
    { search, status: statusFilter, plan: planFilter }
  );

  // Handlers
  const handleStartImpersonation = async () => {
    if (!impersonationTarget || !reason.trim()) return;
    setIsImpersonating(true);
    
    try {
      await startImpersonation({
        organizationId: impersonationTarget.id,
        organizationSlug: impersonationTarget.slug,
        reason: reason.trim(),
      });
      navigate(`/${impersonationTarget.slug}/app/dashboard`);
    } catch {
      // Error handled by hook
    } finally {
      setIsImpersonating(false);
      setImpersonationTarget(null);
      setReason("");
    }
  };

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Organization Management"
        description="Manage all subscribed companies and their workspace access."
        actions={
          <Button asChild>
            <Link to="/platform/settings">Global Defaults</Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="px-6 border-b">
            <PlatformFilterBar
              searchQuery={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search by name or slug..."
              
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              statusPlaceholder="Any Status"
              statusOptions={[
                { label: "Active", value: "active" },
                { label: "Suspended", value: "suspended" },
                { label: "Trial", value: "trial" },
                { label: "Cancelled", value: "cancelled" },
              ]}

              roleFilter={planFilter} // Reuse role Filter UI for plan
              onRoleChange={setPlanFilter}
              rolePlaceholder="Any Plan"
              roleOptions={[
                { label: "Foundation", value: "foundation" },
                { label: "Growth", value: "growth" },
                { label: "Commercial", value: "commercial" },
                { label: "Enterprise", value: "enterprise" },
              ]}
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
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <Alert variant="destructive" className="max-w-md mx-auto my-4 text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Data</AlertTitle>
                        <AlertDescription>{error?.message || "Failed to query organizations"}</AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : data?.data.length ? (
                  data.data.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium leading-none">{row.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">/{row.slug}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <OrganizationStatusBadge status={row.status} />
                      </TableCell>
                      <TableCell>
                        <OrganizationStatusBadge status={row.plan_type} className="bg-primary/10 text-primary" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <UserCheck className="h-4 w-4" />
                          {row.active_users_count} / {row.max_users}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {canImpersonate && (
                              <DropdownMenuItem onClick={() => setImpersonationTarget(row)}>
                                <Play className="mr-2 h-4 w-4 text-primary" />
                                Impersonate Session
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link to={`/platform/organizations/${row.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/platform/subscriptions">Manage Subscription</Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {isLoading ? "Loading..." : "No organizations found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Simple Pagination Footer - Phase 3 scope */}
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

      {/* Impersonation Dialog */}
      <Dialog
        open={!!impersonationTarget}
        onOpenChange={(open) => {
          if (!open) {
            setImpersonationTarget(null);
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Impersonation Session</DialogTitle>
            <DialogDescription>
              You are about to impersonate <span className="font-semibold">{impersonationTarget?.name}</span>.
              This action will be heavily audited. Please provide a ticket number or reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="impersonation-reason-orgs">Reason for impersonation</Label>
            <Input
              id="impersonation-reason-orgs"
              placeholder="e.g. Investigating support ticket #1234"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && reason.trim()) void handleStartImpersonation();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setImpersonationTarget(null); setReason(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => void handleStartImpersonation()}
              disabled={!reason.trim() || isImpersonating}
            >
              {isImpersonating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Start Impersonation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
