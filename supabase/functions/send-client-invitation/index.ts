import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, sendResendEmail } from "../_shared/resend.ts";

interface ClientInvitePayload {
  recipientEmail: string;
  organizationName: string;
  organizationCode: string;
  inviterName?: string;
  expiresAt: string;
  invitationUrl: string;
}

function renderHtml(payload: ClientInvitePayload): string {
  return `
  <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #111;">
    <h2>You're invited to access ${payload.organizationName} Portal</h2>
    <p>Hi,</p>
    <p>You have been invited to the client portal.</p>
    <p><strong>Organization:</strong> ${payload.organizationName}<br/>
    <strong>Organization Code:</strong> ${payload.organizationCode}<br/>
    <strong>Expires:</strong> ${new Date(payload.expiresAt).toUTCString()}</p>
    <p>
      <a href="${payload.invitationUrl}" style="display:inline-block;padding:10px 16px;background:#0b5fff;color:#fff;text-decoration:none;border-radius:6px;">
        Accept Invitation
      </a>
    </p>
    <p>If the button does not work, use this URL:</p>
    <p>${payload.invitationUrl}</p>
    <p>Sent by ${payload.inviterName ?? payload.organizationName}</p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase env vars");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as ClientInvitePayload;

    if (!payload.recipientEmail || !payload.organizationName || !payload.organizationCode || !payload.invitationUrl) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendResendEmail({
      to: payload.recipientEmail,
      subject: `You've been invited to ${payload.organizationName} client portal`,
      html: renderHtml(payload),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
