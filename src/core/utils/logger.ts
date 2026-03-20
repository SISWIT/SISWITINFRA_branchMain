import { getErrorMessage } from "@/core/utils/errors";

type LogContext = Record<string, unknown>;

const IS_DEV = import.meta.env.DEV;

function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (value instanceof Error) {
        return [key, getErrorMessage(value)];
      }
      return [key, value];
    }),
  );
}

function emit(
  level: "error" | "warn" | "info",
  message: string,
  context?: LogContext,
) {
  const safeContext = {
    ...sanitizeContext(context),
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
    timestamp: new Date().toISOString(),
  };

  if (IS_DEV) {
    if (level === "error") {
      console.error(message, safeContext);
    } else if (level === "warn") {
      console.warn(message, safeContext);
    } else {
      console.info(message, safeContext);
    }
    return;
  }

  // Production sink: For now, we log to console in a structured way
  // In a real production environment, this would call a Supabase Edge Function or Sentry
  console.log(JSON.stringify({ level, message, ...safeContext }));
}

export const logger = {
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
};
