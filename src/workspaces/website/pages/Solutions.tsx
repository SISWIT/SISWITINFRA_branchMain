import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  Factory,
  GraduationCap,
  Handshake,
  HeartPulse,
  Landmark,
  Plane,
  Rocket,
  Shield,
  ShoppingCart,
  Sparkles,
  Target,
  Tv,
  Users,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";
import { cn } from "@/core/utils/utils";
import { Button } from "@/ui/shadcn/button";
import { Footer } from "@/workspaces/website/components/layout/Footer";
import { Header } from "@/workspaces/website/components/layout/Header";

type SolutionId = "enterprise" | "midmarket" | "startups";

type SolutionFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type SolutionSegment = {
  id: SolutionId;
  name: string;
  label: string;
  summary: string;
  spotlight: string;
  icon: LucideIcon;
  metrics: { label: string; value: string }[];
  outcomes: string[];
  features: SolutionFeature[];
  workflow: string[];
};

type Palette = {
  tab: string;
  active: string;
  badge: string;
  iconShell: string;
  iconColor: string;
  cta: string;
  panel: string;
  step: string;
  feature: string;
  orbit: string;
};

type Industry = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const solutionSegments: SolutionSegment[] = [
  {
    id: "enterprise",
    name: "Enterprise",
    label: "1000+ employees",
    summary:
      "Purpose-built for complex organizations that need scale, security, and governance without slowing execution.",
    spotlight:
      "Deploy with enterprise controls, deep integrations, and global support while unifying every commercial workflow.",
    icon: Building2,
    metrics: [
      { label: "Global entities", value: "80+" },
      { label: "Uptime SLA", value: "99.95%" },
      { label: "Integrations", value: "120+" },
    ],
    outcomes: [
      "Roll out standardized workflows across multi-region teams.",
      "Protect data and approvals with strict access controls.",
      "Coordinate legal, sales, and operations in one platform.",
    ],
    features: [
      { icon: Shield, title: "Advanced Security", desc: "SSO, SCIM, audit logs, and policy controls." },
      { icon: Workflow, title: "Cross-Team Orchestration", desc: "Shared process from quote to renewal." },
      { icon: Handshake, title: "Dedicated Success", desc: "Strategic onboarding and lifecycle support." },
      { icon: Wrench, title: "Custom Integrations", desc: "Connect core enterprise systems quickly." },
    ],
    workflow: ["Align stakeholders", "Map governance", "Activate integrations", "Scale globally"],
  },
  {
    id: "midmarket",
    name: "Mid-Market",
    label: "100-999 employees",
    summary:
      "Flexible solution architecture for growing businesses that need strong control and fast time to value.",
    spotlight:
      "Balance speed and structure with guided rollout plans, role-based operations, and scalable automations.",
    icon: Users,
    metrics: [
      { label: "Go-live window", value: "6-10 wks" },
      { label: "Process speed", value: "2.7x" },
      { label: "Admin effort", value: "-43%" },
    ],
    outcomes: [
      "Launch quickly without a heavy implementation overhead.",
      "Improve handoffs between sales, finance, and legal.",
      "Scale usage confidently as teams and geographies expand.",
    ],
    features: [
      { icon: Target, title: "Role-Based Workspaces", desc: "Keep each team focused and accountable." },
      { icon: Zap, title: "Automation Packs", desc: "Prebuilt flows for common growth bottlenecks." },
      { icon: Sparkles, title: "Guided Onboarding", desc: "Step-by-step rollout with measurable milestones." },
      { icon: Workflow, title: "Approval Intelligence", desc: "Fast routing with policy-aware logic." },
    ],
    workflow: ["Define priorities", "Configure workspaces", "Automate approvals", "Optimize continuously"],
  },
  {
    id: "startups",
    name: "Startups",
    label: "Under 100 employees",
    summary:
      "Launch with essential capabilities fast, then expand module depth as your team and revenue grow.",
    spotlight:
      "Start lean with a unified stack for CPQ, CLM, CRM, ERP, and document automation in one place.",
    icon: Rocket,
    metrics: [
      { label: "Typical launch", value: "14 days" },
      { label: "User ramp", value: "50+" },
      { label: "Manual tasks", value: "-68%" },
    ],
    outcomes: [
      "Replace spreadsheets and disconnected apps early.",
      "Build repeatable processes before scaling pressure hits.",
      "Keep systems simple while remaining investor-ready.",
    ],
    features: [
      { icon: Rocket, title: "Fast Start Playbooks", desc: "Best-practice templates for immediate value." },
      { icon: Briefcase, title: "Unified Core Modules", desc: "CPQ, CLM, CRM, ERP, and document flows." },
      { icon: Users, title: "Self-Service Setup", desc: "Configure teams and permissions without friction." },
      { icon: Shield, title: "Built-In Guardrails", desc: "Core controls from day one as you scale." },
    ],
    workflow: ["Set goals", "Launch core modules", "Standardize execution", "Scale with confidence"],
  },
];

