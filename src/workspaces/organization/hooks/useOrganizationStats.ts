import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/core/api/client";

export function useOrganizationStats(organizationId: string | undefined) {
  return useQuery({
    queryKey: ["organization-stats", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      if (!organizationId) return { totalMembers: 0 };

      // Faster count query
      const { count, error } = await supabase
        .from("organization_memberships")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organizationId);

      if (error) {
        console.error("Error fetching organization stats:", error);
        return { totalMembers: 1 }; // Default to 1 (the owner)
      }

      return {
        totalMembers: count ?? 1,
      };
    },
    staleTime: 60 * 1000, // 1 minute cache
  });
}
