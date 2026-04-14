/// <reference path="../_shared/edge-runtime.d.ts" />

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req?: Request): Record<string, string> {
  const origin = req?.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

function jsonResponse(
  status: number,
  body: Record<string, unknown>,
  req?: Request,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
  });
}

const PLAN_ENV_MAP: Record<string, string> = {
  foundation: "RAZORPAY_PLAN_FOUNDATION",
  growth: "RAZORPAY_PLAN_GROWTH",
  commercial: "RAZORPAY_PLAN_COMMERCIAL",
  enterprise: "RAZORPAY_PLAN_ENTERPRISE",
};

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

/**
 * Searches for a Razorpay customer by email address.
 * Since Razorpay doesn't support direct filtering by email in the GET /customers endpoint,
 * we fetch the most recent customers and filter locally.
 */
async function findRazorpayCustomerByEmail(
  email: string,
  basicAuth: string,
): Promise<string | null> {
  try {
    const response = await fetch(`${RAZORPAY_API_BASE}/customers?count=100`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error(
        "Failed to fetch customers for lookup:",
        await response.text(),
      );
      return null;
    }

    const data = (await response.json()) as {
      items?: Array<{ id: string; email?: string }>;
    };

    const targetEmail = email.toLowerCase().trim();
    const existingCustomer = data.items?.find(
      (c) => c.email?.toLowerCase().trim() === targetEmail,
    );

    return existingCustomer?.id || null;
  } catch (error) {
    console.error("Error during Razorpay customer lookup:", error);
    return null;
  }
}

