import { Header } from "@/workspaces/website/components/layout/Header";
import { Footer } from "@/workspaces/website/components/layout/Footer";
import { Button } from "@/ui/shadcn/button";
import { Link } from "react-router-dom";
import { Check, X, ArrowRight, HelpCircle } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Foundation",
    description: "Perfect for small teams getting started with CRM, CPQ, CLM, Documents, and ERP.",
    price: { monthly: 799, annually: 799 },
    popular: false,
    features: [
      { name: "Up to 5 users", included: true },
      { name: "CRM (Contacts, Accounts, Leads, Opportunities)", included: true },
      { name: "CPQ (Products, Quotes)", included: true },
      { name: "CLM (Contracts, Templates, E-signatures)", included: true },
      { name: "Documents (Auto Documents, Templates)", included: true },
      { name: "ERP (Suppliers, Purchase Orders)", included: true },
      { name: "500 contacts", included: true },
      { name: "100 accounts", included: true },
      { name: "200 leads", included: true },
      { name: "100 opportunities", included: true },
      { name: "50 products", included: true },
      { name: "50 quotes/month", included: true },
      { name: "100 documents", included: true },
      { name: "10 document templates", included: true },
      { name: "10 e-signatures/month", included: true },
      { name: "1GB storage", included: true },
      { name: "1,000 API calls/day", included: true },
      { name: "Email support", included: true },
      { name: "Basic integrations", included: true },
      { name: "Standard reports", included: true },
      { name: "Custom workflows", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Dedicated support", included: false },
    ],
  },
  {
    name: "Growth",
    description: "For growing teams that need advanced features and higher limits.",
    price: { monthly: 1399, annually: 1399 },
    popular: true,
    features: [
      { name: "Up to 25 users", included: true },
      { name: "CRM (Contacts, Accounts, Leads, Opportunities)", included: true },
      { name: "CPQ (Products, Quotes)", included: true },
      { name: "CLM (Contracts, Templates, E-signatures)", included: true },
      { name: "Documents (Auto Documents, Templates)", included: true },
      { name: "ERP (Suppliers, Purchase Orders)", included: true },
      { name: "5,000 contacts", included: true },
      { name: "1,000 accounts", included: true },
      { name: "2,000 leads", included: true },
      { name: "1,000 opportunities", included: true },
      { name: "500 products", included: true },
      { name: "500 quotes/month", included: true },
      { name: "1,000 documents", included: true },
      { name: "100 document templates", included: true },
      { name: "100 e-signatures/month", included: true },
      { name: "10GB storage", included: true },
      { name: "10,000 API calls/day", included: true },
      { name: "Priority support", included: true },
      { name: "All integrations", included: true },
      { name: "Advanced reports", included: true },
      { name: "Custom workflows", included: true },
      { name: "Advanced analytics", included: false },
      { name: "Dedicated support", included: false },
    ],
  },
  {
    name: "Commercial",
    description: "For established businesses needing comprehensive features and higher capacity.",
    price: { monthly: 2299, annually: 2299 },
    popular: false,
    features: [
      { name: "Up to 100 users", included: true },
      { name: "CRM (Contacts, Accounts, Leads, Opportunities)", included: true },
      { name: "CPQ (Products, Quotes)", included: true },
      { name: "CLM (Contracts, Templates, E-signatures)", included: true },
      { name: "Documents (Auto Documents, Templates)", included: true },
      { name: "ERP (Suppliers, Purchase Orders)", included: true },
      { name: "50,000 contacts", included: true },
      { name: "10,000 accounts", included: true },
      { name: "20,000 leads", included: true },
      { name: "10,000 opportunities", included: true },
      { name: "5,000 products", included: true },
      { name: "5,000 quotes/month", included: true },
      { name: "10,000 documents", included: true },
      { name: "1,000 document templates", included: true },
      { name: "1,000 e-signatures/month", included: true },
      { name: "100GB storage", included: true },
      { name: "100,000 API calls/day", included: true },
      { name: "24/7 support", included: true },
      { name: "Custom integrations", included: true },
      { name: "Custom reports", included: true },
      { name: "Full API access", included: true },
      { name: "Custom workflows", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Dedicated support", included: false },
    ],
  },
  {
    name: "Enterprise",
    description: "For large organizations with unlimited needs and premium support.",
    price: { monthly: 3799, annually: 3799 },
    popular: false,
    features: [
      { name: "Unlimited users", included: true },
      { name: "CRM (Contacts, Accounts, Leads, Opportunities)", included: true },
      { name: "CPQ (Products, Quotes)", included: true },
      { name: "CLM (Contracts, Templates, E-signatures)", included: true },
      { name: "Documents (Auto Documents, Templates)", included: true },
      { name: "ERP (Suppliers, Purchase Orders)", included: true },
      { name: "Unlimited contacts", included: true },
      { name: "Unlimited accounts", included: true },
      { name: "Unlimited leads", included: true },
      { name: "Unlimited opportunities", included: true },
      { name: "Unlimited products", included: true },
      { name: "Unlimited quotes/month", included: true },
      { name: "Unlimited documents", included: true },
      { name: "Unlimited document templates", included: true },
      { name: "Unlimited e-signatures/month", included: true },
      { name: "500GB storage", included: true },
      { name: "Unlimited API calls/day", included: true },
      { name: "24/7 Priority support", included: true },
      { name: "Custom integrations", included: true },
      { name: "Custom reports", included: true },
      { name: "Full API access", included: true },
      { name: "Custom workflows", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Dedicated support", included: true },
    ],
  },
];

const faqs = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "Yes! We offer a 14-day free trial on all plans with full feature access. No credit card required.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards, ACH transfers, and wire transfers for enterprise accounts.",
  },
  {
    question: "Do you offer discounts for nonprofits?",
    answer:
      "Yes, we offer special pricing for nonprofits and educational institutions. Contact us for details.",
  },
];

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    // Reverted to min-h-screen and removed snap/overflow classes so the Header stickiness/blur works correctly with window scroll
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        {/* Kept min-h-screen to maintain the section-wise feel but allowed natural scrolling */}
        <section className="min-h-screen flex flex-col justify-center pt-28 pb-10 gradient-hero relative overflow-hidden">
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">
                Pricing
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mt-4 mb-6">
                Simple, Transparent{" "}
                <span className="text-gradient">Pricing</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                {/* Updated text to include ERP */}
                Choose the plan that fits your business. All plans include our core CPQ, CLM, CRM, and ERP features.
              </p>

              {/* Toggle */}
              <div className="inline-flex items-center gap-4 p-1 rounded-xl bg-secondary/0 border border-border">
                <button
                  onClick={() => setIsAnnual(false)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${
                    !isAnnual
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setIsAnnual(true)}
                  className={`px-6 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    isAnnual
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Annual
                  <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                    Save 20%
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        {/* Kept large padding and flex center to maintain focus on cards */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative bg-card rounded-2xl p-6 border flex flex-col ${
                    plan.popular
                      ? "border-primary shadow-glow scale-[1.02] z-10"
                      : "border-border shadow-card"
                  } hover:shadow-card-hover transition-all duration-300`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-primary-foreground text-sm font-medium">
                      Most Popular
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {plan.description}
                  </p>

                  <div className="mb-6 flex flex-col justify-end">
                    {plan.price.monthly ? (
                      <>
                        <div>
                          <span className="text-4xl font-bold text-foreground">
                            ₹{plan.price.monthly}
                          </span>
                          <span className="text-muted-foreground ml-1">
                            /month
                          </span>
                        </div>
                        <p className="text-sm text-primary mt-1">
                          Billed annually
                        </p>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-foreground pb-2">
                        Custom Pricing
                      </span>
                    )}
                  </div>

                  <Link to="/contact">
                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      className="w-full mb-6"
                    >
                      {plan.price.monthly
                        ? "Start Free Trial"
                        : "Contact Sales"}
                    </Button>
                  </Link>

                  <ul className="space-y-3 flex-grow">
                    {plan.features.map((feature) => (
                      <li
                        key={feature.name}
                        className="flex items-center gap-3"
                      >
                        {feature.included ? (
                          <Check className="w-5 h-5 text-primary flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground/40 flex-shrink-0" />
                        )}
                        <span
                          className={
                            feature.included
                              ? "text-foreground"
                              : "text-muted-foreground/60"
                          }
                        >
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="min-h-[80vh] flex flex-col justify-center py-20 bg-secondary/0">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <HelpCircle className="w-12 h-12 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Frequently Asked Questions
                </h2>
              </div>

              <div className="space-y-6">
                {faqs.map((faq) => (
                  <div
                    key={faq.question}
                    className="p-6 rounded-xl bg-card border border-border"
                  >
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 gradient-hero">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Link to="/contact">
                <Button variant="hero" size="xl" className="group">
                  Start Free Trial
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

export default Pricing;