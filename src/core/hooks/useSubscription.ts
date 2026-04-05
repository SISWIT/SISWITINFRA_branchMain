import { useCallback, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/core/api/client";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import {
  useBillingInfo,
  useCreateBillingCustomer,
} from "@/workspaces/organization/hooks/useBilling";
import { toast } from "sonner";
import type { PlanType } from "@/core/utils/plan-limits";
import { PLAN_MODULES } from "@/core/utils/plan-limits";
import type { ModuleType } from "@/core/types/modules";

export interface SubscriptionStatus {
  plan_type: PlanType;
  status: string;
  is_trial: boolean;
  trial_start_date: string | null;
  trial_end_date: string | null;
  trial_days_remaining: number | null;
  razorpay_subscription_id: string | null;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  cancelled_at: string | null;
  cancel_reason?: string | null;
  billing_customer_id: string | null;
}

export interface SubscriptionEvent {
  id: string;
  organization_id: string;
  event_type: string;
  plan_type: string | null;
  amount: number | null;
  razorpay_payment_id: string | null;
  razorpay_subscription_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface UseSubscriptionReturn {
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  isTrial: boolean;
  trialDaysRemaining: number | null;
  isExpired: boolean;
  isActive: boolean;
  isCancelled: boolean;
  initiateCheckout: (planType: PlanType, opts?: { onBeforeOpen?: () => void }) => Promise<void>;
  cancelSubscription: (reason: string) => Promise<void>;
  isCheckoutPending: boolean;
  isCancelPending: boolean;
  events: SubscriptionEvent[];
  eventsLoading: boolean;
  refresh: () => void;
  /** Check if a module is accessible under the current plan */
  canAccessModule: (module: ModuleType) => boolean;
  /** List of modules allowed by the current plan */
  allowedModules: ModuleType[];
  /** Effective plan type — 'foundation' when cancelled, otherwise the DB plan */
  effectivePlan: PlanType;
}

interface EdgeFunctionErrorPayload {
  error?: string;
  details?: string;
  detail?: string;
}

let razorpayScriptLoaded = false;
let razorpayScriptLoading: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (razorpayScriptLoaded) return Promise.resolve();
  if (razorpayScriptLoading) return razorpayScriptLoading;

  razorpayScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => {
      razorpayScriptLoaded = true;
      resolve();
    };
    script.onerror = () => {
      razorpayScriptLoading = null;
      reject(new Error("Failed to load Razorpay checkout script"));
    };
    document.head.appendChild(script);
  });

  return razorpayScriptLoading;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  prefill?: {
    name?: string;
    email?: string;
  };
  theme?: {
    color?: string;
  };
  notes?: Record<string, string>;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

const PLAN_DISPLAY_NAMES: Record<PlanType, string> = {
  foundation: "Foundation CRM",
  growth: "Revenue Growth",
  commercial: "Commercial Control",
  enterprise: "Enterprise Governance",
};

