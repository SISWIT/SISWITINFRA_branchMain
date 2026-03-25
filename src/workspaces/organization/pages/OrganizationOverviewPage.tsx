import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Users, Mail, Clock, ShieldCheck } from "lucide-react";
import { OrganizationStatCard } from "@/workspaces/organization/components/OrganizationStatCard";
import { OrganizationAnalyticsCard } from "@/workspaces/organization/components/OrganizationAnalyticsCard";
import { OrganizationActivityCard } from "@/workspaces/organization/components/OrganizationActivityCard";
import { OrganizationProgressCard } from "@/workspaces/organization/components/OrganizationProgressCard";
import { OrganizationAlertsPanel } from "@/workspaces/organization/components/OrganizationAlertsPanel";
import { useOrganizationOwnerData } from "@/workspaces/organization/hooks/useOrganizationOwnerData";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { cn } from "@/core/utils/utils";
import { Button } from "@/ui/shadcn/button";

function formatInviteDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

function useLiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

export default function OrganizationOverviewPage() {
  const {
    organization: ownerOrg,
    loading,
    stats,
    memberships,
    pendingClients,
    employeeInvites,
    clientInvites,
    inviteApprovalTrend,
    alerts,
    dismissAlert,
    refresh,
  } = useOrganizationOwnerData();

  const { organization } = useOrganization();
  const primaryColor = organization?.primary_color || "var(--primary)";
  const [refreshing, setRefreshing] = useState(false);
  const clock = useLiveClock();

  async function handleRefresh() {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  }

  if (loading && !ownerOrg) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin" style={{ color: primaryColor }} />
      </div>
    );
  }

  if (!ownerOrg) {
    return (
      <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-md p-6 text-center">
        <h2 className="text-xl font-bold">No organization found</h2>
        <p className="mt-2 text-muted-foreground">
          Sign in with an organization owner or admin account.
        </p>
      </div>
    );
  }

  const recentInvites = employeeInvites
    .concat(clientInvites)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map((invite) => ({
      id: invite.id,
      title: invite.invited_email,
      subtitle: `${invite.role ?? "client"} · ${formatInviteDate(invite.created_at)}`,
      state: invite.status,
    }));

  const teamRows = memberships.slice(0, 5);
  const approvedClients = memberships.filter(
    (m) => m.role === "client" && m.account_state === "active" && m.is_active
  ).length;
  const clientTotal = approvedClients + pendingClients.length;
  const completion = clientTotal === 0 ? 0 : (approvedClients / clientTotal) * 100;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Page Header */}
      <section className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span 
              className="h-2 w-2 rounded-full animate-pulse" 
              style={{ backgroundColor: primaryColor }}
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              {ownerOrg.name} Overview
            </p>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Owner Workspace</h1>
          <p className="text-muted-foreground font-medium">{today}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-2xl border border-border/40 bg-card/40 backdrop-blur-md px-6 py-3 shadow-lg sm:block">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 text-right">System Time</p>
            <p className="font-mono text-lg font-bold leading-none tracking-tight">{clock}</p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="h-10 px-4 rounded-xl border-border/40 hover:bg-muted/50"
            disabled={refreshing}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </section>

      {/* Stat Cards */}
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <OrganizationStatCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle="Total team and client accounts"
          icon={Users}
        />
        <OrganizationStatCard
          title="Active Members"
          value={stats.activeMembers}
          subtitle="Currently verified active users"
          icon={ShieldCheck}
        />
        <OrganizationStatCard
          title="Pending Requests"
          value={stats.pendingApprovals}
          subtitle="Clients awaiting approval"
          icon={Clock}
        />
        <OrganizationStatCard
          title="Open Invites"
          value={stats.openInvites}
          subtitle="Sent but not yet accepted"
          icon={Mail}
        />
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 xl:grid-cols-12">
        {/* Left Column: Analytics & Team */}
        <div className="space-y-6 xl:col-span-7">
          <div className="rounded-[2rem] border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-xl transition-all hover:shadow-2xl">
            <OrganizationAnalyticsCard data={inviteApprovalTrend} />
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold tracking-tight">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">Most recent workspace members</p>
              </div>
              <Button variant="ghost" size="sm" className="rounded-xl font-bold" style={{ color: primaryColor }}>
                View All
              </Button>
            </div>

            {teamRows.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-border/40 bg-background/20 p-12 text-center">
                <p className="text-muted-foreground font-medium">No members found in the workspace.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamRows.map((member) => (
                  <article
                    key={member.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-border/20 bg-background/40 p-4 transition-all hover:bg-background/60 hover:shadow-md"
                  >
                    <div 
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-xs shadow-sm"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      {(member.email ?? "?").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold group-hover:text-primary transition-colors">{member.email}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mt-0.5">
                        {member.role} · {member.account_state}
                      </p>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      member.is_active
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-muted text-muted-foreground border border-border/40"
                    )}>
                      {member.is_active ? "Active" : "Disabled"}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Activity, Alerts & Progress */}
        <div className="space-y-6 xl:col-span-5">
          <div className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-xl">
            <OrganizationActivityCard title="Recent Invitations" items={recentInvites} />
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/30 backdrop-blur-md overflow-hidden shadow-xl">
            <OrganizationAlertsPanel alerts={alerts} onDismiss={dismissAlert} />
          </div>

          <div className="rounded-3xl border border-border/40 bg-card/50 backdrop-blur-md p-6 shadow-xl space-y-6">
            <div className="relative">
              <OrganizationProgressCard
                value={completion}
                label="Client Approval Progress"
                caption="Approved clients vs pending requests"
              />
            </div>

            <div className="h-px bg-border/40" />

            <div className="flex items-center justify-between gap-4 group cursor-pointer">
              <div className="space-y-1">
                <p className="text-sm font-bold group-hover:text-primary transition-colors">Focus Mode</p>
                <p className="text-xs text-muted-foreground font-medium">Enable distraction-free workspace environment</p>
              </div>
              <div className="h-10 px-4 flex items-center justify-center rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 border border-border/40 group-hover:bg-muted transition-colors">
                Locked
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}