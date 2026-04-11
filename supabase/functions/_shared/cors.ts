/// <reference path="./edge-runtime.d.ts" />

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? Deno.env.get("ALLOWED_ORIGIN") ?? "https://app.siswitinfra.com")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

function getOriginHeader(request?: Request): string {
  const requestOrigin = request?.headers?.get("origin") ?? "";

  if (requestOrigin.startsWith("http://localhost:") || requestOrigin.startsWith("http://127.0.0.1:")) {
    return requestOrigin;
  }

  if (ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }

  return requestOrigin || ALLOWED_ORIGINS[0] || "*";
}

export function getCorsHeaders(request?: Request) {
  return {
    "Access-Control-Allow-Origin": getOriginHeader(request),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}
