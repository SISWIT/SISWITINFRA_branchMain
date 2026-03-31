import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, User, Mail, Shield, Phone, CalendarDays, Building2 } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/ui/shadcn/card";
import { Alert, AlertDescription, AlertTitle } from "@/ui/shadcn/alert";
import { Badge } from "@/ui/shadcn/badge";

import { usePlatformUserDetail } from "../domains/users/hooks/usePlatformUserDetail";
import { PlatformPageHeader } from "../shared/components/PlatformPageHeader";

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

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: user, isLoading, isError, error } = usePlatformUserDetail(id!);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="p-6">
        <Button variant="ghost" asChild className="mb-6 -ml-4 hover:bg-transparent">
          <Link to="/platform/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Link>
        </Button>
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTitle>Error Loading User</AlertTitle>
          <AlertDescription>{error?.message || "User profiling not found"}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Button variant="ghost" asChild className="-ml-4 mb-2 h-8 hover:bg-transparent text-muted-foreground">
          <Link to="/platform/users">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
          </Link>
        </Button>
        <PlatformPageHeader
          title={
            user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : user.first_name || user.email || "Unknown User"
          }
          description={user.email || "No email provided"}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" className="text-destructive hover:bg-destructive/10">Global Suspend</Button>
              <Button>Security Reset</Button>
            </div>
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Identity Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex justify-center mb-6">
               <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-inner">
                  <User className="h-10 w-10 text-primary/60" />
               </div>
             </div>
             
             <div className="space-y-3">
               <div className="flex flex-col text-sm border-b pb-2 gap-1">
                 <span className="text-muted-foreground flex items-center gap-2"><Mail className="h-4 w-4"/> Email</span>
                 <span className="font-medium">{user.email || "—"}</span>
               </div>
               <div className="flex flex-col text-sm border-b pb-2 gap-1">
                 <span className="text-muted-foreground flex items-center gap-2"><Phone className="h-4 w-4"/> Phone</span>
                 <span className="font-medium">{user.phone_number || "—"}</span>
               </div>
               <div className="flex flex-col text-sm border-b pb-2 gap-1">
                 <span className="text-muted-foreground flex items-center gap-2"><CalendarDays className="h-4 w-4"/> Auth ID Created</span>
                 <span className="font-medium">{new Date(user.created_at).toLocaleDateString()}</span>
               </div>
               <div className="flex flex-col text-sm pb-2 gap-1">
                 <span className="text-muted-foreground flex items-center gap-2"><Shield className="h-4 w-4"/> Auth ID</span>
                 <span className="font-mono text-xs">{user.user_id}</span>
               </div>
             </div>
          </CardContent>
        </Card>

        {/* Organizations / Memberships Card */}
        <Card className="md:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Organization Memberships</CardTitle>
            <CardDescription>All workspaces this user is attached to</CardDescription>
          </CardHeader>
          <CardContent>
            {user.memberships.length === 0 ? (
               <div className="pt-8 pb-12 flex flex-col items-center justify-center text-center">
                 <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                 <p className="text-muted-foreground">This user is not a member of any organizations.</p>
               </div>
            ) : (
              <div className="space-y-4">
                 {user.memberships.map((membership) => (
                   <div key={membership.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/20">
                     <div className="flex items-start gap-4">
                       <div className="p-2 bg-background border rounded-md">
                         <Building2 className="h-5 w-5 text-muted-foreground" />
                       </div>
                       <div>
                         <h4 className="font-semibold text-foreground">{membership.organization_name}</h4>
                         <p className="text-sm text-muted-foreground font-mono mb-1">/{membership.organization_slug}</p>
                         <div className="flex items-center gap-2 mt-2">
                            <Badge 
                                variant="outline" 
                                className={`capitalize ${
                                  membership.account_state === "active" 
                                    ? "bg-green-100/50 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                    : membership.account_state === "suspended"
                                    ? "bg-red-100/50 text-red-700 dark:bg-red-900/30 dark:text-red-300" 
                                    : "bg-amber-100/50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                }`}
                              >
                                {membership.account_state.replace(/_/g, ' ')}
                            </Badge>
                            {!membership.is_active && (
                              <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800">Inactive</Badge>
                            )}
                         </div>
                       </div>
                     </div>
                     <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                        <div className="flex items-center gap-1.5">
                           {["admin", "owner", "platform_admin"].includes(membership.role.toLowerCase()) && (
                             <Shield className="h-3.5 w-3.5 text-primary" />
                           )}
                           <span className="font-medium text-sm text-foreground/90">{roleLabel[membership.role] || membership.role}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Joined {new Date(membership.created_at).toLocaleDateString()}</span>
                     </div>
                   </div>
                 ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
