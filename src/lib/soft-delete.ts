import { supabase } from "@/integrations/supabase/client";

interface SoftDeleteInput {
  table: string;
  id: string;
  userId?: string | null;
}

interface RestoreInput {
  table: string;
  id: string;
}

/**
 * Soft delete convention:
 * - set `deleted_at`
 * - set `deleted_by`
 * - keep record for audit and recovery
 */
export async function softDeleteRecord(input: SoftDeleteInput): Promise<boolean> {
  const unsafeSupabase = supabase as unknown as {
    from: (table: string) => {
      update: (payload: unknown) => {
        eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
      };
    };
  };

  const { error } = await unsafeSupabase
    .from(input.table)
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: input.userId ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  return !error;
}

export async function restoreSoftDeletedRecord(input: RestoreInput): Promise<boolean> {
  const unsafeSupabase = supabase as unknown as {
    from: (table: string) => {
      update: (payload: unknown) => {
        eq: (column: string, value: string) => Promise<{ error: { message?: string } | null }>;
      };
    };
  };

  const { error } = await unsafeSupabase
    .from(input.table)
    .update({
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  return !error;
}
