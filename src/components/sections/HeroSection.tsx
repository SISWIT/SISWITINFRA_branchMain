import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Cloud, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import heroBg from "@/assets/hero-bg.jpg";
import dashboardMockup from "@/assets/hero-dashboard-mockup.png";
import cpqImage from "@/assets/cpq-capability-map.jpg";
import clmImage from "@/assets/clm-lifecycle.jpg";
import crmImage from "@/assets/crm-diagram.jpg";
import automationImage from "@/assets/automation-visual.jpg";
import esignatureImage from "@/assets/esignature-workflow.png";

const serviceImages = [
  { src: dashboardMockup, alt: "Unified dashboard showing CPQ, CLM, and CRM modules", label: "Unified Platform" },
  { src: cpqImage, alt: "CPQ capability map showing quote configuration", label: "CPQ" },
  { src: clmImage, alt: "CLM lifecycle management workflow", label: "CLM" },
  { src: crmImage, alt: "CRM customer relationship diagram", label: "CRM" },
  { src: automationImage, alt: "Document automation visual workflow", label: "Automation" },
  { src: esignatureImage, alt: "E-Signature workflow illustration", label: "E-Signature" },
];

const highlights = [
  { icon: Shield, text: "Enterprise Security" },
  { icon: Zap, text: "Lightning Fast" },
  { icon: Cloud, text: "Cloud Native" },
  { icon: Bot, text: "AI-Powered" },
];

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Cloud infrastructure background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/60" />
        <div className="absolute inset-0 gradient-hero opacity-70" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-up">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium text-primary">
                Trusted by 500+ enterprises worldwide
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              One Unified Cloud Platform for{" "}
              <span className="text-gradient">CPQ, CLM & CRM</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              SISWIT empowers your business with intelligent automation, seamless integrations, and enterprise-grade security.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/contact">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                  Request Demo
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="heroOutline" size="xl" className="w-full sm:w-auto">
                  Contact Sales
                </Button>
              </Link>
            </div>

            {/* Highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              {highlights.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Service Images Carousel */}
          <div className="hidden lg:block animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-2xl transform translate-x-4 translate-y-4" />
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                plugins={[
                  Autoplay({
                    delay: 3000,
                    stopOnInteraction: false,
                  }),
                ]}
                className="w-full"
              >
                <CarouselContent>
                  {serviceImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative">
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="relative rounded-2xl shadow-2xl border border-border/50 w-full h-auto"
                        />
                        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg border border-border/50">
                          <span className="text-sm font-semibold text-foreground">{image.label}</span>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1.5 h-3 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
}
