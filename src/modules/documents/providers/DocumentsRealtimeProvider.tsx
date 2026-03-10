import { type ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/core/api/client";
import { useAuth } from "@/core/auth/useAuth";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";

export function DocumentsRealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id || !organization?.id) {
      return;
    }

    const orgFilter = `organization_id=eq.${organization.id}`;

    const channel = supabase
      .channel(`documents-org-${organization.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "auto_documents", filter: orgFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ["auto_documents"] });
        queryClient.invalidateQueries({ queryKey: ["auto_document"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "document_templates", filter: orgFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ["document_templates"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "document_esignatures", filter: orgFilter }, () => {
        queryClient.invalidateQueries({ queryKey: ["document_esignatures"] });
        queryClient.invalidateQueries({ queryKey: ["auto_documents"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, organization?.id, queryClient]);

  return <>{children}</>;
}
