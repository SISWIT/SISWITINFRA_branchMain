import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  Calculator,
  Check,
  Factory,
  FileStack,
  FileText,
  History,
  LineChart,
  Mail,
  PenTool,
  Puzzle,
  RefreshCw,
  Share2,
  Shield,
  Target,
  Truck,
  Users,
  Workflow,
  Zap,
} from "lucide-react";
import { cn } from "@/core/utils/utils";
import { Button } from "@/ui/shadcn/button";
import { Footer } from "@/workspaces/website/components/layout/Footer";
import { Header } from "@/workspaces/website/components/layout/Header";

type ModuleId = "cpq" | "clm" | "crm" | "erp" | "document-automation";

type ModuleFeature = {
  icon: LucideIcon;
  title: string;
  desc: string;
};

type ProductModule = {
  id: ModuleId;
  name: string;
  label: string;
  summary: string;
  spotlight: string;
  icon: LucideIcon;
  metrics: { label: string; value: string }[];
  outcomes: string[];
  features: ModuleFeature[];
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

const modules: ProductModule[] = [
  {
    id: "cpq",
    name: "CPQ",
    label: "Configure, Price, Quote",
    summary: "Create accurate quotes fast with guided configuration and dynamic pricing.",
    spotlight: "From complex product logic to customer-ready proposal in one smooth flow.",
    icon: Calculator,
    metrics: [
      { label: "Quote velocity", value: "3.2x" },
      { label: "Pricing errors", value: "-92%" },
      { label: "Deal size", value: "+28%" },
    ],
    outcomes: [
      "No spreadsheet-based pricing checks.",
      "Approval rules enforce margin protection.",
      "Quotes stay audit-ready automatically.",
    ],
    features: [
      { icon: Workflow, title: "Guided Configurator", desc: "Visual flows for product-fit selling." },
      { icon: Calculator, title: "Dynamic Pricing", desc: "Region and segment aware rules." },
      { icon: FileText, title: "Instant Quotes", desc: "Generate branded proposals quickly." },
      { icon: Check, title: "Approvals", desc: "Route exceptions to the right owner." },
    ],
    workflow: ["Capture needs", "Apply pricing logic", "Run approvals", "Publish quote"],
  },
  {
    id: "clm",
    name: "CLM",
    label: "Contract Lifecycle",
    summary: "Speed up legal cycles with structured templates, negotiation controls, and renewals.",
    spotlight: "Legal and revenue teams collaborate in one contract timeline.",
    icon: FileText,
    metrics: [
      { label: "Cycle reduction", value: "65%" },
      { label: "Audit coverage", value: "100%" },
      { label: "Renewal lift", value: "+19%" },
    ],
    outcomes: [
      "Reuse approved clause sets safely.",
      "Track edits, signatures, and approvals together.",
      "Start renewal motion before leakage begins.",
    ],
    features: [
      { icon: PenTool, title: "Smart Templates", desc: "Policy-safe contract blueprints." },
      { icon: Users, title: "Redlining", desc: "Collaborative negotiation workspace." },
      { icon: Shield, title: "Compliance", desc: "Risk language checks before sign." },
      { icon: RefreshCw, title: "Renewals", desc: "Proactive reminder and action loops." },
    ],
    workflow: ["Open request", "Assemble clauses", "Negotiate and sign", "Renew proactively"],
  },
  {
    id: "crm",
    name: "CRM",
    label: "Customer Management",
    summary: "Unify leads, pipeline, communication, and forecasting in one command center.",
    spotlight: "Give sales and success teams the same live account context.",
    icon: Users,
    metrics: [
      { label: "Conversion", value: "+45%" },
      { label: "Forecast", value: "+31%" },
      { label: "Account view", value: "360" },
    ],
    outcomes: [
      "Prioritize high-intent opportunities faster.",
      "Automate follow-ups with less manual effort.",
      "Forecast pipeline confidence in real time.",
    ],
    features: [
      { icon: Target, title: "Lead Intelligence", desc: "Scoring and routing by behavior." },
      { icon: LineChart, title: "Pipeline View", desc: "Stage movement in live boards." },
      { icon: Mail, title: "Conversation Sync", desc: "Email and activity in one feed." },
      { icon: BarChart3, title: "Analytics", desc: "Predictive risk and expansion views." },
    ],
    workflow: ["Capture demand", "Prioritize leads", "Activate pipeline", "Forecast outcomes"],
  },
  {
    id: "erp",
    name: "ERP",
    label: "Resource Planning",
    summary: "Coordinate operations, inventory, production, and finance from one source of truth.",
    spotlight: "Replace disconnected planning with synchronized execution.",
    icon: Boxes,
    metrics: [
      { label: "Inventory", value: "+41%" },
      { label: "Ops lag", value: "-38%" },
      { label: "Close speed", value: "2.4x" },
    ],
    outcomes: [
      "Reduce stockouts through live visibility.",
      "Align procurement with real demand signals.",
      "Automate finance-ready transaction trails.",
    ],
    features: [
      { icon: Boxes, title: "Inventory", desc: "Threshold-based replenishment alerts." },
      { icon: FileText, title: "Finance", desc: "Automated journals and reporting." },
      { icon: Factory, title: "Operations", desc: "Work order and throughput tracking." },
      { icon: Truck, title: "Supply Chain", desc: "Vendor to delivery coordination." },
    ],
    workflow: ["Plan demand", "Allocate supply", "Execute operations", "Settle finance"],
  },
  {
    id: "document-automation",
    name: "Doc Gen",
    label: "Document Automation",
    summary: "Generate compliant documents from live data, then share and track instantly.",
    spotlight: "Turn repetitive document work into one-click automation.",
    icon: FileStack,
    metrics: [
      { label: "Time saved", value: "80%" },
      { label: "Template drift", value: "0%" },
      { label: "Delivery", value: "5x" },
    ],
    outcomes: [
      "Create polished docs in seconds.",
      "Track every version and approval event.",
      "Share securely without tool switching.",
    ],
    features: [
      { icon: Zap, title: "Dynamic Assembly", desc: "Inject data into PDF and DOCX." },
      { icon: Workflow, title: "Conditional Logic", desc: "Render blocks by business rules." },
      { icon: History, title: "Version Timeline", desc: "Full edit and publish history." },
      { icon: Share2, title: "Secure Sharing", desc: "Role-aware external distribution." },
    ],
    workflow: ["Choose template", "Merge live data", "Review and approve", "Send and track"],
  },
];

const palettes: Record<ModuleId, Palette> = {
  cpq: {
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
  clm: {
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
  crm: {
    tab: "border-border/70 text-muted-foreground hover:border-chart-3/40 hover:bg-chart-3/10 hover:text-chart-3",
    active: "border-chart-3/40 bg-chart-3/15 text-chart-3 shadow-card",
    badge: "border-chart-3/35 bg-chart-3/10 text-chart-3",
    iconShell: "bg-chart-3/15",
    iconColor: "text-chart-3",
    cta: "bg-chart-3 text-white hover:bg-chart-3/90",
    panel: "border-chart-3/25 bg-chart-3/5",
    step: "bg-chart-3 text-white",
    feature: "border-chart-3/20 bg-background/85 hover:border-chart-3/40",
    orbit: "border-chart-3/40 bg-chart-3/10 text-chart-3 shadow-card-hover",
  },
  erp: {
    tab: "border-border/70 text-muted-foreground hover:border-warning/40 hover:bg-warning/10 hover:text-warning",
    active: "border-warning/40 bg-warning/15 text-warning shadow-card",
    badge: "border-warning/35 bg-warning/10 text-warning",
    iconShell: "bg-warning/15",
    iconColor: "text-warning",
    cta: "bg-warning text-warning-foreground hover:bg-warning/90",
    panel: "border-warning/25 bg-warning/5",
    step: "bg-warning text-warning-foreground",
    feature: "border-warning/20 bg-background/85 hover:border-warning/40",
    orbit: "border-warning/40 bg-warning/10 text-warning shadow-card-hover",
  },
  "document-automation": {
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
  "top-[18%] right-[-2%] sm:right-0",
  "bottom-[17%] right-[4%] sm:right-[8%]",
  "bottom-[17%] left-[4%] sm:left-[8%]",
  "top-[18%] left-[-2%] sm:left-0",
] as const;

const heroStats: Array<{ icon: LucideIcon; value: string; label: string }> = [
  { icon: Puzzle, value: "5", label: "modules" },
  { icon: Share2, value: "120+", label: "integrations" },
  { icon: Shield, value: "99.95%", label: "uptime" },
  { icon: Zap, value: "AI", label: "assist" },
];

const integrations = [
  "Salesforce",
  "HubSpot",
  "SAP",
  "Oracle",
  "Microsoft 365",
  "Slack",
  "DocuSign",
  "Stripe",
  "QuickBooks",
  "Zendesk",
  "NetSuite",
  "Power BI",
];

const Products = () => {
  const [activeId, setActiveId] = useState<ModuleId>(modules[0].id);
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

  const active = useMemo(() => modules.find((module) => module.id === activeId) ?? modules[0], [activeId]);
  const palette = palettes[active.id];

  const reveal = (id: string) => (visible.has(id) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6");

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      <Header />

      <main className="relative pt-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-36 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-[28rem] right-[-8rem] h-72 w-72 rounded-full bg-info/15 blur-3xl" />
          <div className="absolute top-[64rem] left-[-8rem] h-72 w-72 rounded-full bg-success/10 blur-3xl" />
        </div>

        <section className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div data-reveal-id="hero-copy" className={cn("space-y-7 transition-all duration-700", reveal("hero-copy"))}>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                  Product Suite
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                    One platform. Five powerful modules. Zero workflow friction.
                  </h1>
                  <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
                    SISWIT unifies CPQ, CLM, CRM, ERP, and Document Automation so your team can
                    move from quote to delivery in one connected workflow.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link to="/contact" className="w-full sm:w-auto">
                    <Button size="lg" variant="hero" className="w-full sm:w-auto">
                      Request Demo
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/pricing" className="w-full sm:w-auto">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      View Pricing
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
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">SISWIT Core</p>
                    <p className="mt-2 text-sm font-semibold">Unified Workflow Fabric</p>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Shared data</div>
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Live approvals</div>
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">Secure by default</div>
                      <div className="rounded-lg border border-border/70 bg-background/80 px-2 py-1.5">AI assist</div>
                    </div>
                  </div>

                  {modules.map((module, index) => {
                    const itemPalette = palettes[module.id];
                    const isActive = module.id === activeId;

                    return (
                      <button
                        key={module.id}
                        type="button"
                        onClick={() => setActiveId(module.id)}
                        className={cn(
                          "absolute w-[7.5rem] rounded-2xl border bg-card/90 px-3 py-2 text-left shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover sm:w-36",
                          orbitPositions[index],
                          isActive ? itemPalette.orbit : "border-border/80 text-foreground",
                          index % 2 === 0 && "animate-float",
                        )}
                        style={index % 2 === 0 ? { animationDelay: `${index * 0.25}s` } : undefined}
                      >
                        <div className="flex items-start gap-2">
                          <div className={cn("mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg", itemPalette.iconShell)}>
                            <module.icon className={cn("h-4 w-4", itemPalette.iconColor)} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold">{module.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{module.label}</p>
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
                {modules.map((module) => {
                  const itemPalette = palettes[module.id];
                  const isActive = module.id === activeId;

                  return (
                    <button
                      key={module.id}
                      type="button"
                      onClick={() => setActiveId(module.id)}
                      className={cn("group flex min-w-[170px] flex-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-300", isActive ? itemPalette.active : itemPalette.tab)}
                    >
                      <div className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", itemPalette.iconShell)}>
                        <module.icon className={cn("h-4 w-4", itemPalette.iconColor)} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-none">{module.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{module.label}</p>
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
                      Explore {active.name}
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-4">
                  <div className={cn("rounded-2xl border p-4 sm:p-5", palette.panel)}>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold">Execution Flow</p>
                      <p className="text-xs text-muted-foreground">Live orchestration</p>
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

        <section data-reveal-id="integrations" className="py-12 sm:py-16 lg:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("rounded-3xl border border-border/70 bg-card/85 px-4 py-8 shadow-card transition-all duration-700 sm:px-8 sm:py-10", reveal("integrations"))}>
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Puzzle className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-3xl font-bold sm:text-4xl">Connect your existing stack</h2>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">
                  Plug SISWIT into your current tools with no heavy rip-and-replace project.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {integrations.map((integration, index) => (
                  <div
                    key={integration}
                    className={cn(
                      "rounded-xl border border-border/70 bg-background/80 px-3 py-3 text-center text-sm font-medium transition-all duration-300 hover:-translate-y-1 hover:shadow-card",
                      index % 4 === 0 && "animate-float",
                    )}
                    style={index % 4 === 0 ? { animationDelay: `${index * 0.12}s` } : undefined}
                  >
                    {integration}
                  </div>
                ))}
                <div className="col-span-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-3 text-center text-sm font-semibold text-primary sm:col-span-1">
                  + 90 more connectors
                </div>
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
                <h2 className="text-3xl font-bold sm:text-5xl">Ready to modernize your product workflow?</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/85 sm:text-lg">
                  Get a tailored walkthrough and launch plan designed for your team.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link to="/contact" className="w-full sm:w-auto">
                    <Button size="xl" className="w-full bg-white text-primary hover:bg-white/90 sm:w-auto">
                      Request Demo
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/solutions" className="w-full sm:w-auto">
                    <Button
                      size="xl"
                      variant="outline"
                      className="w-full border-white/70 bg-transparent text-white hover:bg-white/10 hover:text-white sm:w-auto"
                    >
                      Explore Solutions
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

export default Products;
