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
  const safeContext = sanitizeContext(context);

  if (IS_DEV) {
    if (level === "error") {
      console.error(message, safeContext);
      return;
    }
    if (level === "warn") {
      console.warn(message, safeContext);
      return;
    }
    console.info(message, safeContext);
    return;
  }

  // Production sink placeholder (Sentry/Datadog/etc).
  // Integrate provider SDK here to forward logs with `level`, `message`, and `safeContext`.
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
