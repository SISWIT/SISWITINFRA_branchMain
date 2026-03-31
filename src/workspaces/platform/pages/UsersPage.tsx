import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, AlertCircle, Building2, Download, MoreHorizontal, User, Shield } from "lucide-react";
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

import { toast } from "sonner";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";
import { PlatformFilterBar, FilterOption } from "../shared/components/PlatformFilterBar";
import { usePlatformUsers } from "../domains/users/hooks/usePlatformUsers";
import { PlatformUserRow } from "../domains/users/types";
import { usePlatformPermissions } from "../shared/auth/usePlatformPermissions";

const roleLabel: Record<string, string> = {
  platform_super_admin: "Platform Super Admin",
  platform_admin: "Platform Admin",
  owner: "Owner",
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
  user: "User",
  client: "Client",
};

export default function UsersPage() {
  const { can } = usePlatformPermissions();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");

  const { data, isLoading, isError, error } = usePlatformUsers(
    { page, pageSize },
    { search, state: stateFilter, role: roleFilter }
  );

  const handleCopyId = (userId: string) => {
    navigator.clipboard.writeText(userId).catch(() => {});
    toast.success("Copied User ID", { description: "The user's Auth UUID was copied to your clipboard." });
  };

  const statusOptions: FilterOption[] = [
    { label: "Active", value: "active" },
    { label: "Pending Verification", value: "pending_verification" },
    { label: "Pending Approval", value: "pending_approval" },
    { label: "Suspended", value: "suspended" },
  ];

  const roleOptions: FilterOption[] = [
    { label: "Admin", value: "admin" },
    { label: "Owner", value: "owner" },
    { label: "Manager", value: "manager" },
    { label: "Employee", value: "employee" },
    { label: "Client", value: "client" },
  ];

  return (
    <div className="space-y-6">
      <PlatformPageHeader
        title="User Management"
        description="Global directory of all memberships and identities across organizations."
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
              searchQuery={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search email or role..."
              
              statusFilter={stateFilter}
              onStatusChange={setStateFilter}
              statusPlaceholder="Any State"
              statusOptions={statusOptions}

              roleFilter={roleFilter}
              onRoleChange={setRoleFilter}
              rolePlaceholder="Any Role"
              roleOptions={roleOptions}
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
                  <TableHead>User</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Account State</TableHead>
                  <TableHead>Joined</TableHead>
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
                        <AlertDescription>{error?.message || "Failed to query system users"}</AlertDescription>
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : data?.data.length ? (
                  data.data.map((row: PlatformUserRow) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted/50">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="space-y-1">
                            <div className="font-medium leading-none">{row.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.organization ? (
                          <div className="flex items-center gap-1.5 text-sm text-foreground">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            {row.organization.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {["admin", "owner", "platform_admin"].includes(row.role.toLowerCase()) && (
                            <Shield className="h-3 w-3 text-primary" />
                          )}
                          <span className="capitalize">{roleLabel[row.role] || row.role}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge 
                            variant="outline" 
                            className={`capitalize ${
                              row.account_state === "active" 
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : row.account_state === "suspended"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" 
                                : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                            }`}
                          >
                            {row.account_state.replace(/_/g, ' ')}
                          </Badge>
                          {!row.is_active && (
                            <span className="text-xs text-muted-foreground/80">(Inactive flag)</span>
                          )}
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
                            <DropdownMenuItem onClick={() => handleCopyId(row.user_id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Copy Auth UUID
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/platform/users/${row.user_id}`}>View User Profile</Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled={!can("platform.settings.write")} className="text-destructive focus:text-destructive">
                              Suspend Account
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      {isLoading ? "Loading users..." : "No users matched your filters."}
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
    </div>
  );
}
