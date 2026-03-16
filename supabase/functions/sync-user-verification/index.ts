/// <reference path="../_shared/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/email.ts";

interface SyncPayload {
  userId?: string;
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

    const payload = (await req.json().catch(() => ({}))) as SyncPayload;
    
    // Auth header check as fallback for userId
    const authHeader = req.headers.get("Authorization");
    let userId = payload.userId;
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    if (!userId && authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await adminClient.auth.getUser(token);
      if (!userError && user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return jsonResponse(400, { error: "User ID is required" }, req);
    }

    // 1. Fetch user confirmation status
    const { data: user, error: fetchError } = await adminClient.auth.admin.getUserById(userId);
    
    if (fetchError || !user || !user.user) {
      throw fetchError || new Error("User not found");
    }

    const isConfirmed = !!user.user.email_confirmed_at;

    if (!isConfirmed) {
      return jsonResponse(200, { 
        ok: false, 
        message: "User email is not yet confirmed in Auth",
        state: "pending_verification"
      }, req);
    }

    // 2. Identify and update memberships
    // Fetch pending memberships to determine target state
    const { data: memberships, error: memberError } = await adminClient
      .from("organization_memberships")
      .select("id, role, account_state")
      .eq("user_id", userId)
      .eq("account_state", "pending_verification");

    if (memberError) throw memberError;

    if (!memberships || memberships.length === 0) {
      return jsonResponse(200, { 
        ok: true, 
        message: "No pending verification memberships found",
        state: "active" 
      }, req);
    }

    let activatedCount = 0;
    for (const m of memberships) {
      const targetState = m.role === "client" ? "pending_approval" : "active";
      
      const { error: updateError } = await adminClient
        .from("organization_memberships")
        .update({
          account_state: targetState,
          is_email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq("id", m.id);
        
      if (!updateError) activatedCount++;
    }

    return jsonResponse(200, { 
      ok: true, 
      message: `Successfully synchronized verification for ${activatedCount} membership(s)`,
      activatedCount
    }, req);

  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Sync verification function error:", message);
    return jsonResponse(500, { error: message }, req);
  }
});
