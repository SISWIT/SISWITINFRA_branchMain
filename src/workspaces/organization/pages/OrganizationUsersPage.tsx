import { useMemo, useState } from "react";
import { Loader2, MoreHorizontal, Pencil, Search, Send, Trash2 } from "lucide-react";
import { Input } from "@/ui/shadcn/input";
import { Button } from "@/ui/shadcn/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
import { Label } from "@/ui/shadcn/label";
import type { Database } from "@/core/api/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/ui/shadcn/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/shadcn/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/ui/shadcn/dialog";
import { supabase } from "@/core/api/client";
import { toast } from "sonner";
import { useOrganizationOwnerData, type OrganizationOwnerMembership } from "@/workspaces/organization/hooks/useOrganizationOwnerData";
import { useAuth } from "@/core/auth/useAuth";

type RoleFilter = "all" | "owner" | "admin" | "manager" | "employee" | "client";
type StateFilter = "all" | "active" | "pending_approval" | "rejected" | "disabled";

const roleFilters: RoleFilter[] = ["all", "owner", "admin", "manager", "employee", "client"];
const stateFilters: StateFilter[] = ["all", "active", "pending_approval", "rejected", "disabled"];
const editableRoles = ["admin", "manager", "employee", "client"];

export default function OrganizationUsersPage() {
  const { organization, loading, memberships, roleDistribution, refresh } = useOrganizationOwnerData();
  const { inviteEmployee, inviteClient } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");

  // Action state
  const [memberToRemove, setMemberToRemove] = useState<OrganizationOwnerMembership | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<OrganizationOwnerMembership | null>(null);
  const [editRole, setEditRole] = useState<string>("");
  const [actionLoading, setActionLoading] = useState(false);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return memberships.filter((member) => {
      if (roleFilter !== "all" && member.role !== roleFilter) return false;
      if (stateFilter !== "all" && member.account_state !== stateFilter) return false;
      if (!query) return true;
      return member.email.toLowerCase().includes(query);
    });
  }, [memberships, roleFilter, search, stateFilter]);

  // --- Action handlers ---
  const handleRemoveMember = async () => {
    if (!memberToRemove) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("organization_memberships")
        .delete()
        .eq("id", memberToRemove.id);

      if (error) throw error;
      toast.success(`Removed ${memberToRemove.email} from the organization.`);
      await refresh();
    } catch (err: unknown) {
      toast.error(`Failed to remove user: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(false);
      setMemberToRemove(null);
    }
  };

  const handleEditRole = async () => {
    if (!memberToEdit || !editRole) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("organization_memberships")
        .update({ role: editRole as Database["public"]["Enums"]["app_role"] })
        .eq("id", memberToEdit.id);

      if (error) throw error;
      toast.success(`Updated ${memberToEdit.email} role to ${editRole}.`);
      await refresh();
    } catch (err: unknown) {
      toast.error(`Failed to update role: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(false);
      setMemberToEdit(null);
    }
  };

  const handleResendInvite = async (member: OrganizationOwnerMembership) => {
    if (!organization?.id) return;
    setActionLoading(true);
    try {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      let result;

      if (member.role === "client") {
        result = await inviteClient({
          organizationId: organization.id,
          email: member.email,
          expiresAt,
        });
      } else {
        result = await inviteEmployee({
          organizationId: organization.id,
          email: member.email,
          role: member.role as any, // app_role enum
          expiresAt,
        });
      }

      if (result.error) throw new Error(result.error);
      
      if (result.emailError) {
        toast.warning(`Invitation created, but email failed: ${result.emailError}`);
      } else {
        toast.success(`Invitation resent to ${member.email}.`);
      }
    } catch (err: unknown) {
      toast.error(`Failed to resend invite: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !organization) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight">User Management</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review organization memberships by role and account state.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {roleDistribution.map((role) => (
          <article 
            key={role.role} 
            className="p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-lg transition-transform hover:scale-[1.02]"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{role.role}</p>
            <p className="mt-2 font-mono text-3xl font-bold tracking-tight">{role.count}</p>
          </article>
        ))}
      </section>

      <section className="p-6 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-xl space-y-6">
        <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="pl-9" placeholder="Search by email" />
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as RoleFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleFilters.map((role) => (
                <SelectItem key={role} value={role}>
                  {role === "all" ? "All roles" : role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={(value) => setStateFilter(value as StateFilter)}>
            <SelectTrigger>
              <SelectValue placeholder="Account state" />
            </SelectTrigger>
            <SelectContent>
              {stateFilters.map((state) => (
                <SelectItem key={state} value={state}>
                  {state === "all" ? "All states" : state}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No members match the selected filters.</p>
        ) : (
          <div className="space-y-2">
            {filteredMembers.map((member) => (
              <article
                key={member.id}
                className="grid items-center gap-4 rounded-2xl border border-border/20 bg-background/40 p-4 transition-all hover:bg-background/60 hover:shadow-md md:grid-cols-[1.5fr_120px_160px_100px_60px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{member.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(member.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm capitalize">{member.role}</p>
                <p className="text-sm capitalize">{member.account_state.replace("_", " ")}</p>
                <span className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-xs font-medium ${
                  member.is_active
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : member.account_state === "pending_approval"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {member.is_active ? "Active" : member.account_state === "pending_approval" ? "Pending" : "Disabled"}
                </span>
                <div className="flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {member.role !== "owner" && (
                        <DropdownMenuItem
                          onClick={() => {
                            setMemberToEdit(member);
                            setEditRole(member.role);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit Role
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleResendInvite(member)}>
                        <Send className="mr-2 h-4 w-4" /> Resend Invite
                      </DropdownMenuItem>
                      {member.role !== "owner" && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setMemberToRemove(member)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Remove
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Remove Member AlertDialog */}
      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{memberToRemove?.email}</strong> from this organization?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRemoveMember}
              disabled={actionLoading}
            >
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!memberToEdit} onOpenChange={(open) => !open && setMemberToEdit(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>
              Change the role for <strong>{memberToEdit?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="edit-role-select">New Role</Label>
            <Select value={editRole} onValueChange={setEditRole}>
              <SelectTrigger id="edit-role-select">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {editableRoles.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberToEdit(null)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditRole} disabled={actionLoading || editRole === memberToEdit?.role}>
              {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
