import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, ArrowRight, Home, Loader2 } from "lucide-react";
import { Button } from "@/ui/shadcn/button";
import { useAuth } from "@/core/auth/useAuth";
import { useOrganization } from "@/workspaces/organization/hooks/useOrganization";
import { organizationDashboardPath, organizationPortalPath } from "@/core/utils/routes";

const VerifySuccess = () => {
  const navigate = useNavigate();
  const { role, loading: authLoading } = useAuth();
  const { organization } = useOrganization();
  const [countdown, setCountdown] = useState(5);
  const [redirectPath, setRedirectPath] = useState("/");

  useEffect(() => {
    if (authLoading) return;

    // Determine where to send the user based on their role
    let path = "/";
    if (role === "platform_super_admin" || (role as string) === "platform_admin") {
      path = "/platform";
    } else if (role === "owner") {
      path = "/organization/overview";
    } else if (role === "client") {
      if (organization?.slug) {
        path = organizationPortalPath(organization.slug);
      }
    } else if (role && organization?.slug) {
      path = organizationDashboardPath(organization.slug);
    }
    
    setRedirectPath(path);

    // Auto-redirect after countdown
    if (role && (role as string) !== "pending_verification") {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(path, { replace: true });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [authLoading, navigate, organization?.slug, role]);

  return (
    <div className="relative min-h-screen gradient-hero flex items-center justify-center px-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="pointer-events-none absolute inset-0 hidden dark:block">
        <div className="absolute -left-16 top-16 h-72 w-72 rounded-full bg-info/20 blur-3xl" />
        <div className="absolute bottom-8 right-8 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <div className="w-full max-w-xl animate-scale-in">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/85 shadow-card backdrop-blur-md dark:border-primary/20 dark:bg-[rgba(16,12,30,0.88)] p-8 sm:p-12 text-center">
          
          {/* Success Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative rounded-full bg-green-500/10 p-4 dark:bg-green-500/20">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white sm:text-4xl">
              Email Verified!
            </h1>
            <p className="text-lg text-muted-foreground dark:text-white/70 max-w-sm mx-auto">
              Your SISWIT account is now active and ready to use. Thank you for confirming your email.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {authLoading ? (
              <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Finalizing your workspace...</span>
              </div>
            ) : (
              <>
                <Button 
                  asChild
                  className="h-12 px-8 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 dark:bg-[#9d84e8] dark:hover:bg-[#ad95f0]"
                >
                  <Link to={redirectPath} className="flex items-center gap-2">
                    Go to Dashboard
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                
                <p className="text-sm text-muted-foreground dark:text-white/50">
                  Redirecting automatically in {countdown} seconds...
                </p>
              </>
            )}
          </div>

          <div className="mt-8 pt-8 border-t border-border/50 dark:border-white/10 flex justify-center gap-6">
            <Link to="/" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1.5">
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifySuccess;
