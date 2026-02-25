import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";
import heroBg from "@/assets/hero-bg.jpg";
import {
  organizationDashboardPath,
  organizationOwnerPath,
  organizationPortalPath,
  platformPath,
} from "@/lib/routes";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, role, loading } = useAuth();
  const { organization } = useOrganization();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || !role) return;

    if (role === "platform_super_admin" || role === "platform_admin") {
      navigate(platformPath(), { replace: true });
      return;
    }

    if (role === "owner") {
      navigate(organizationOwnerPath(), { replace: true });
      return;
    }

    if (role === "admin" || role === "manager" || role === "employee" || role === "user") {
      if (organization?.slug) {
        navigate(organizationDashboardPath(organization.slug), { replace: true });
      }
      return;
    }

    if (role === "client") {
      if (organization?.slug) {
        navigate(organizationPortalPath(organization.slug), { replace: true });
      }
      return;
    }

    if (role === "pending_approval") {
      navigate("/auth/pending-approval", { replace: true });
      return;
    }

    if (role === "rejected") {
      navigate("/unauthorized", { replace: true });
    }
  }, [navigate, organization?.slug, role, user]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    const { error, role: resolvedRole } = await signIn(email.trim(), password, rememberMe);

    setSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error,
      });
      return;
    }

    if (resolvedRole === "pending_approval") {
      navigate("/auth/pending-approval");
      return;
    }

    if (resolvedRole === "rejected") {
      navigate("/unauthorized");
      return;
    }

    toast({
      title: "Welcome back",
      description: "Signed in successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f0edf7_0%,#e1dced_45%,#d0c9e2_100%)] px-4 py-6 sm:px-6 lg:px-8 dark:bg-[linear-gradient(135deg,#1d1928_0%,#191525_45%,#120f1d_100%)]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center lg:min-h-[calc(100vh-5rem)]">
        <div className="w-full animate-scale-in overflow-hidden rounded-3xl border border-white/50 bg-white/70 shadow-[0_30px_80px_-28px_rgba(40,26,74,0.55)] backdrop-blur-sm dark:border-slate-500/35 dark:bg-[rgba(20,16,34,0.94)]">
          <div className="grid lg:grid-cols-[1.02fr_1fr]">
            <aside className="hidden p-5 lg:block">
              <div className="relative h-full min-h-[540px] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
                <img src={heroBg} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(82,69,150,0.36)_0%,rgba(20,15,39,0.92)_100%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.15)_0%,transparent_45%)]" />
                <div className="relative z-10 flex h-full flex-col justify-between p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex rounded-full border border-white/25 bg-black/20 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white">
                      SISWIT
                    </span>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-white/95 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to website
                    </Link>
                  </div>

                  <div className="space-y-4">
                    <p className="max-w-[220px] text-2xl font-semibold leading-tight text-white">
                      Secure access, shared workspaces, better collaboration.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-10 rounded-full bg-white" />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
              <div className="mx-auto w-full max-w-sm">
                <div className="mb-6 flex items-center justify-between lg:hidden">
                  <span className="inline-flex rounded-full border border-slate-300/80 bg-white/70 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-slate-900 dark:border-white/20 dark:bg-white/[0.08] dark:text-white">
                    SISWIT
                  </span>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-white/70 px-3 py-1 text-xs text-slate-700 transition hover:bg-white dark:border-white/15 dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/[0.14]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to website
                  </Link>
                </div>

                <div className="space-y-2">
                  <p className="inline-flex rounded-full bg-violet-600/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-700 dark:bg-violet-400/20 dark:text-violet-100">
                    Account Access
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sign in</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300">Access your organization workspace.</p>
                </div>

                <form onSubmit={onSubmit} className="mt-6 space-y-4">
                  <div>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      required
                      className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
                    />
                  </div>

                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="h-11 rounded-xl border-slate-300/80 bg-white/70 pr-10 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 transition hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 dark:text-slate-300 dark:hover:text-slate-100 dark:focus-visible:ring-violet-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1 text-sm">
                    <label className="flex items-center gap-2.5 text-slate-700 dark:text-slate-200">
                      <Checkbox
                        checked={rememberMe}
                        onCheckedChange={(v) => setRememberMe(Boolean(v))}
                        className="border-slate-400 data-[state=checked]:border-violet-500 data-[state=checked]:bg-violet-500 dark:border-slate-500 dark:data-[state=checked]:border-violet-400 dark:data-[state=checked]:bg-violet-400"
                      />
                      <span>Remember me</span>
                    </label>
                    <Link
                      to="/auth/forgot-password"
                      className="font-medium text-violet-700 hover:underline dark:text-violet-200 dark:hover:text-violet-100"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    className="h-11 w-full rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-700/25 transition hover:bg-violet-500 dark:bg-violet-400 dark:shadow-violet-500/35 dark:hover:bg-violet-300"
                    disabled={submitting || loading}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>

                <div className="mt-6 space-y-2 border-t border-slate-200/80 pt-5 text-sm text-slate-600 dark:border-slate-500/35 dark:text-slate-300">
                  <p>
                    New organization?{" "}
                    <Link className="font-medium text-violet-700 hover:underline dark:text-violet-200 dark:hover:text-violet-100" to="/auth/sign-up?tab=organization">
                      Sign up your organization
                    </Link>
                  </p>
                  <p>
                    Joining as client?{" "}
                    <Link className="font-medium text-violet-700 hover:underline dark:text-violet-200 dark:hover:text-violet-100" to="/auth/sign-up?tab=client">
                      Client sign up
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
