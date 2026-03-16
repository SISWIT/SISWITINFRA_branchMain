/// <reference path="../_shared/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, sendEmail } from "../_shared/email.ts";
import { buildVerificationEmail } from "../_shared/verification-email.ts";

interface VerificationPayload {
  email: string;
  redirectTo?: string;
}

function jsonResponse(status: number, body: Record<string, unknown>, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error("Missing Supabase env vars");
    }

    const payload = (await req.json()) as VerificationPayload;

    if (!payload.email) {
      return jsonResponse(400, { error: "Email is required" }, req);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Generate the verification/magiclink link
    // magiclink is used for existing users to confirm email without needing a password
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email: payload.email,
      options: {
        redirectTo: payload.redirectTo,
      },
    });

    if (linkError) {
      throw linkError;
    }

    const verificationUrl = linkData.properties.action_link;

    // Build email content
    const emailContent = buildVerificationEmail({
      verificationUrl,
    });

    // Send the email via SMTP
    await sendEmail({
      to: payload.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return jsonResponse(200, { ok: true, provider: "smtp" }, req);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Verification email function error:", message);
    return jsonResponse(500, { error: message }, req);
  }
});
