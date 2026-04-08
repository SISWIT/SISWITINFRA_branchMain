import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, MailPlus, UserPlus, ShieldCheck, Clock3, Lock } from "lucide-react";
import { useSubscription } from "@/core/hooks/useSubscription";
import { Button } from "@/ui/shadcn/button";
import { Input } from "@/ui/shadcn/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/ui/shadcn/select";
import { Textarea } from "@/ui/shadcn/textarea";
import { useAuth } from "@/core/auth/useAuth";
import { useOrganizationOwnerData } from "@/workspaces/organization/hooks/useOrganizationOwnerData";
import { cn } from "@/core/utils/utils";
import { toast } from "sonner";
const INVITE_EMAILS_DISABLED = (() => {
  const raw = String(import.meta.env.VITE_DISABLE_INVITE_EMAILS ?? "").trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
})();

function getFutureIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusStyle(status?: string) {
  const s = String(status ?? "").toLowerCase();
  if (s === "accepted") return "bg-green-50 text-green-800 border-green-200";
  if (s === "expired" || s === "cancelled" || s === "canceled")
    return "bg-red-50 text-red-800 border-red-200";
  return "bg-amber-50 text-amber-800 border-amber-200";
}

type Tab = "employee" | "client" | "history";

export default function OrganizationInvitationsPage() {
  const { inviteEmployee, inviteClient } = useAuth();
  const { organization, loading, employeeInvites, clientInvites, refresh } = useOrganizationOwnerData();
  const { isCancelled } = useSubscription();

  const [activeTab, setActiveTab] = useState<Tab>("employee");

  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeRole, setEmployeeRole] = useState<"admin" | "manager" | "employee">("employee");
  const [customRoleName, setCustomRoleName] = useState("");
  const [employeeMessage, setEmployeeMessage] = useState("");
  const [employeeExpiryDays, setEmployeeExpiryDays] = useState("2");
  const [submittingEmployee, setSubmittingEmployee] = useState(false);

  const [clientEmail, setClientEmail] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [clientExpiryDays, setClientExpiryDays] = useState("7");
  const [submittingClient, setSubmittingClient] = useState(false);

  const handleEmployeeInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization?.id || isCancelled) return;
    setSubmittingEmployee(true);
    const expiresAt = getFutureIso(Number(employeeExpiryDays || "2"));
    const { error, invitationUrl, emailError } = await inviteEmployee({
      organizationId: organization.id,
      email: employeeEmail.trim(),
      role: employeeRole,
      customRoleName: customRoleName.trim() || null,
      message: employeeMessage.trim() || undefined,
      expiresAt,
    });
    setSubmittingEmployee(false);

    if (error) {
      toast.error("Employee invite failed", { description: error });
      return;
    }
    if (invitationUrl) await navigator.clipboard.writeText(invitationUrl).catch(() => undefined);
    if (emailError) {
      toast.warning("Invitation created, email failed", {
        description: `${emailError} Share the copied link manually.`,
      });
    } else if (INVITE_EMAILS_DISABLED) {
      toast.success("Employee invitation created", {
        description: "Email sending is disabled. Share the copied link manually.",
      });
    } else {
      toast.success("Employee invited", {
        description: invitationUrl ? "Invitation sent and link copied." : "Invitation created and email dispatch requested.",
      });
    }
    setEmployeeEmail("");
    setCustomRoleName("");
    setEmployeeMessage("");
    await refresh();
  };

  const handleClientInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!organization?.id || isCancelled) return;
    setSubmittingClient(true);
    const expiresAt = getFutureIso(Number(clientExpiryDays || "7"));
    const { error, invitationUrl, emailError } = await inviteClient({
      organizationId: organization.id,
      email: clientEmail.trim(),
      message: clientMessage.trim() || undefined,
      expiresAt,
    });
    setSubmittingClient(false);

    if (error) {
      toast.error("Client invite failed", { description: error });
      return;
    }
    if (invitationUrl) await navigator.clipboard.writeText(invitationUrl).catch(() => undefined);
    if (emailError) {
      toast.warning("Invitation created, email failed", {
        description: `${emailError} Share the copied link manually.`,
      });
    } else if (INVITE_EMAILS_DISABLED) {
      toast.success("Client invitation created", {
        description: "Email sending is disabled. Share the copied link manually.",
      });
    } else {
      toast.success("Client invited", {
        description: invitationUrl ? "Invitation sent and link copied." : "Invitation created and email dispatch requested.",
      });
    }
    setClientEmail("");
    setClientMessage("");
    await refresh();
  };

  if (loading && !organization) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/60 p-6">
        <h2 className="text-lg font-semibold">No organization found</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in with an organization owner or admin account.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Page header */}
      <section className="space-y-1">
        <p className="text-[11px] font-medium tracking-widest uppercase text-muted-foreground">Organization</p>
        <h1 className="text-2xl font-extrabold tracking-tight leading-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground max-w leading-relaxed pt-0.5">
          Invite team members for internal access, or onboard clients to the external portal.
        </p>
      </section>

      {/* Tab switcher */}
      <div className="flex gap-2 bg-muted/20 border border-border/40 rounded-xl p-1 w-fit shadow-inner">
        {(["employee", "client", "history"] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all duration-300 capitalize",
              activeTab === tab
                ? "bg-card text-foreground border border-border/20 shadow-md scale-105"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
            )}
          >
            {tab === "employee" ? "Team invite" : tab === "client" ? "Client invite" : "History"}
          </button>
        ))}
      </div>

      {/* Employee invite tab */}
      {activeTab === "employee" && (
        <div className="grid gap-8 xl:grid-cols-2">
          <article className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="space-y-2 pb-6 border-b border-border/20 text-center sm:text-left">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60">Internal Onboarding</p>
              <h2 className="text-3xl font-extrabold tracking-tight">Invite Team Member</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Grant detailed workspace access and define system roles for your new collaborators.
              </p>
            </div>

            <div className="relative">
              {isCancelled && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/60 backdrop-blur-[2px] border border-destructive/20 text-center p-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                    <Lock className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-sm font-bold text-destructive mb-1">Invitations Suspended</h3>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    Your subscription has been cancelled. Resubscribe to resume inviting team members.
                  </p>
                </div>
              )}
              <form className={cn("space-y-4", isCancelled && "opacity-40 grayscale pointer-events-none")} onSubmit={handleEmployeeInvite}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email address</label>
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={employeeEmail}
                  onChange={(e) => setEmployeeEmail(e.target.value)}
                  required
                  className="h-10 bg-background/70"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">System role</label>
                  <Select value={employeeRole} onValueChange={(v) => setEmployeeRole(v as typeof employeeRole)}>
                    <SelectTrigger className="h-10 bg-background/70">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="employee">Employee</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Sets permission level</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Custom label <span className="normal-case font-normal opacity-60">(optional)</span>
                  </label>
                  <Input
                    placeholder="e.g. Lead Designer"
                    value={customRoleName}
                    onChange={(e) => setCustomRoleName(e.target.value)}
                    className="h-10 bg-background/70"
                  />
                  <p className="text-[11px] text-muted-foreground">Display name only</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires in</label>
                <Select value={employeeExpiryDays} onValueChange={setEmployeeExpiryDays}>
                  <SelectTrigger className="h-10 bg-background/70">
                    <SelectValue placeholder="Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="5">5 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Message <span className="normal-case font-normal opacity-60">(optional)</span>
                </label>
                <Textarea
                  placeholder="Add onboarding context or instructions…"
                  value={employeeMessage}
                  onChange={(e) => setEmployeeMessage(e.target.value)}
                  rows={3}
                  className="bg-background/70 resize-none"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-blue-50/60 border border-blue-100 px-3.5 py-3 dark:bg-blue-950/20 dark:border-blue-900/40">
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The invitation link will be copied to your clipboard automatically after creation.
                </p>
              </div>

              <Button
                type="submit"
                disabled={submittingEmployee}
                className="w-full h-10 font-medium"
              >
                {submittingEmployee ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  "Send employee invitation"
                )}
              </Button>
            </form>
            </div>
          </article>

          {/* Right-side info panel */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3">
              <h3 className="text-sm font-medium">How it works</h3>
              {[
                { step: "1", label: "Enter email", desc: "Provide the employee's work email address." },
                { step: "2", label: "Set role & label", desc: "Choose the system permission level and an optional display name." },
                { step: "3", label: "Send invite", desc: "Set an expiry, add a message, and send the link." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Employee invites</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For admins, managers, and employees who need access inside your organization workspace. Roles control what each member can view and manage.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Client invite tab */}
      {activeTab === "client" && (
        <div className="grid gap-8 xl:grid-cols-2">
          <article className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-6 lg:p-8 space-y-6 shadow-xl">
            <div className="space-y-2 pb-6 border-b border-border/20 text-center sm:text-left">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground/60">External Onboarding</p>
              <h2 className="text-3xl font-extrabold tracking-tight">Invite a Client</h2>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                Send a portal onboarding invitation with a secure, time-limited registration link.
              </p>
            </div>

            <div className="relative">
              {isCancelled && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-background/60 backdrop-blur-[2px] border border-destructive/20 text-center p-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
                    <Lock className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="text-sm font-bold text-destructive mb-1">Invitations Suspended</h3>
                  <p className="text-[11px] text-muted-foreground max-w-[200px]">
                    Your subscription has been cancelled. Resubscribe to resume onboarding clients.
                  </p>
                </div>
              )}
              <form className={cn("space-y-4", isCancelled && "opacity-40 grayscale pointer-events-none")} onSubmit={handleClientInvite}>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email address</label>
                <Input
                  type="email"
                  placeholder="client@business.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  required
                  className="h-10 bg-background/70"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expires in</label>
                <Select value={clientExpiryDays} onValueChange={setClientExpiryDays}>
                  <SelectTrigger className="h-10 bg-background/70">
                    <SelectValue placeholder="Expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Select how long this invitation stays valid.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Message <span className="normal-case font-normal opacity-60">(optional)</span>
                </label>
                <Textarea
                  placeholder="Add context or welcome notes for your client…"
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  rows={5}
                  className="bg-background/70 resize-none"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 px-3.5 py-3 dark:bg-emerald-950/20 dark:border-emerald-900/40">
                <Clock3 className="mt-0.5 h-3.5 w-3.5 text-emerald-600 flex-shrink-0 dark:text-emerald-400" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Expired invitations cannot be reactivated. A new invite must be created to continue onboarding.
                </p>
              </div>

              <Button
                type="submit"
                disabled={submittingClient}
                className="w-full h-10 font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submittingClient ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
                ) : (
                  "Send client invitation"
                )}
              </Button>
            </form>
            </div>
          </article>

          {/* Right-side info */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-3">
              <h3 className="text-sm font-medium">How it works</h3>
              {[
                { step: "1", label: "Enter email", desc: "Provide the client's email address." },
                { step: "2", label: "Set expiry", desc: "Choose how long the invitation link stays active." },
                { step: "3", label: "Send invite", desc: "Optionally add a welcome message and send." },
              ].map(({ step, label, desc }) => (
                <div key={step} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-border/70 bg-card/60 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <MailPlus className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Client invites</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                For external clients who should receive a portal onboarding invitation. These invites have no system-level role and provide portal-only access.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History tab */}
      {activeTab === "history" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {/* Employee invites list */}
          <article className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Employee invitations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Latest internal invitations.</p>
              </div>
              <span className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                {employeeInvites.length} total
              </span>
            </div>

            <div className="space-y-2">
              {employeeInvites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No employee invitations yet.</p>
                </div>
              ) : (
                employeeInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3"
                  >
                    <p className="truncate text-sm font-medium min-w-0">{invite.invited_email}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="rounded-full border border-border/60 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 px-2.5 py-0.5 text-[11px]">
                        {invite.role}
                      </span>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", getStatusStyle(invite.status))}>
                        {invite.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Exp. {formatDate(invite.expires_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          {/* Client invites list */}
          <article className="rounded-2xl border border-border/70 bg-card/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Client invitations</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Latest client onboarding invitations.</p>
              </div>
              <span className="rounded-full border border-border/70 px-2.5 py-1 text-xs text-muted-foreground">
                {clientInvites.length} total
              </span>
            </div>

            <div className="space-y-2">
              {clientInvites.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 bg-background/30 px-4 py-8 text-center">
                  <p className="text-sm text-muted-foreground">No client invitations yet.</p>
                </div>
              ) : (
                clientInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/60 px-4 py-3"
                  >
                    <p className="truncate text-sm font-medium min-w-0">{invite.invited_email}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px]", getStatusStyle(invite.status))}>
                        {invite.status}
                      </span>
                      <span className="text-[11px] text-muted-foreground">Exp. {formatDate(invite.expires_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      )}

      {/* Footer strip */}
      <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-md p-6 shadow-lg">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight">System Policy: Invitation Security</p>
            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-medium">
              Links are automatically generated and copied. For security, invitations expire after the set duration and cannot be reused once converted to a membership. Always verify the recipient email before dispatching.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