interface CreateSubscriptionRequest {
  organization_id: string;
  plan_type: string;
  customer_id?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: getCorsHeaders(req) });
  }

  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" }, req);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse(500, { error: "Server configuration error" }, req);
    }

    let payload: CreateSubscriptionRequest;
    try {
      payload = (await req.json()) as CreateSubscriptionRequest;
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" }, req);
    }

    if (
      !payload.organization_id ||
      !payload.plan_type
    ) {
      return jsonResponse(
        400,
        {
          error: "Missing required fields: organization_id, plan_type",
        },
        req,
      );
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return jsonResponse(401, { error: "Missing authorization header" }, req);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: authError } = await userClient.auth.getUser();
    if (authError || !userData?.user) {
      return jsonResponse(
        401,
        {
          error: "Unauthorized. Please sign in again.",
          detail: authError?.message,
        },
        req,
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: membership, error: memberError } = await serviceClient
      .from("organization_memberships")
      .select("role")
      .eq("organization_id", payload.organization_id)
      .eq("user_id", userData.user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (memberError || !membership) {
      return jsonResponse(
        403,
        { error: "Not a member of this organization" },
        req,
      );
    }

    if (!["owner", "admin"].includes(membership.role)) {
      return jsonResponse(
        403,
        { error: "Only owners and admins can create subscriptions" },
        req,
      );
    }

    const planEnvKey = PLAN_ENV_MAP[payload.plan_type];
    if (!planEnvKey) {
      return jsonResponse(
        400,
        { error: `Invalid plan type: ${payload.plan_type}` },
        req,
      );
    }

    const razorpayPlanId = Deno.env.get(planEnvKey);
    if (!razorpayPlanId) {
      return jsonResponse(
        500,
        {
          error: `Razorpay plan ID is not configured for ${payload.plan_type}. Set ${planEnvKey} in Edge Function secrets.`,
        },
        req,
      );
    }

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeyId || !razorpayKeySecret) {
      return jsonResponse(
        500,
        {
          error:
            "Razorpay API keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Edge Function secrets.",
        },
        req,
      );
    }

    const basicAuth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const { data: billingCustomer, error: billingError } = await serviceClient
      .from("billing_customers")
      .select("billing_email, billing_contact_name, razorpay_customer_id")
      .eq("organization_id", payload.organization_id)
      .maybeSingle();

    if (billingError) {
      return jsonResponse(
        500,
        {
          error: "Failed to load billing profile",
          detail: billingError.message,
        },
        req,
      );
    }

    const { data: organizationRecord, error: organizationError } =
      await serviceClient
        .from("organizations")
        .select("name, company_email")
        .eq("id", payload.organization_id)
        .maybeSingle();

    if (organizationError) {
      return jsonResponse(
        500,
        {
          error: "Failed to load organization details",
          detail: organizationError.message,
        },
        req,
      );
    }

    const billingEmail =
      billingCustomer?.billing_email?.trim() ||
      organizationRecord?.company_email?.trim() ||
      null;
    const billingName =
      billingCustomer?.billing_contact_name?.trim() ||
      organizationRecord?.name?.trim() ||
      `Organization ${payload.organization_id.slice(0, 8)}`;

    const candidateCustomerIds = Array.from(
      new Set(
        [
          payload.customer_id ?? null,
          billingCustomer?.razorpay_customer_id ?? null,
        ].filter(
          (customerId): customerId is string => !!customerId && customerId.trim().length > 0,
        ),
      ),
    );

    let resolvedCustomerId: string | null = null;

    for (const candidateCustomerId of candidateCustomerIds) {
      const verifyResponse = await fetch(
        `${RAZORPAY_API_BASE}/customers/${encodeURIComponent(candidateCustomerId)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (verifyResponse.ok) {
        resolvedCustomerId = candidateCustomerId;
        break;
      }

      const verifyErrorBody = await verifyResponse.text();
      let idDoesNotExist = verifyResponse.status === 404;

      // Handle Razorpay returning 400 "The id provided does not exist" for environment mismatches
      if (verifyResponse.status === 400) {
        try {
          const errorJson = JSON.parse(verifyErrorBody);
          if (errorJson.error?.description?.toLowerCase().includes("does not exist")) {
            idDoesNotExist = true;
          }
        } catch {
          // Fallback to strict status check
        }
      }

      if (!idDoesNotExist) {
        return jsonResponse(
          502,
          {
            error: "Failed to verify billing customer with Razorpay",
            details: verifyErrorBody,
          },
          req,
        );
      }
    }

    if (!resolvedCustomerId) {
      const createCustomerResponse = await fetch(`${RAZORPAY_API_BASE}/customers`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: billingName,
          email: billingEmail ?? undefined,
          notes: {
            organization_id: payload.organization_id,
          },
        }),
      });

      if (!createCustomerResponse.ok) {
        const createCustomerErrorBody = await createCustomerResponse.text();
        let wasConflict = false;

        try {
          const errorJson = JSON.parse(createCustomerErrorBody);
          // Handle "Customer already exists for the merchant" error (BAD_REQUEST_ERROR)
          if (
            errorJson.error?.code === "BAD_REQUEST_ERROR" &&
            errorJson.error?.description?.toLowerCase().includes(
              "customer already exists",
            )
          ) {
            wasConflict = true;
          }
        } catch {
          // If not JSON, we can't be sure, but we'll fall back to returning the error
        }

        if (wasConflict && billingEmail) {
          console.log(
            `Handling Razorpay customer conflict for email: ${billingEmail}. Attempting to recover existing ID...`,
          );
          const recoveredId = await findRazorpayCustomerByEmail(
            billingEmail,
            basicAuth,
          );
          if (recoveredId) {
            console.log(`Successfully recovered customer ID: ${recoveredId}`);
            resolvedCustomerId = recoveredId;
          } else {
            console.error(
              "Razorpay reported customer exists, but lookup failed to find them in the recent 100 records.",
            );
          }
        }

        // If we didn't resolve it (either not a conflict or recovery failed), return the error
        if (!resolvedCustomerId) {
          return jsonResponse(
            502,
            {
              error: "Failed to create billing customer with Razorpay",
              details: createCustomerErrorBody,
            },
            req,
          );
        }
      } else {
        const createdCustomer = (await createCustomerResponse.json()) as {
          id?: string;
        };
        resolvedCustomerId = createdCustomer.id || null;
      }

      if (!resolvedCustomerId) {
        return jsonResponse(
          502,
          {
            error:
              "Razorpay customer creation completed without returning an id",
          },
          req,
        );
      }
    }

    if (!resolvedCustomerId) {
      return jsonResponse(
        500,
        { error: "Unable to resolve a Razorpay customer for this organization" },
        req,
      );
    }

    const razorpayCustomerId = resolvedCustomerId;

    const { error: upsertBillingError } = await serviceClient
      .from("billing_customers")
      .upsert(
        {
          organization_id: payload.organization_id,
          billing_email: billingEmail,
          billing_contact_name: billingName,
          razorpay_customer_id: razorpayCustomerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "organization_id" },
      );

    if (upsertBillingError) {
      console.error(
        "Failed to store Razorpay customer reference:",
        upsertBillingError.message,
      );
    }

    const razorpayResponse = await fetch(`${RAZORPAY_API_BASE}/subscriptions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan_id: razorpayPlanId,
        customer_id: razorpayCustomerId,
        total_count: 120,
        quantity: 1,
        notes: {
          organization_id: payload.organization_id,
          plan_type: payload.plan_type,
        },
      }),
    });

    if (!razorpayResponse.ok) {
      const errorBody = await razorpayResponse.text();
      return jsonResponse(
        502,
        {
          error: "Failed to create subscription with Razorpay",
          details: errorBody,
        },
        req,
      );
    }

    const razorpayData = (await razorpayResponse.json()) as {
      id: string;
      short_url: string;
      status: string;
    };

    const { error: updateErr } = await serviceClient
      .from("organization_subscriptions")
      .update({
        razorpay_subscription_id: razorpayData.id,
        razorpay_plan_id: razorpayPlanId,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", payload.organization_id);

    if (updateErr) {
      console.error("Failed to store subscription reference:", updateErr.message);
    }

    const { error: updateBillingErr } = await serviceClient
      .from("billing_customers")
      .update({
        razorpay_customer_id: razorpayCustomerId,
        razorpay_subscription_id: razorpayData.id,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", payload.organization_id);

    if (updateBillingErr) {
      console.error(
        "Failed to store billing subscription reference:",
        updateBillingErr.message,
      );
    }

    return jsonResponse(
      200,
      {
        subscription_id: razorpayData.id,
        short_url: razorpayData.short_url,
        status: razorpayData.status,
      },
      req,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Unhandled create-razorpay-subscription error:", message);
    return jsonResponse(500, { error: message }, req);
  }
});