const palettes: Record<SolutionId, Palette> = {
  enterprise: {
    tab: "border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
    active: "border-primary/40 bg-primary/15 text-primary shadow-card",
    badge: "border-primary/35 bg-primary/10 text-primary",
    iconShell: "bg-primary/15",
    iconColor: "text-primary",
    cta: "bg-primary text-primary-foreground hover:bg-primary/90",
    panel: "border-primary/25 bg-primary/5",
    step: "bg-primary text-primary-foreground",
    feature: "border-primary/20 bg-background/85 hover:border-primary/40",
    orbit: "border-primary/40 bg-primary/10 text-primary shadow-card-hover",
  },
  midmarket: {
    tab: "border-border/70 text-muted-foreground hover:border-info/40 hover:bg-info/10 hover:text-info",
    active: "border-info/40 bg-info/15 text-info shadow-card",
    badge: "border-info/35 bg-info/10 text-info",
    iconShell: "bg-info/15",
    iconColor: "text-info",
    cta: "bg-info text-info-foreground hover:bg-info/90",
    panel: "border-info/25 bg-info/5",
    step: "bg-info text-info-foreground",
    feature: "border-info/20 bg-background/85 hover:border-info/40",
    orbit: "border-info/40 bg-info/10 text-info shadow-card-hover",
  },
  startups: {
    tab: "border-border/70 text-muted-foreground hover:border-success/40 hover:bg-success/10 hover:text-success",
    active: "border-success/40 bg-success/15 text-success shadow-card",
    badge: "border-success/35 bg-success/10 text-success",
    iconShell: "bg-success/15",
    iconColor: "text-success",
    cta: "bg-success text-success-foreground hover:bg-success/90",
    panel: "border-success/25 bg-success/5",
    step: "bg-success text-success-foreground",
    feature: "border-success/20 bg-background/85 hover:border-success/40",
    orbit: "border-success/40 bg-success/10 text-success shadow-card-hover",
  },
};

const orbitPositions = [
  "top-1 left-1/2 -translate-x-1/2 sm:top-3",
  "bottom-[16%] right-[4%] sm:right-[8%]",
  "bottom-[16%] left-[4%] sm:left-[8%]",
] as const;

const heroStats: Array<{ icon: LucideIcon; value: string; label: string }> = [
  { icon: Building2, value: "3", label: "size tracks" },
  { icon: Briefcase, value: "8", label: "industries" },
  { icon: Zap, value: "120+", label: "integrations" },
  { icon: Shield, value: "99.95%", label: "uptime" },
];

const industries: Industry[] = [
  { icon: Briefcase, title: "Professional Services", description: "Proposals, contracts, and client execution." },
  { icon: HeartPulse, title: "Healthcare", description: "HIPAA-ready workflows and partner controls." },
  { icon: Landmark, title: "Financial Services", description: "Secure approvals for regulated operations." },
  { icon: ShoppingCart, title: "Retail & E-commerce", description: "Pricing, supply, and vendor alignment." },
  { icon: Factory, title: "Manufacturing", description: "Complex configuration and channel execution." },
  { icon: Plane, title: "Travel & Hospitality", description: "Dynamic pricing and partner lifecycle flows." },
  { icon: GraduationCap, title: "Education", description: "Enrollment and vendor operations in one system." },
  { icon: Tv, title: "Media & Entertainment", description: "Rights and talent contract orchestration." },
];

