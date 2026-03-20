import { z } from "zod";

/**
 * Schema for environment variables used in the client application.
 * This ensures that the app fails fast if required configuration is missing.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "VITE_SUPABASE_PUBLISHABLE_KEY is required"),
  VITE_PUBLIC_APP_URL: z.string().url().optional().or(z.literal("")),
  VITE_AUTH_ROLE_LOOKUP_TIMEOUT_MS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default("5000"),
  VITE_AUTH_SESSION_RECOVERY_TIMEOUT_MS: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .optional()
    .default("10000"),
  VITE_DISABLE_INVITE_EMAILS: z
    .string()
    .transform((val) => val.toLowerCase() === "true" || val === "1")
    .optional(),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates the current environment variables against the schema.
 * Throws an error if validation fails, providing a clear report of missing/invalid keys.
 */
export function validateEnv() {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, messages]) => `- ${key}: ${messages?.join(", ")}`)
      .join("\n");

    console.error("❌ Environment validation failed:\n" + errorMessages);
    
    // In production, we might want to show a UI error, but for now, we throw to halt initialization.
    throw new Error("Environment validation failed. Check console for details.");
  }

  return result.data;
}
