import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MailPlus, UserPlus, CheckCircle2, XCircle, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface PendingClientMembership {
  id: string;
  email: string;
  account_state: string;
  created_at: string;
}

interface EmployeeInvite {
  id: string;
  invited_email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

interface ClientInvite {
  id: string;
  invited_email: string;
  status: string;
  expires_at: string;
  created_at: string;
}

function getFutureIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

export default function OrganizationOwnerDashboard() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const unsafeSupabase = useMemo(() => supabase as unknown as any, []);
  const { role, loading: authLoading, inviteEmployee, inviteClient, approveClientMembership, rejectClientMembership } = useAuth();
  const { organization, organizationLoading, refreshOrganization } = useOrganization();
  const { toast } = useToast();

  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeRole, setEmployeeRole] = useState<"admin" | "manager" | "employee">("employee");
  const [customRoleName, setCustomRoleName] = useState("");
  const [employeeMessage, setEmployeeMessage] = useState("");
  const [employeeExpiryDays, setEmployeeExpiryDays] = useState("2");

  const [clientEmail, setClientEmail] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [clientExpiryDays, setClientExpiryDays] = useState("7");

  const [pendingClients, setPendingClients] = useState<PendingClientMembership[]>([]);
  const [employeeInvites, setEmployeeInvites] = useState<EmployeeInvite[]>([]);
  const [clientInvites, setClientInvites] = useState<ClientInvite[]>([]);

  const [submittingEmployee, setSubmittingEmployee] = useState(false);
  const [submittingClient, setSubmittingClient] = useState(false);
  const [workingMembershipId, setWorkingMembershipId] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const canManage = role === "owner" || role === "admin" || role === "platform_super_admin" || role === "platform_admin";

  const loadData = useCallback(async () => {
    if (!organization?.id) return;

    setLoadingData(true);

    try {
      const [pendingResult, employeeInvitesResult, clientInvitesResult] = await Promise.all([
        unsafeSupabase
          .from("organization_memberships")
          .select("id, email, account_state, created_at")
          .eq("organization_id", organization.id)
          .eq("role", "client")
          .eq("account_state", "pending_approval")
          .order("created_at", { ascending: false }),
        unsafeSupabase
          .from("employee_invitations")
          .select("id, invited_email, role, status, expires_at, created_at")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false })
          .limit(10),
        unsafeSupabase
          .from("client_invitations")
          .select("id, invited_email, status, expires_at, created_at")
          .eq("organization_id", organization.id)
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setPendingClients((pendingResult.data ?? []) as PendingClientMembership[]);
      setEmployeeInvites((employeeInvitesResult.data ?? []) as EmployeeInvite[]);
      setClientInvites((clientInvitesResult.data ?? []) as ClientInvite[]);
    } catch {
      toast({
        variant: "destructive",
        title: "Unable to load organization auth data",
        description: "Try refreshing the page.",
      });
    } finally {
      setLoadingData(false);
    }
  }, [organization?.id, toast, unsafeSupabase]);

  useEffect(() => {
    if (organization?.id) {
      void loadData();
    }
  }, [loadData, organization?.id]);

  const handleEmployeeInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organization?.id) return;

    setSubmittingEmployee(true);

    const expiresAt = getFutureIso(Number(employeeExpiryDays || "2"));

    const { error, invitationUrl } = await inviteEmployee({
      organizationId: organization.id,
      email: employeeEmail.trim(),
      role: employeeRole,
      customRoleName: customRoleName.trim() || null,
      message: employeeMessage.trim() || undefined,
      expiresAt,
    });

    setSubmittingEmployee(false);

    if (error) {
      toast({ variant: "destructive", title: "Employee invite failed", description: error });
      return;
    }

    if (invitationUrl) {
      await navigator.clipboard.writeText(invitationUrl).catch(() => undefined);
    }

    toast({
      title: "Employee invited",
      description: invitationUrl
        ? "Invitation sent and link copied to clipboard."
        : "Invitation was created and email dispatch was requested.",
    });

    setEmployeeEmail("");
    setCustomRoleName("");
    setEmployeeMessage("");

    await loadData();
  };

  const handleClientInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organization?.id) return;

    setSubmittingClient(true);

    const expiresAt = getFutureIso(Number(clientExpiryDays || "7"));

    const { error, invitationUrl } = await inviteClient({
      organizationId: organization.id,
      email: clientEmail.trim(),
      message: clientMessage.trim() || undefined,
      expiresAt,
    });

    setSubmittingClient(false);

    if (error) {
      toast({ variant: "destructive", title: "Client invite failed", description: error });
      return;
    }

    if (invitationUrl) {
      await navigator.clipboard.writeText(invitationUrl).catch(() => undefined);
    }

    toast({
      title: "Client invited",
      description: invitationUrl
        ? "Invitation sent and link copied to clipboard."
        : "Invitation was created and email dispatch was requested.",
    });

    setClientEmail("");
    setClientMessage("");

    await loadData();
  };

  const handleApprove = async (membershipId: string) => {
    setWorkingMembershipId(membershipId);
    const { error } = await approveClientMembership(membershipId);
    setWorkingMembershipId(null);

    if (error) {
      toast({ variant: "destructive", title: "Approval failed", description: error });
      return;
    }

    toast({ title: "Client approved", description: "Client now has active access." });
    await refreshOrganization();
    await loadData();
  };

  const handleReject = async (membershipId: string) => {
    setWorkingMembershipId(membershipId);
    const { error } = await rejectClientMembership(membershipId);
    setWorkingMembershipId(null);

    if (error) {
      toast({ variant: "destructive", title: "Rejection failed", description: error });
      return;
    }

    toast({ title: "Client rejected", description: "Client membership was rejected." });
    await refreshOrganization();
    await loadData();
  };

  if (authLoading || organizationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>You need owner or admin access to manage invitations and approvals.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No organization found</CardTitle>
            <CardDescription>Sign in with an organization account to access this dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Organization Auth Management</h1>
          <p className="text-muted-foreground">
            {organization.name} ({organization.org_code ?? organization.slug})
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Employee
              </CardTitle>
              <CardDescription>Send invitation emails for admin, manager, or employee access.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleEmployeeInvite}>
                <Input
                  type="email"
                  placeholder="Employee email"
                  value={employeeEmail}
                  onChange={(event) => setEmployeeEmail(event.target.value)}
                  required
                />

                <Select value={employeeRole} onValueChange={(value) => setEmployeeRole(value as "admin" | "manager" | "employee")}> 
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="employee">Employee</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Custom role label (optional)"
                  value={customRoleName}
                  onChange={(event) => setCustomRoleName(event.target.value)}
                />

                <Select value={employeeExpiryDays} onValueChange={setEmployeeExpiryDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Message (optional)"
                  value={employeeMessage}
                  onChange={(event) => setEmployeeMessage(event.target.value)}
                  rows={3}
                />

                <Button type="submit" className="w-full" disabled={submittingEmployee}>
                  {submittingEmployee ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending invite...
                    </>
                  ) : (
                    "Send Employee Invitation"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailPlus className="h-4 w-4" />
                Invite Client
              </CardTitle>
              <CardDescription>Invite external clients to your organization portal.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-3" onSubmit={handleClientInvite}>
                <Input
                  type="email"
                  placeholder="Client email"
                  value={clientEmail}
                  onChange={(event) => setClientEmail(event.target.value)}
                  required
                />

                <Select value={clientExpiryDays} onValueChange={setClientExpiryDays}>
                  <SelectTrigger>
                    <SelectValue placeholder="Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Message (optional)"
                  value={clientMessage}
                  onChange={(event) => setClientMessage(event.target.value)}
                  rows={3}
                />

                <Button type="submit" className="w-full" disabled={submittingClient}>
                  {submittingClient ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending invite...
                    </>
                  ) : (
                    "Send Client Invitation"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Pending Client Approvals</CardTitle>
            <CardDescription>Approve or reject client self-signup requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="py-8 flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : pendingClients.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending client approvals.</p>
            ) : (
              <div className="space-y-3">
                {pendingClients.map((membership) => (
                  <div key={membership.id} className="border rounded-lg p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{membership.email}</p>
                      <p className="text-sm text-muted-foreground">Requested {formatDate(membership.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{membership.account_state}</Badge>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(membership.id)}
                        disabled={workingMembershipId === membership.id}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(membership.id)}
                        disabled={workingMembershipId === membership.id}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Employee Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {employeeInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No employee invitations yet.</p>
              ) : (
                <div className="space-y-2">
                  {employeeInvites.map((invite) => (
                    <div key={invite.id} className="border rounded-md p-3 text-sm">
                      <p className="font-medium">{invite.invited_email}</p>
                      <p className="text-muted-foreground">
                        {invite.role} | {invite.status} | expires {formatDate(invite.expires_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Client Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {clientInvites.length === 0 ? (
                <p className="text-sm text-muted-foreground">No client invitations yet.</p>
              ) : (
                <div className="space-y-2">
                  {clientInvites.map((invite) => (
                    <div key={invite.id} className="border rounded-md p-3 text-sm">
                      <p className="font-medium">{invite.invited_email}</p>
                      <p className="text-muted-foreground">
                        {invite.status} | expires {formatDate(invite.expires_at)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Copy className="h-3 w-3" />
          Invitation links are copied to clipboard when available.
        </p>
      </div>
    </div>
  );
}