const Solutions = () => {
  const [activeId, setActiveId] = useState<SolutionId>(solutionSegments[0].id);
  const [visible, setVisible] = useState<Set<string>>(() => new Set(["hero-copy", "hero-visual"]));

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal-id]");
    if (!targets.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((current) => {
          let changed = false;
          const next = new Set(current);

          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            if (!(entry.target instanceof HTMLElement)) continue;
            const key = entry.target.dataset.revealId;
            if (!key || next.has(key)) continue;
            next.add(key);
            changed = true;
          }

          return changed ? next : current;
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  const active = useMemo(
    () => solutionSegments.find((segment) => segment.id === activeId) ?? solutionSegments[0],
    [activeId],
  );
  const palette = palettes[active.id];

  const reveal = (id: string) => (visible.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Header />

      <main className="relative pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-36 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[30rem] right-[-8rem] h-72 w-72 rounded-full bg-info/15 blur-3xl" />
          <div className="absolute top-[64rem] left-[-8rem] h-72 w-72 rounded-full bg-success/10 blur-3xl" />
        </div>

        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div data-reveal-id="hero-copy" className={cn("space-y-7 transition-all duration-700", reveal("hero-copy"))}>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Solutions Framework
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                    The right SISWIT setup for every stage of growth.
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    From startups to enterprise teams, choose a solution path tailored to your scale,
                    compliance needs, and operating model.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/contact" className="w-full sm:w-auto">
                    <Button size="lg" variant="hero" className="w-full sm:w-auto">
                      Talk to an Expert
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/products" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Explore Products
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border/70 bg-card/80 px-3 py-3 shadow-card">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <stat.icon className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-lg font-semibold leading-none">{stat.value}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div data-reveal-id="hero-visual" className={cn("transition-all duration-700", reveal("hero-visual"))}>
                <div className="relative mx-auto aspect-square w-full max-w-[430px] sm:max-w-[470px]">
                  <div className="absolute inset-7 rounded-full border border-primary/20 animate-spin [animation-duration:24s] motion-reduce:animate-none" />
                  <div className="absolute inset-14 rounded-full border border-info/20 animate-spin [animation-direction:reverse] [animation-duration:18s] motion-reduce:animate-none" />

                  <div className="absolute inset-[25%] rounded-3xl border border-border/80 bg-card/90 p-4 shadow-card sm:p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Solution Hub</p>
                    <p className="mt-2 text-sm font-semibold">Business-Fit Architecture</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Size aligned</div>
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Industry ready</div>
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Secure rollout</div>
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Fast adoption</div>
                    </div>
                  </div>

                  {solutionSegments.map((segment, index) => {
                    const itemPalette = palettes[segment.id];
                    const isActive = segment.id === activeId;

                    return (
                      <button
                        key={segment.id}
                        type="button"
                        onClick={() => setActiveId(segment.id)}
                        className={cn(
                          "absolute w-[7.5rem] rounded-2xl border bg-card/90 px-3 py-2 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:w-36",
                          orbitPositions[index],
                          isActive ? itemPalette.orbit : "border-border/80 text-foreground",
                          "animate-float",
                        )}
                        style={{ animationDelay: `${index * 0.2}s` }}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn("mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg", itemPalette.iconShell)}>
                            <segment.icon className={cn("h-4 w-4", itemPalette.iconColor)} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{segment.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{segment.label}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-reveal-id="tabs" className="pb-3 sm:pb-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("rounded-2xl border border-border/70 bg-card/80 p-2 shadow-card transition-all duration-700", reveal("tabs"))}>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {solutionSegments.map((segment) => {
                  const itemPalette = palettes[segment.id];
                  const isActive = segment.id === activeId;

                  return (
                    <button
                      key={segment.id}
                      type="button"
                      onClick={() => setActiveId(segment.id)}
                      className={cn(
                        "group flex min-w-[190px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300",
                        isActive ? itemPalette.active : itemPalette.tab,
                      )}
                    >
                      <div className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", itemPalette.iconShell)}>
                        <segment.icon className={cn("h-4 w-4", itemPalette.iconColor)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-none">{segment.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{segment.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section data-reveal-id="details" className="py-8 sm:py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("rounded-3xl border border-border/75 bg-card/85 px-4 py-6 shadow-lg transition-all duration-700 sm:px-8 sm:py-10", reveal("details"))}>
              <div key={active.id} className="grid gap-8 lg:grid-cols-[1.02fr_0.98fr] animate-in fade-in-0 slide-in-from-bottom-6 duration-500">
                <div className="space-y-6">
                  <div className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", palette.badge)}>
                    <active.icon className="h-3.5 w-3.5" />
                    {active.label}
                  </div>

                  <p className="text-lg text-foreground sm:text-xl">{active.summary}</p>
                  <div className={cn("rounded-xl border px-4 py-3 text-sm", palette.panel)}>{active.spotlight}</div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {active.metrics.map((metric) => (
                      <div key={metric.label} className={cn("rounded-xl border px-4 py-3", palette.panel)}>
                        <p className="text-2xl font-semibold leading-none">{metric.value}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{metric.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {active.outcomes.map((outcome) => (
                      <div key={outcome} className="flex items-start gap-2.5">
                        <div className={cn("mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full", palette.iconShell)}>
                          <Check className={cn("h-3 w-3", palette.iconColor)} />
                        </div>
                        <p className="text-sm text-muted-foreground sm:text-base">{outcome}</p>
                      </div>
                    ))}
                  </div>

                  <Link to="/contact" className="inline-block w-full sm:w-auto">
                    <Button size="lg" className={cn("w-full sm:w-auto", palette.cta)}>
                      Design My {active.name} Plan
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className={cn("rounded-2xl border p-4 sm:p-5", palette.panel)}>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold">Rollout Flow</p>
                      <p className="text-xs text-muted-foreground">Guided implementation</p>
                    </div>
                    <div className="space-y-4">
                      {active.workflow.map((step, index) => (
                        <div key={step} className="relative grid min-h-10 grid-cols-[2.25rem_1fr] items-center gap-3">
                          {index < active.workflow.length - 1 && (
                            <div className="absolute left-[1.1rem] top-9 h-[calc(100%-0.15rem)] w-px bg-border/70" />
                          )}
                          <div className={cn("relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold", palette.step)}>
                            {index + 1}
                          </div>
                          <h3 className="text-sm font-semibold leading-tight">{step}</h3>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {active.features.map((feature) => (
                      <div key={feature.title} className={cn("rounded-xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card", palette.feature)}>
                        <div className={cn("mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg", palette.iconShell)}>
                          <feature.icon className={cn("h-5 w-5", palette.iconColor)} />
                        </div>
                        <h3 className="text-sm font-semibold">{feature.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-reveal-id="industries" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("rounded-3xl border border-border/70 bg-card/85 px-4 py-8 shadow-card transition-all duration-700 sm:px-8 sm:py-10", reveal("industries"))}>
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">Industry-ready solution blueprints</h2>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  Start with proven workflows tailored for your market, then customize as you scale.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {industries.map((industry, index) => (
                  <div
                    key={industry.title}
                    className={cn(
                      "rounded-xl border border-border/70 bg-background/80 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-card",
                      index % 3 === 0 && "animate-float",
                    )}
                    style={index % 3 === 0 ? { animationDelay: `${index * 0.12}s` } : undefined}
                  >
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <industry.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">{industry.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{industry.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section data-reveal-id="cta" className="pb-20 pt-6 sm:pb-24">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("relative overflow-hidden rounded-3xl border border-primary/25 gradient-primary px-6 py-12 text-primary-foreground shadow-xl transition-all duration-700 sm:px-10 sm:py-14", reveal("cta"))}>
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="relative mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold sm:text-5xl">Need help choosing the right solution track?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/85 sm:text-lg">
                  We will map your goals, team size, and systems to a rollout plan that fits.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/contact" className="w-full sm:w-auto">
                    <Button size="xl" className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto">
                      Talk to an Expert
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/pricing" className="w-full sm:w-auto">
                    <Button
                      size="xl"
                      variant="outline"
                      className="w-full border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                    >
                      Compare Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Solutions;
