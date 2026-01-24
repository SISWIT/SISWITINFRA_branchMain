import { Calculator, FileText, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    icon: Calculator,
    title: "CPQ",
    subtitle: "Configure, Price, Quote",
    description: "Streamline your sales process with intelligent product configuration, dynamic pricing rules, and automated quote generation.",
    highlights: ["Product Configuration", "Dynamic Pricing", "Quote Automation", "Approval Workflows"],
    color: "from-primary to-primary/60",
  },
  {
    icon: FileText,
    title: "CLM",
    subtitle: "Contract Lifecycle Management",
    description: "Manage your entire contract lifecycle from creation to renewal with smart templates, compliance tracking, and audit trails.",
    highlights: ["Contract Creation", "E-Signatures", "Compliance Tracking", "Renewal Alerts"],
    color: "from-accent to-accent/60",
  },
  {
    icon: Users,
    title: "CRM",
    subtitle: "Customer Relationship Management",
    description: "Build stronger customer relationships with unified customer data, pipeline management, and actionable analytics.",
    highlights: ["Lead Management", "Pipeline Tracking", "Customer Analytics", "360° View"],
    color: "from-chart-3 to-chart-3/60",
  },
];

export function FeaturesSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [cardsVisible, setCardsVisible] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const headerObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    const cardsObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setCardsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (headerRef.current) {
      headerObserver.observe(headerRef.current);
    }
    if (cardsRef.current) {
      cardsObserver.observe(cardsRef.current);
    }

    return () => {
      headerObserver.disconnect();
      cardsObserver.disconnect();
    };
  }, []);

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with fade-in animation */}
        <div 
          ref={headerRef}
          className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <span className={`text-primary font-semibold text-sm uppercase tracking-wider inline-block transition-all duration-500 ${
            isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`} style={{ transitionDelay: '100ms' }}>
            All-in-One Platform
          </span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mt-4 mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '200ms' }}>
            Three Powerful Modules,{" "}
            <span className="text-gradient">One Platform</span>
          </h2>
          <p className={`text-lg text-muted-foreground transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`} style={{ transitionDelay: '300ms' }}>
            SISWIT brings together CPQ, CLM, and CRM into a unified platform, 
            eliminating data silos and creating seamless workflows across your entire organization.
          </p>
        </div>

        {/* Features Grid with staggered card animations */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative bg-card rounded-2xl p-8 border border-border shadow-card 
                transition-all duration-500 hover:shadow-card-hover hover:-translate-y-3 hover:scale-[1.02]
                ${cardsVisible ? 'opacity-100 translate-y-0 rotate-0' : 'opacity-0 translate-y-16 rotate-1'}`}
              style={{ 
                transitionDelay: cardsVisible ? `${index * 150}ms` : '0ms',
              }}
            >
              {/* Animated Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 
                group-hover:scale-110 group-hover:rotate-6 group-hover:shadow-lg transition-all duration-300`}>
                <feature.icon className="w-7 h-7 text-primary-foreground group-hover:scale-110 transition-transform" />
              </div>

              {/* Content with subtle animations */}
              <span className="text-sm text-muted-foreground font-medium block group-hover:text-primary/70 transition-colors">
                {feature.subtitle}
              </span>
              <h3 className="text-2xl font-bold text-foreground mt-1 mb-4 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-muted-foreground mb-6">
                {feature.description}
              </p>

              {/* Highlights with staggered animation on hover */}
              <ul className="space-y-2 mb-6">
                {feature.highlights.map((highlight, hIndex) => (
                  <li 
                    key={highlight} 
                    className="flex items-center gap-2 text-sm text-foreground group-hover:translate-x-1 transition-transform duration-300"
                    style={{ transitionDelay: `${hIndex * 50}ms` }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary group-hover:scale-150 group-hover:bg-accent transition-all duration-300" />
                    {highlight}
                  </li>
                ))}
              </ul>

              {/* Animated Link */}
              <Link 
                to="/products" 
                className="inline-flex items-center gap-2 text-primary font-semibold text-sm group-hover:gap-3 transition-all"
              >
                Learn more 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 group-hover:scale-110 transition-all" />
              </Link>

              {/* Hover gradient overlay */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 
                opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              {/* Animated border glow */}
              <div className="absolute inset-0 rounded-2xl border-2 border-primary/0 group-hover:border-primary/20 
                transition-all duration-500 pointer-events-none" />
            </div>
          ))}
        </div>

        {/* CTA with animation */}
        <div className={`text-center mt-16 transition-all duration-700 ${
          cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`} style={{ transitionDelay: '600ms' }}>
          <Link to="/products">
            <Button variant="hero" size="lg" className="group hover:scale-105 transition-transform duration-300">
              Explore All Features
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}