import { PostgrestError } from "@supabase/supabase-js";

export interface PlatformError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export function normalizePlatformError(error: unknown): PlatformError {
  if (error === null || error === undefined) {
    return { message: "An unknown error occurred" };
  }

  // Handle Supabase/PostgREST error shape
  const pgError = error as PostgrestError;
  if (typeof pgError.message === "string" && typeof pgError.code === "string") {
    return {
      message: pgError.message,
      code: pgError.code,
      details: pgError.details,
      hint: pgError.hint,
    };
  }

  // Handle standard JS Error shape
  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  // Handle custom serialized error objects or strings
  if (typeof error === "string") {
    return { message: error };
  }

  return { message: "An unexpected error occurred", details: JSON.stringify(error) };
}