export function useSubscription(): UseSubscriptionReturn {
  const { organization, refreshOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const { data: billingInfo } = useBillingInfo();
  const createCustomer = useCreateBillingCustomer();

  const organizationId = organization?.id ?? null;

  const subscriptionQuery = useQuery<SubscriptionStatus | null>({
    queryKey: ["subscription_status", organizationId],
    enabled: !!organizationId,
    staleTime: 15_000,
    queryFn: async (): Promise<SubscriptionStatus | null> => {
      if (!organizationId) return null;

      const { data, error } = await supabase.rpc("get_subscription_status", {
        p_org_id: organizationId,
      });

      if (error) {
        console.error("Failed to fetch subscription status:", error);
        return null;
      }

      return (data as SubscriptionStatus | null) ?? null;
    },
  });

  const subscription = subscriptionQuery.data ?? null;
  const isLoading = subscriptionQuery.isLoading;

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["subscription_events", organizationId],
    enabled: !!organizationId,
    staleTime: 30_000,
    queryFn: async (): Promise<SubscriptionEvent[]> => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("subscription_events")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Failed to fetch subscription events:", error);
        return [];
      }

      return (data as unknown as SubscriptionEvent[]) ?? [];
    },
  });

  const isTrial = subscription?.is_trial ?? false;
  const trialDaysRemaining = subscription?.trial_days_remaining ?? null;
  const isActive =
    subscription?.status === "active" && subscription?.is_trial === false;
  const isCancelled = subscription?.status === "cancelled";

  const isExpired = useMemo(() => {
    if (!subscription) return false;
    if (subscription.status === "cancelled") return true;
    if (subscription.is_trial && subscription.trial_end_date) {
      return new Date(subscription.trial_end_date) < new Date();
    }
    if (subscription.subscription_end_date) {
      return new Date(subscription.subscription_end_date) < new Date();
    }
    return false;
  }, [subscription]);

  // Module access based on plan
  // When cancelled, the DB may still have the old plan_type — treat as foundation
  const currentPlan: PlanType = isCancelled
    ? "foundation"
    : (subscription?.plan_type ?? "foundation");
  const allowedModules = useMemo(
    () => PLAN_MODULES[currentPlan] ?? PLAN_MODULES.foundation,
    [currentPlan],
  );

  const canAccessModule = useCallback(
    (module: ModuleType): boolean => {
      return allowedModules.includes(module);
    },
    [allowedModules],
  );

  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: ["subscription_status", organizationId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["subscription_events", organizationId],
    });
    void queryClient.invalidateQueries({
      queryKey: ["billing_info", organizationId],
    });
    // Crucial: also update the global organization context which stores
    // the actual plan_type and module entry flags (CRM, CPQ, etc.)
    void refreshOrganization();
  }, [organizationId, queryClient, refreshOrganization]);

  // Ref to hold the onBeforeOpen callback so the mutation closure can read it
  const onBeforeOpenRef = useRef<(() => void) | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: async (planType: PlanType) => {
      if (!organizationId) throw new Error("No organization context");

      let customerId = billingInfo?.customer_id ?? null;
      const billingEmail =
        billingInfo?.billing_email?.trim() || organization?.company_email?.trim() || "";
      const billingName =
        billingInfo?.billing_contact_name?.trim() || organization?.name?.trim() || "";

      if (!customerId) {
        if (!billingEmail) {
          throw new Error(
            "Please set a company email in organization settings first",
          );
        }

        const customerResult = (await createCustomer.mutateAsync({
          email: billingEmail,
          name: billingName,
        })) as { customer_id?: string | null } | null;

        customerId = customerResult?.customer_id ?? null;
      }

      const { data: fnData, error: fnError, response } =
        await supabase.functions.invoke(
          "create-razorpay-subscription",
          {
            body: {
              organization_id: organizationId,
              plan_type: planType,
              customer_id: customerId,
            },
          },
        );

      if (fnError) {
        let errorMessage =
          fnError.message ?? "Failed to create subscription";

        if (response) {
          try {
            const contentType = response.headers.get("content-type") ?? "";

            if (contentType.includes("application/json")) {
              const errorPayload =
                (await response.json()) as EdgeFunctionErrorPayload;
              const detailedMessage = [
                errorPayload.error,
                errorPayload.details,
                errorPayload.detail,
              ]
                .filter(Boolean)
                .join(": ");

              if (detailedMessage) {
                errorMessage = detailedMessage;
              }
            } else {
              const responseText = (await response.text()).trim();
              if (responseText) {
                errorMessage = responseText;
              }
            }
          } catch (parseError) {
            console.error(
              "Failed to parse create-razorpay-subscription error response:",
              parseError,
            );
          }
        }

        throw new Error(errorMessage);
      }

      const subData = fnData as
        | {
          subscription_id?: string;
          short_url?: string;
        }
        | null;

      if (!subData?.subscription_id) {
        throw new Error("Subscription was created without an id");
      }

      const razorpaySubscriptionId: string = subData.subscription_id;

      await loadRazorpayScript();

      return new Promise<void>((resolve, reject) => {
        const envKey = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim();
        if (!envKey) {
          reject(new Error("Razorpay key is not configured"));
          return;
        }

        const razorpayKeyId: string = envKey;

        if (!window.Razorpay) {
          reject(new Error("Razorpay checkout did not load"));
          return;
        }

        const options: RazorpayOptions = {
          key: razorpayKeyId,
          subscription_id: razorpaySubscriptionId,
          name: "SISWIT",
          description: `${PLAN_DISPLAY_NAMES[planType]} - Monthly Subscription`,
          handler: (_response: RazorpayResponse) => {
            toast.success(
              "Payment successful! Your plan is now active.",
            );
            // Refresh immediately so the UI updates right away
            refresh();
            // Also invalidate all organization-related queries
            queryClient.invalidateQueries({ queryKey: ["organization-stats"] });
            queryClient.invalidateQueries({ queryKey: ["organization-performance"] });
            // Staggered refreshes as backup in case webhook processing is slow
            setTimeout(() => refresh(), 3_000);
            setTimeout(() => refresh(), 8_000);
            setTimeout(() => refresh(), 15_000);
            resolve();
          },
          modal: {
            ondismiss: () => {
              toast.info("Payment cancelled.");
              reject(new Error("Payment cancelled by user"));
            },
          },
          prefill: {
            name: organization?.name,
            email: organization?.company_email ?? undefined,
          },
          theme: {
            color: "#7c3aed",
          },
          notes: {
            organization_id: organizationId,
            plan_type: planType,
          },
        };

        // Fire the onBeforeOpen callback (e.g. close the plan-selection
        // dialog) so that any focus traps are released before the
        // Razorpay iframe appears.
        if (onBeforeOpenRef.current) {
          onBeforeOpenRef.current();
          onBeforeOpenRef.current = null;
        }

        // Small delay to let callers (dialog unmount) settle, then open
        setTimeout(() => {
          try {
            const razorpay = new window.Razorpay!(options);
            razorpay.open();
            // Focus the Razorpay iframe after it renders
            setTimeout(() => {
              const rzpFrame = document.querySelector<HTMLIFrameElement>(
                "iframe.razorpay-checkout-frame",
              );
              if (rzpFrame) {
                rzpFrame.focus();
              }
            }, 500);
          } catch (error) {
            reject(
              new Error(
                `Failed to open Razorpay checkout: ${
                  error instanceof Error ? error.message : String(error)
                }`,
              ),
            );
          }
        }, 200);
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      if (message !== "Payment cancelled by user") {
        toast.error(`Checkout failed: ${message}`);
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!organizationId) throw new Error("No organization context");

      const { error } = await supabase.rpc("cancel_subscription", {
        p_org_id: organizationId,
        p_reason: reason,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        "Subscription cancelled. The plan has been downgraded to Foundation CRM.",
      );
      refresh();
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(`Failed to cancel subscription: ${message}`);
    },
  });

  const initiateCheckout = useCallback(
    async (planType: PlanType, opts?: { onBeforeOpen?: () => void }) => {
      // Store callback in ref so the mutation closure can read it
      onBeforeOpenRef.current = opts?.onBeforeOpen ?? null;
      try {
        await checkoutMutation.mutateAsync(planType);
      } finally {
        onBeforeOpenRef.current = null;
      }
    },
    [checkoutMutation],
  );

  const cancelSubscription = useCallback(
    async (reason: string) => {
      await cancelMutation.mutateAsync(reason);
    },
    [cancelMutation],
  );

  return {
    subscription,
    isLoading,
    isTrial,
    trialDaysRemaining,
    isExpired,
    isActive,
    isCancelled,
    initiateCheckout,
    cancelSubscription,
    isCheckoutPending: checkoutMutation.isPending,
    isCancelPending: cancelMutation.isPending,
    events,
    eventsLoading,
    refresh,
    canAccessModule,
    allowedModules,
    effectivePlan: currentPlan,
  };
}
