import { supabase } from "./client";
import type { Database } from "./types";

export type TableName = keyof Database["public"]["Tables"];

export function typedFrom<T extends TableName>(table: T) {
  return supabase.from(table);
}
