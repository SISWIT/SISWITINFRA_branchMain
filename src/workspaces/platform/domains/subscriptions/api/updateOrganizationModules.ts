import { supabase } from "@/core/api/client";
import { normalizePlatformError } from "../../../shared/utils/normalizePlatformError";

export interface PlatformModuleUpdate {
  organization_id: string;
  modules: {
    module_crm?: boolean;
    module_clm?: boolean;
    module_cpq?: boolean;
    module_erp?: boolean;
    module_documents?: boolean;
  };
}

export async function updateOrganizationModules(update: PlatformModuleUpdate): Promise<void> {
  const { error } = await supabase
    .from("organization_subscriptions")
    .update({
      ...update.modules,
      updated_at: new Date().toISOString(),
    })
    .eq("organization_id", update.organization_id);

  if (error) {
    throw normalizePlatformError(error);
  }
}
