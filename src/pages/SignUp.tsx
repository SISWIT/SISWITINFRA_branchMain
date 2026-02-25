import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import heroBg from "@/assets/hero-bg.jpg";

type SignupTab = "organization" | "client";

type SignupOrganizationRow = {
  id: string;
  name: string;
  slug: string;
  org_code: string;
};

function makeCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 5) || "ORG";
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${suffix}`;
}

export default function SignUp() {
  const { signUpOrganization, signUpClientSelf, loading } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab: SignupTab = searchParams.get("tab") === "client" ? "client" : "organization";

  const [organizationName, setOrganizationName] = useState("");
  const [organizationCode, setOrganizationCode] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [organizationPassword, setOrganizationPassword] = useState("");
  const [organizationConfirmPassword, setOrganizationConfirmPassword] = useState("");
  const [organizationSubmitting, setOrganizationSubmitting] = useState(false);
  const [organizationSubmitted, setOrganizationSubmitted] = useState(false);

  const [organizationLookup, setOrganizationLookup] = useState("");
  const [organizationSearchResults, setOrganizationSearchResults] = useState<SignupOrganizationRow[]>([]);
  const [organizationSearchLoading, setOrganizationSearchLoading] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<SignupOrganizationRow | null>(null);

  const [clientFullName, setClientFullName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [clientConfirmPassword, setClientConfirmPassword] = useState("");
  const [clientSubmitting, setClientSubmitting] = useState(false);
  const [clientSubmitted, setClientSubmitted] = useState(false);

  const suggestedCode = useMemo(() => makeCode(organizationName || "ORG"), [organizationName]);

  useEffect(() => {
    if (activeTab !== "client") {
      setOrganizationSearchResults([]);
      setOrganizationSearchLoading(false);
      return;
    }

    const query = organizationLookup.trim();
    if (query.length < 2) {
      setOrganizationSearchResults([]);
      setOrganizationSearchLoading(false);
      return;
    }

    let cancelled = false;
    setOrganizationSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("search_signup_organizations", {
          p_query: query,
          p_limit: 8,
        });

        if (cancelled) return;

        if (error || !Array.isArray(data)) {
          setOrganizationSearchResults([]);
          return;
        }

        const rows = data.filter(
          (row: unknown): row is SignupOrganizationRow =>
            Boolean(
              row &&
                typeof row === "object" &&
                "id" in row &&
                "name" in row &&
                "slug" in row &&
                "org_code" in row,
            ),
        );

        setOrganizationSearchResults(rows);
      } catch {
        if (!cancelled) {
          setOrganizationSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setOrganizationSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeTab, organizationLookup]);

  const setTab = (value: string) => {
    if (value !== "organization" && value !== "client") return;
    const next = new URLSearchParams(searchParams);
    next.set("tab", value);
    setSearchParams(next, { replace: true });
  };

  const onOrganizationSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (organizationPassword !== organizationConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    setOrganizationSubmitting(true);

    const { error } = await signUpOrganization({
      organizationName,
      organizationCode: organizationCode || suggestedCode,
      ownerFullName,
      email: organizationEmail,
      password: organizationPassword,
    });

    setOrganizationSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error,
      });
      return;
    }

    setOrganizationSubmitted(true);
  };

  const onClientSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!organizationLookup.trim()) {
      toast({
        variant: "destructive",
        title: "Organization required",
        description: "Select or enter an organization name, slug, or code.",
      });
      return;
    }

    if (clientPassword !== clientConfirmPassword) {
      toast({
        variant: "destructive",
        title: "Password mismatch",
        description: "Password and confirm password must match.",
      });
      return;
    }

    setClientSubmitting(true);

    const { error } = await signUpClientSelf({
      organizationSlugOrCode: organizationLookup.trim(),
      fullName: clientFullName,
      email: clientEmail,
      phoneNumber: clientPhone || undefined,
      password: clientPassword,
    });

    setClientSubmitting(false);

    if (error) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error,
      });
      return;
    }

    setClientSubmitted(true);
  };

  const onSelectOrganization = (organization: SignupOrganizationRow) => {
    setSelectedOrganization(organization);
    setOrganizationLookup(organization.slug);
    setOrganizationSearchResults([]);
  };

  const onLookupChange = (value: string) => {
    setOrganizationLookup(value);
    if (!selectedOrganization) return;
    const normalized = value.trim().toLowerCase();
    const selectedSlug = selectedOrganization.slug.toLowerCase();
    const selectedCode = selectedOrganization.org_code.toLowerCase();
    if (normalized !== selectedSlug && normalized !== selectedCode) {
      setSelectedOrganization(null);
    }
  };

  const renderOrganizationBody = () => {
    if (organizationSubmitted) {
      return (
        <div className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Organization created</h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Your account was created and a verification email has been sent. Verify your email, then sign in.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/auth/sign-in">Go to sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={onOrganizationSubmit} className="mt-6 space-y-4">
        <Input
          placeholder="Organization Name"
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
          required
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          placeholder={`Organization Code (suggested: ${suggestedCode})`}
          value={organizationCode}
          onChange={(event) => setOrganizationCode(event.target.value.toUpperCase())}
          maxLength={20}
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          placeholder="Owner Full Name"
          value={ownerFullName}
          onChange={(event) => setOwnerFullName(event.target.value)}
          required
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          type="email"
          placeholder="Owner Email"
          value={organizationEmail}
          onChange={(event) => setOrganizationEmail(event.target.value)}
          required
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          type="password"
          placeholder="Password"
          value={organizationPassword}
          onChange={(event) => setOrganizationPassword(event.target.value)}
          required
          minLength={12}
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={organizationConfirmPassword}
          onChange={(event) => setOrganizationConfirmPassword(event.target.value)}
          required
          minLength={12}
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />

        <Button
          className="h-11 w-full rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-700/25 transition hover:bg-violet-500 dark:bg-violet-400 dark:shadow-violet-500/35 dark:hover:bg-violet-300"
          type="submit"
          disabled={organizationSubmitting || loading}
        >
          {organizationSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Organization"
          )}
        </Button>
      </form>
    );
  };

  const renderClientBody = () => {
    if (clientSubmitted) {
      return (
        <div className="mt-6 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Registration submitted</h2>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Verify your email address and wait for organization approval before portal access.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/auth/sign-in">Go to sign in</Link>
            </Button>
          </div>
        </div>
      );
    }

    return (
      <form onSubmit={onClientSubmit} className="mt-6 space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            placeholder="Search organization name, slug, or code"
            value={organizationLookup}
            onChange={(event) => onLookupChange(event.target.value)}
            required
            className="h-11 rounded-xl border-slate-300/80 bg-white/70 pl-10 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
          />

          {organizationSearchLoading && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Searching organizations...</p>
          )}

          {!organizationSearchLoading && organizationSearchResults.length > 0 && (
            <div className="mt-2 max-h-52 overflow-auto rounded-xl border border-slate-300/80 bg-white/90 p-1 shadow-lg dark:border-slate-500/55 dark:bg-slate-900/95">
              {organizationSearchResults.map((organization) => (
                <button
                  key={organization.id}
                  type="button"
                  onClick={() => onSelectOrganization(organization)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-800 transition hover:bg-violet-100/70 dark:text-slate-100 dark:hover:bg-violet-500/20"
                >
                  <span>
                    <span className="font-medium">{organization.name}</span>
                    <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                      {organization.slug} / {organization.org_code}
                    </span>
                  </span>
                  <Check className="h-4 w-4 opacity-60" />
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedOrganization && (
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Selected organization: <span className="font-medium">{selectedOrganization.name}</span> (
            {selectedOrganization.slug})
          </p>
        )}

        <Input
          placeholder="Full Name"
          value={clientFullName}
          onChange={(event) => setClientFullName(event.target.value)}
          required
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          type="email"
          placeholder="Email"
          value={clientEmail}
          onChange={(event) => setClientEmail(event.target.value)}
          required
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          placeholder="Phone (optional)"
          value={clientPhone}
          onChange={(event) => setClientPhone(event.target.value)}
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          type="password"
          placeholder="Password"
          value={clientPassword}
          onChange={(event) => setClientPassword(event.target.value)}
          required
          minLength={12}
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />
        <Input
          type="password"
          placeholder="Confirm Password"
          value={clientConfirmPassword}
          onChange={(event) => setClientConfirmPassword(event.target.value)}
          required
          minLength={12}
          className="h-11 rounded-xl border-slate-300/80 bg-white/70 text-slate-900 placeholder:text-slate-500 focus-visible:ring-violet-400 focus-visible:ring-offset-0 dark:border-slate-500/55 dark:bg-slate-950/45 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus-visible:ring-violet-300"
        />

        <Button
          className="h-11 w-full rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-700/25 transition hover:bg-violet-500 dark:bg-violet-400 dark:shadow-violet-500/35 dark:hover:bg-violet-300"
          type="submit"
          disabled={clientSubmitting || loading}
        >
          {clientSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Client Account"
          )}
        </Button>
      </form>
    );
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
                    <p className="max-w-[230px] text-2xl font-semibold leading-tight text-white">
                      Create your workspace and onboard people the right way.
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
                    Account Creation
                  </p>
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Sign up</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {activeTab === "organization"
                      ? "Create your organization owner account."
                      : "Join an existing organization as a client."}
                  </p>
                </div>

                <Tabs value={activeTab} onValueChange={setTab} className="mt-6">
                  <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl bg-violet-50 p-1 dark:bg-slate-900/70">
                    <TabsTrigger
                      value="organization"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-400 dark:data-[state=active]:text-slate-950"
                    >
                      Organization
                    </TabsTrigger>
                    <TabsTrigger
                      value="client"
                      className="rounded-lg text-sm font-medium data-[state=active]:bg-violet-600 data-[state=active]:text-white dark:data-[state=active]:bg-violet-400 dark:data-[state=active]:text-slate-950"
                    >
                      Client
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {activeTab === "organization" ? renderOrganizationBody() : renderClientBody()}

                <div className="mt-6 border-t border-slate-200/80 pt-5 text-sm text-slate-600 dark:border-slate-500/35 dark:text-slate-300">
                  Already have an account?{" "}
                  <Link className="font-medium text-violet-700 hover:underline dark:text-violet-200 dark:hover:text-violet-100" to="/auth/sign-in">
                    Sign in
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
