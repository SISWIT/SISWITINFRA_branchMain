import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "../../../core/api/client";
import { useOrganization } from "../../organization/hooks/useOrganization";
import {
    formatWorkspaceDateParam,
    getWorkspaceDateBounds,
} from "../../../core/utils/workspace-date";

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
export function useOrganizationAdminDashboard(anchorDate?: Date) {
    const { organization } = useOrganization();
    const tenantId = organization?.id;
    const anchorDateKey = anchorDate ? formatWorkspaceDateParam(anchorDate) : "current";

    return useQuery<DashboardData>({
        queryKey: ["organization-admin-dashboard", tenantId, anchorDateKey],
        queryFn: async (): Promise<DashboardData> => {
            if (!tenantId) throw new Error("No tenant ID");

            const bounds = anchorDate ? getWorkspaceDateBounds(anchorDate) : null;
            const dayStartIso = bounds?.dayStart.toISOString();
            const dayEndIso = bounds?.dayEnd.toISOString();
            const selectedDateKey = bounds ? formatWorkspaceDateParam(bounds.anchorDate) : null;
            const rolling14StartIso = bounds?.rolling14Start.toISOString();

            let leadsCountQuery = supabase
                .from("leads")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId);
            if (dayStartIso && dayEndIso) {
                leadsCountQuery = leadsCountQuery.gte("created_at", dayStartIso).lte("created_at", dayEndIso);
            }

            let contractsCountQuery = supabase
                .from("contracts")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId);
            if (dayStartIso && dayEndIso) {
                contractsCountQuery = contractsCountQuery.gte("created_at", dayStartIso).lte("created_at", dayEndIso);
            }

            let quotesCountQuery = supabase
                .from("quotes")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId);
            if (dayStartIso && dayEndIso) {
                quotesCountQuery = quotesCountQuery.gte("created_at", dayStartIso).lte("created_at", dayEndIso);
            }

            let ordersCountQuery = supabase
                .from("purchase_orders")
                .select("*", { count: "exact", head: true })
                .eq("tenant_id", tenantId);
            if (dayStartIso && dayEndIso) {
                ordersCountQuery = ordersCountQuery.gte("created_at", dayStartIso).lte("created_at", dayEndIso);
            }

            let opportunitiesQuery = supabase
                .from("opportunities")
                .select("id, name, stage, amount, close_date")
                .eq("tenant_id", tenantId);
            if (selectedDateKey) {
                opportunitiesQuery = opportunitiesQuery.eq("close_date", selectedDateKey);
            }
            opportunitiesQuery = opportunitiesQuery.order("created_at", { ascending: false }).limit(4);

            let contractsQuery = supabase
                .from("contracts")
                .select("id, name, status, total_value, end_date")
                .eq("tenant_id", tenantId);
            if (selectedDateKey) {
                contractsQuery = contractsQuery.eq("end_date", selectedDateKey);
            }
            contractsQuery = contractsQuery.order("created_at", { ascending: false }).limit(4);

            let activitiesQuery = supabase
                .from("activities")
                .select("id, subject, type, due_date, owner_id, created_at")
                .eq("tenant_id", tenantId);
            if (selectedDateKey) {
                activitiesQuery = activitiesQuery.eq("due_date", selectedDateKey);
            }
            activitiesQuery = activitiesQuery.order("due_date", { ascending: false }).limit(4);

            let leadsQuery = supabase
                .from("leads")
                .select("id, first_name, last_name, company, email, status, created_at")
                .eq("tenant_id", tenantId);
            if (dayStartIso && dayEndIso) {
                leadsQuery = leadsQuery.gte("created_at", dayStartIso).lte("created_at", dayEndIso);
            }
            leadsQuery = leadsQuery.order("created_at", { ascending: false }).limit(10);

            let auditLogsQuery = supabase
                .from("audit_logs")
                .select("id, action, entity_type, created_at, user_id")
                .eq("organization_id", tenantId);
            if (dayStartIso && dayEndIso) {
                auditLogsQuery = auditLogsQuery.gte("created_at", dayStartIso).lte("created_at", dayEndIso);
            }
            auditLogsQuery = auditLogsQuery.order("created_at", { ascending: false }).limit(5);

            let chartLeadsQuery = supabase.from("leads").select("status, created_at").eq("tenant_id", tenantId);
            let chartContractsQuery = supabase.from("contracts").select("status, created_at").eq("tenant_id", tenantId);
            let chartQuotesQuery = supabase.from("quotes").select("status, created_at").eq("tenant_id", tenantId);
            let chartOrdersQuery = supabase.from("purchase_orders").select("status, created_at").eq("tenant_id", tenantId);
            if (rolling14StartIso && dayEndIso) {
                chartLeadsQuery = chartLeadsQuery.gte("created_at", rolling14StartIso).lte("created_at", dayEndIso);
                chartContractsQuery = chartContractsQuery.gte("created_at", rolling14StartIso).lte("created_at", dayEndIso);
                chartQuotesQuery = chartQuotesQuery.gte("created_at", rolling14StartIso).lte("created_at", dayEndIso);
                chartOrdersQuery = chartOrdersQuery.gte("created_at", rolling14StartIso).lte("created_at", dayEndIso);
            }

            let trendLeadsQuery = supabase.from("leads").select("created_at").eq("tenant_id", tenantId);
            let trendContractsQuery = supabase.from("contracts").select("created_at").eq("tenant_id", tenantId);
            if (rolling14StartIso && dayEndIso) {
                trendLeadsQuery = trendLeadsQuery.gte("created_at", rolling14StartIso).lte("created_at", dayEndIso);
                trendContractsQuery = trendContractsQuery.gte("created_at", rolling14StartIso).lte("created_at", dayEndIso);
            } else {
                const fourteenDaysAgoIso = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
                trendLeadsQuery = trendLeadsQuery.gte("created_at", fourteenDaysAgoIso);
                trendContractsQuery = trendContractsQuery.gte("created_at", fourteenDaysAgoIso);
            }

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
                invitationsResult,
            ] = await Promise.all([
                leadsCountQuery,
                contractsCountQuery,
                quotesCountQuery,
                ordersCountQuery,
                opportunitiesQuery,
                contractsQuery,
                activitiesQuery,
                leadsQuery,
                auditLogsQuery,
                chartLeadsQuery,
                chartContractsQuery,
                chartQuotesQuery,
                chartOrdersQuery,
                trendLeadsQuery,
                trendContractsQuery,
                supabase.from("tenant_invitations")
                    .select("*", { count: "exact", head: true })
                    .eq("tenant_id", tenantId)
                    .eq("status", "pending"),
            ]);

            const failedResult = [
                { label: "leads count", error: leadsCountResult.error },
                { label: "contracts count", error: contractsCountResult.error },
                { label: "quotes count", error: quotesCountResult.error },
                { label: "orders count", error: ordersCountResult.error },
                { label: "opportunities list", error: opportunitiesResult.error },
                { label: "contracts list", error: contractsResult.error },
                { label: "activities list", error: activitiesResult.error },
                { label: "leads list", error: leadsResult.error },
                { label: "audit logs", error: auditLogsResult.error },
                { label: "lead chart", error: chartLeadsResult.error },
                { label: "contract chart", error: chartContractsResult.error },
                { label: "quote chart", error: chartQuotesResult.error },
                { label: "order chart", error: chartOrdersResult.error },
                { label: "lead trends", error: trendLeadsResult.error },
                { label: "contract trends", error: trendContractsResult.error },
                { label: "invitations count", error: invitationsResult.error },
            ].find((result) => result.error);

            if (failedResult?.error) {
                throw new Error(`Failed to load ${failedResult.label}: ${failedResult.error.message}`);
            }

            const toTime = (value: string | null | undefined): number | null => {
                if (!value) return null;
                const time = new Date(value).getTime();
                return Number.isNaN(time) ? null : time;
            };
            const countBetween = (
                rows: { created_at: string | null }[],
                startMs: number,
                endMs: number,
            ): number =>
                rows.filter((row) => {
                    const time = toTime(row.created_at);
                    return time !== null && time >= startMs && time <= endMs;
                }).length;

            const leadsTrendData = (trendLeadsResult.data || []) as { created_at: string | null }[];
            const contractsTrendData = (trendContractsResult.data || []) as { created_at: string | null }[];

            let currentLeads = 0;
            let previousLeads = 0;
            let currentContracts = 0;
            let previousContracts = 0;

            if (bounds) {
                const currentStartMs = bounds.rolling7Start.getTime();
                const currentEndMs = bounds.dayEnd.getTime();
                const previousStartMs = bounds.previous7Start.getTime();
                const previousEndMs = bounds.previous7End.getTime();

                currentLeads = countBetween(leadsTrendData, currentStartMs, currentEndMs);
                previousLeads = countBetween(leadsTrendData, previousStartMs, previousEndMs);
                currentContracts = countBetween(contractsTrendData, currentStartMs, currentEndMs);
                previousContracts = countBetween(contractsTrendData, previousStartMs, previousEndMs);
            } else {
                const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
                currentLeads = leadsTrendData.filter((row) => {
                    const time = toTime(row.created_at);
                    return time !== null && time > sevenDaysAgo;
                }).length;
                previousLeads = leadsTrendData.length - currentLeads;

                currentContracts = contractsTrendData.filter((row) => {
                    const time = toTime(row.created_at);
                    return time !== null && time > sevenDaysAgo;
                }).length;
                previousContracts = contractsTrendData.length - currentContracts;
            }

            const leadsTrend = previousLeads === 0 ? 0 : Math.round(((currentLeads - previousLeads) / previousLeads) * 100);
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
        staleTime: 30 * 1000,
        placeholderData: keepPreviousData,
    });
}
