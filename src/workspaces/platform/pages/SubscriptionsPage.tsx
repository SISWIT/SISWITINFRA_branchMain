import { useState } from "react";
import { CreditCard, AlertCircle, PackageCheck, Download, MoreHorizontal, Building2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/ui/shadcn/alert";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent } from "@/ui/shadcn/card";
import { Badge } from "@/ui/shadcn/badge";
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

import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { PlatformFilterBar, FilterOption } from "../shared/components/PlatformFilterBar";
import { usePlatformSubscriptions } from "../domains/subscriptions/hooks/usePlatformSubscriptions";
import { PlatformSubscriptionRow } from "../domains/subscriptions/types";
import { usePlatformPermissions } from "../shared/auth/usePlatformPermissions";
import { ManageModulesDialog } from "../domains/subscriptions/components/ManageModulesDialog";

export default function SubscriptionsPage() {
  const { can } = usePlatformPermissions();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");

  const { data, isLoading, isError, error } = usePlatformSubscriptions(
    { page, pageSize },
    { status: statusFilter, plan: planFilter }
  );

  const [selectedSub, setSelectedSub] = useState<PlatformSubscriptionRow | null>(null);
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false);

  const statusOptions: FilterOption[] = [
    { label: "Active", value: "active" },
    { label: "Suspended", value: "suspended" },
    { label: "Cancelled", value: "cancelled" },
    { label: "Trial", value: "trial" },
  ];

  const planOptions: FilterOption[] = [
    { label: "Foundation", value: "foundation" },
    { label: "Growth", value: "growth" },
    { label: "Commercial", value: "commercial" },
    { label: "Enterprise", value: "enterprise" },
  ];

  function countEnabledModules(subscription: PlatformSubscriptionRow): number {
    return [
      subscription.module_crm,
      subscription.module_clm,
      subscription.module_cpq,
      subscription.module_erp,
      subscription.module_documents,
    ].filter(Boolean).length;
  }

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="Subscriptions & Billing"
        description="Subscription status, module access, and plan coverage across all organizations."
        actions={
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Matrix
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="px-6 border-b">
            <PlatformFilterBar
              searchQuery={""}
              onSearchChange={() => {}}
              searchPlaceholder="Subscription searches are disabled."
              
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              statusPlaceholder="Any Status"
              statusOptions={statusOptions}

              roleFilter={planFilter}
              onRoleChange={setPlanFilter}
              rolePlaceholder="Any Plan"
              roleOptions={planOptions}
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
                  <TableHead>Plan Matrix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isError ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <Alert variant="destructive" className="max-w-md mx-auto my-4 text-left">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error Loading Data</AlertTitle>
                        <AlertDescription>{error?.message || "Failed to query subscriptions"}</AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : data?.data.length ? (
                  data.data.map((row: PlatformSubscriptionRow) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium leading-none">{row.organization?.name || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">/{row.organization?.slug || "-"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="uppercase">
                            <CreditCard className="mr-1 h-3 w-3" />
                            {row.plan_type}
                          </Badge>
                          <Badge variant="secondary">
                            <PackageCheck className="mr-1 h-3 w-3" />
                            {countEnabledModules(row)} modules
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={`capitalize ${
                            row.status === "active" 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                              : row.status === "suspended" || row.status === "cancelled"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" 
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                          }`}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">{new Date(row.updated_at).toLocaleDateString()}</div>
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
                            <DropdownMenuItem 
                              disabled={!can("platform.settings.write")}
                              onClick={() => {
                                setSelectedSub(row);
                                setIsModuleDialogOpen(true);
                              }}
                            >
                              Manage Modules
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!can("platform.settings.write")} className="text-destructive focus:text-destructive">
                              Suspend Subscription
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {isLoading ? "Loading subscriptions..." : "No subscriptions matched your filters."}
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

      <ManageModulesDialog
        subscription={selectedSub}
        isOpen={isModuleDialogOpen}
        onOpenChange={setIsModuleDialogOpen}
      />
    </div>
  );
}
