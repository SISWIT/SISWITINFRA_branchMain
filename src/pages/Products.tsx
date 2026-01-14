import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Calculator, FileText, Users, ArrowRight, Check, 
  Workflow, PenTool, Shield, BarChart3, Puzzle, 
  Clock, FileCheck, AlertTriangle, RefreshCw,
  Target, LineChart, Layers, Mail, FileStack,
  Zap, History, Lock, Share2
} from "lucide-react";

// Import branded capability images
import cpqCapabilityMap from "@/assets/cpq-capability-map.jpg";
import clmLifecycle from "@/assets/clm-lifecycle.jpg";
import crmDiagram from "@/assets/crm-diagram.jpg";
import automationVisual from "@/assets/automation-visual.jpg";

const modules = [
  {
    id: "cpq",
    icon: Calculator,
    name: "CPQ",
    title: "Configure, Price, Quote",
    description: "Accelerate your sales cycle with intelligent product configuration, dynamic pricing engines, and automated quote generation that closes deals faster.",
    image: cpqCapabilityMap,
    imageAlt: "CPQ Capability Map showing guided selling, product configuration, price adjustment, workflows, quote generation and asset ordering",
    features: [
      { icon: Workflow, title: "Product Configuration", desc: "Visual product configurator with guided selling" },
      { icon: Calculator, title: "Dynamic Pricing", desc: "Rule-based pricing with discount management" },
      { icon: FileText, title: "Quote Automation", desc: "Generate professional quotes in seconds" },
      { icon: Check, title: "Approval Workflows", desc: "Multi-level approval with notifications" },
    ],
    benefits: ["50% faster quote generation", "30% increase in deal size", "90% reduction in pricing errors"],
  },
  {
    id: "clm",
    icon: FileText,
    name: "CLM",
    title: "Contract Lifecycle Management",
    description: "Manage your entire contract lifecycle from creation to renewal with AI-powered templates, e-signatures, compliance tracking, and comprehensive audit trails.",
    image: clmLifecycle,
    imageAlt: "Contract Lifecycle Management diagram showing contract request, reviewing, approval, execution, storage, records management, search, audit, and renewal stages",
    features: [
      { icon: PenTool, title: "Contract Creation", desc: "Smart templates with clause library" },
      { icon: FileCheck, title: "E-Signatures", desc: "Legally binding electronic signatures" },
      { icon: Shield, title: "Compliance Tracking", desc: "Automated compliance monitoring" },
      { icon: RefreshCw, title: "Renewal Management", desc: "Proactive renewal alerts and automation" },
    ],
    benefits: ["65% faster contract turnaround", "40% reduction in legal review time", "100% audit trail visibility"],
  },
  {
    id: "crm",
    icon: Users,
    name: "CRM",
    title: "Customer Relationship Management",
    description: "Build deeper customer relationships with a 360° view, intelligent pipeline management, predictive analytics, and seamless communication tools.",
    image: crmDiagram,
    imageAlt: "CRM diagram showing invoice, campaign, lead, opportunity, quote, purchase order, sale order, and delivery modules",
    features: [
      { icon: Target, title: "Lead Management", desc: "Capture, score, and nurture leads" },
      { icon: LineChart, title: "Pipeline Tracking", desc: "Visual pipeline with forecasting" },
      { icon: BarChart3, title: "Customer Analytics", desc: "Deep insights and reporting" },
      { icon: Mail, title: "Communication Hub", desc: "Unified email and messaging" },
    ],
    benefits: ["45% improvement in lead conversion", "25% increase in customer retention", "360° customer visibility"],
  },
  {
    id: "document-automation",
    icon: FileStack,
    name: "Document Automation",
    title: "Intelligent Document Generation",
    description: "Create, manage, and deliver documents at scale with zero manual effort. Automate document workflows from generation to e-signature with enterprise-grade security.",
    image: automationVisual,
    imageAlt: "Document automation visual showing connected workflow icons for automated document generation and processing",
    features: [
      { icon: Zap, title: "Dynamic Generation", desc: "Generate PDF & DOCX with smart templates" },
      { icon: Workflow, title: "Conditional Logic", desc: "Variables & rules for personalized content" },
      { icon: History, title: "Version Control", desc: "Complete audit trail & version history" },
      { icon: Share2, title: "Secure Sharing", desc: "Encrypted storage & controlled access" },
    ],
    benefits: ["80% reduction in document creation time", "Zero manual data entry errors", "Complete compliance visibility"],
  },
];

const integrations = [
  "Salesforce", "HubSpot", "SAP", "Oracle", "Microsoft 365",
  "Slack", "DocuSign", "Stripe", "QuickBooks", "Zendesk"
];

const Products = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero */}
        <section className="py-20 gradient-hero relative overflow-hidden">
          <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Products
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-6">
                One Platform,{" "}
                <span className="text-gradient">Infinite Possibilities</span>
              </h1>
            <p className="text-lg text-muted-foreground">
              Siriusinfra brings together CPQ, CLM, CRM, and Document Automation into a unified platform 
              that transforms how you sell, contract, and manage customers.
            </p>
            </div>
          </div>
        </section>

        {/* Modules */}
        {modules.map((module, index) => (
          <section
            key={module.id}
            id={module.id}
            className={`py-24 ${index % 2 === 1 ? "bg-secondary/30" : ""}`}
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                      <module.icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">{module.title}</span>
                      <h2 className="text-3xl font-bold text-foreground">{module.name}</h2>
                    </div>
                  </div>
                  <p className="text-lg text-muted-foreground mb-8">
                    {module.description}
                  </p>

                  {/* Benefits */}
                  <div className="space-y-3 mb-8">
                    {module.benefits.map((benefit) => (
                      <div key={benefit} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                        <span className="text-foreground font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  <Link to="/contact">
                    <Button variant="hero" className="group">
                      Get Started with {module.name}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>

                {/* Module Image */}
                <div className={`${index % 2 === 1 ? "lg:order-1" : ""}`}>
                  <div className="relative rounded-2xl overflow-hidden shadow-xl border border-border/50 group">
                    <img
                      src={module.image}
                      alt={module.imageAlt}
                      className="w-full h-auto transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent" />
                  </div>
                  {/* Features Grid below image */}
                  <div className="grid sm:grid-cols-2 gap-4 mt-8">
                    {module.features.map((feature) => (
                      <div
                        key={feature.title}
                        className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300"
                      >
                        <feature.icon className="w-6 h-6 text-primary mb-2" />
                        <h3 className="font-semibold text-foreground text-sm mb-1">{feature.title}</h3>
                        <p className="text-xs text-muted-foreground">{feature.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        {/* Integrations */}
        <section id="integrations" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <Puzzle className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                Seamless Integrations
              </h2>
              <p className="text-lg text-muted-foreground">
                Connect Siriusinfra with your existing tools and workflows. 
                We integrate with 100+ business applications.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration}
                  className="px-6 py-3 rounded-lg bg-card border border-border text-foreground font-medium hover:border-primary/50 hover:shadow-card transition-all"
                >
                  {integration}
                </div>
              ))}
              <div className="px-6 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium">
                + 90 more
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 gradient-hero">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Ready to see Siriusinfra in action?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get a personalized demo and see how our platform can transform your business.
            </p>
            <Link to="/contact">
              <Button variant="hero" size="xl" className="group">
                Request Demo
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Products;
