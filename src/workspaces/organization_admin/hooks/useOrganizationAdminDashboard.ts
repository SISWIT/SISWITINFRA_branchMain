import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../../core/api/client";
import { useOrganization } from "../../organization/hooks/useOrganization";

export interface DashboardKPIs {
    leads: number;
    contracts: number;
    quotes: number;
    orders: number;
    invitations: number;
}

export interface DashboardOpportunity {
    id: string;
    name: string | null;
    stage: string | null;
    amount: number | null;
    close_date: string | null;
}

export interface DashboardContract {
    id: string;
    name: string | null;
    status: string | null;
    total_value: number | null;
    end_date: string | null;
}

export interface DashboardActivity {
    id: string;
    subject: string | null;
    type: string | null;
    due_date: string | null;
    owner_id: string | null;
    created_at: string | null;
}

export interface DashboardLead {
    id: string;
    first_name: string | null;
    last_name: string | null;
    company: string | null;
    email: string | null;
    status: string | null;
    created_at: string | null;
}

export interface DashboardAuditLog {
    id: string;
    action: string | null;
    entity_type: string | null;
    created_at: string | null;
    user_id: string | null;
}

export interface DashboardChartItem {
    status: string | null;
    created_at: string | null;
}

export interface DashboardData {
    kpis: DashboardKPIs;
    lists: {
        opportunities: DashboardOpportunity[];
        contracts: DashboardContract[];
        activities: DashboardActivity[];
        leads: DashboardLead[];
        auditLogs: DashboardAuditLog[];
    };
    charts: {
        leads: DashboardChartItem[];
        contracts: DashboardChartItem[];
        quotes: DashboardChartItem[];
        orders: DashboardChartItem[];
    };
    trends: {
        leads: number;
        contracts: number;
    };
}

/**
 * useOrganizationAdminDashboard
 * Aggregated hook for fetching performance metrics and administrative visibility data.
 */
export function useOrganizationAdminDashboard() {
    const { organization } = useOrganization();
    const tenantId = organization?.id;

    return useQuery<DashboardData>({
        queryKey: ["organization-admin-dashboard", tenantId],
        queryFn: async (): Promise<DashboardData> => {
            if (!tenantId) throw new Error("No tenant ID");

            const [
                leadsCountResult,
                contractsCountResult,
                quotesCountResult,
                ordersCountResult,
                opportunitiesResult,
                contractsResult,
                activitiesResult,
                leadsResult,
                auditLogsResult,
                chartLeadsResult,
                chartContractsResult,
                chartQuotesResult,
                chartOrdersResult,
                trendLeadsResult,
                trendContractsResult,
                _membershipsResult,
                invitationsResult,
            ] = await Promise.all([
                supabase.from("leads").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
                supabase.from("contracts").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
                supabase.from("quotes").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
                supabase.from("purchase_orders").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),

                supabase.from("opportunities")
                    .select("id, name, stage, amount, close_date")
                    .eq("tenant_id", tenantId)
                    .order("created_at", { ascending: false })
                    .limit(4),

                supabase.from("contracts")
                    .select("id, name, status, total_value, end_date")
                    .eq("tenant_id", tenantId)
                    .order("created_at", { ascending: false })
                    .limit(4),

                supabase.from("activities")
                    .select("id, subject, type, due_date, owner_id, created_at")
                    .eq("tenant_id", tenantId)
                    .order("due_date", { ascending: false })
                    .limit(4),

                supabase.from("leads")
                    .select("id, first_name, last_name, company, email, status, created_at")
                    .eq("tenant_id", tenantId)
                    .order("created_at", { ascending: false })
                    .limit(10),

                supabase.from("audit_logs")
                    .select("id, action, entity_type, created_at, user_id")
                    .eq("organization_id", tenantId)
                    .order("created_at", { ascending: false })
                    .limit(5),

                // For charts
                supabase.from("leads").select("status, created_at").eq("tenant_id", tenantId),
                supabase.from("contracts").select("status, created_at").eq("tenant_id", tenantId),
                supabase.from("quotes").select("status, created_at").eq("tenant_id", tenantId),
                supabase.from("purchase_orders").select("status, created_at").eq("tenant_id", tenantId),

                // Fetch data for trends (last 7 days vs previous 7 days)
                supabase.from("leads")
                    .select("created_at")
                    .eq("tenant_id", tenantId)
                    .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),
                
                supabase.from("contracts")
                    .select("created_at")
                    .eq("tenant_id", tenantId)
                    .gte("created_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()),

                supabase.from("organization_memberships")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", tenantId),
                
                supabase.from("tenant_invitations")
                    .select("*", { count: "exact", head: true })
                    .eq("organization_id", tenantId)
                    .eq("status", "pending"),
            ]);

            // Calculate trends
            const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
            const leadsTrendData = trendLeadsResult.data || [];
            const currentLeads = leadsTrendData.filter(l => new Date(l.created_at!).getTime() > sevenDaysAgo).length;
            const previousLeads = leadsTrendData.length - currentLeads;
            const leadsTrend = previousLeads === 0 ? 0 : Math.round(((currentLeads - previousLeads) / previousLeads) * 100);

            const contractsTrendData = trendContractsResult.data || [];
            const currentContracts = contractsTrendData.filter(c => new Date(c.created_at!).getTime() > sevenDaysAgo).length;
            const previousContracts = contractsTrendData.length - currentContracts;
            const contractsTrend = previousContracts === 0 ? 0 : Math.round(((currentContracts - previousContracts) / previousContracts) * 100);

            return {
                kpis: {
                    leads: leadsCountResult.count || 0,
                    contracts: contractsCountResult.count || 0,
                    quotes: quotesCountResult.count || 0,
                    orders: ordersCountResult.count || 0,
                    invitations: invitationsResult.count || 0,
                },
                lists: {
                    opportunities: (opportunitiesResult.data || []) as unknown as DashboardOpportunity[],
                    contracts: (contractsResult.data || []) as unknown as DashboardContract[],
                    activities: (activitiesResult.data || []) as unknown as DashboardActivity[],
                    leads: (leadsResult.data || []) as unknown as DashboardLead[],
                    auditLogs: (auditLogsResult.data || []) as unknown as DashboardAuditLog[],
                },
                charts: {
                    leads: (chartLeadsResult.data || []) as unknown as DashboardChartItem[],
                    contracts: (chartContractsResult.data || []) as unknown as DashboardChartItem[],
                    quotes: (chartQuotesResult.data || []) as unknown as DashboardChartItem[],
                    orders: (chartOrdersResult.data || []) as unknown as DashboardChartItem[],
                },
                trends: {
                    leads: leadsTrend,
                    contracts: contractsTrend,
                }
            };
        },
        enabled: !!tenantId,
    });
}
