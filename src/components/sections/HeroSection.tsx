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
import cpqImage from "@/assets/cpq-capability-map.png";
import clmImage from "@/assets/clm-lifecycle.png";
import crmImage from "@/assets/crm-diagram.png";
import automationImage from "@/assets/automation-visual.png";
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
  { icon: Shield, text: "Secure" }, // Shortened text for better fit
  { icon: Zap, text: "Fast" },
  { icon: Cloud, text: "Cloud" },
  { icon: Bot, text: "AI" },
];

export function HeroSection() {
  return (
    // Changed min-h-screen to h-[100dvh] to force exact viewport height
    <section className="relative h-[100dvh] w-full flex items-center justify-center overflow-hidden">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBg}
          alt="Cloud infrastructure background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/85 to-background/70" />
        <div className="absolute inset-0 gradient-hero opacity-70" />
      </div>

      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />

      {/* Content Container - Uses h-full to maximize vertical space distribution */}
      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        
        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center h-full max-h-[900px] mx-auto">
          
          {/* Left Column - Text */}
          <div className="text-center lg:text-left flex flex-col justify-center space-y-6 sm:space-y-8">
            
            {/* Wrapper for text content to ensure it stays tight */}
            <div>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-up">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs sm:text-sm font-medium text-primary">
                    Trusted by 500+ enterprises
                </span>
                </div>

                {/* Main Heading - Clamped font sizes */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground tracking-tight leading-tight mb-4 animate-fade-up" style={{ animationDelay: "0.1s" }}>
                One Unified Platform for{" "}
                <span className="text-gradient block mt-1">CPQ, CLM & CRM</span>
                </h1>

                {/* Subheading - Controlled width and size */}
                <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto lg:mx-0 mb-6 sm:mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
                SISWIT empowers your business with intelligent automation, seamless integrations, and enterprise-grade security.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-up" style={{ animationDelay: "0.3s" }}>
                <Link to="/contact">
                    <Button variant="hero" size="lg" className="group w-full sm:w-auto">
                    Request Demo
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </Link>
                <Link to="/contact">
                    <Button variant="heroOutline" size="lg" className="w-full sm:w-auto">
                    Contact Sales
                    </Button>
                </Link>
                </div>
            </div>

            {/* Highlights - Compact layout */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 animate-fade-up pt-2" style={{ animationDelay: "0.4s" }}>
              {highlights.map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-1.5 text-muted-foreground"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Service Images Carousel */}
          {/* Constrained max-height ensures image doesn't force scroll */}
          {/* Right Column - Service Images Carousel */}
          <div className="hidden lg:flex items-center justify-center animate-fade-up h-full max-h-[60vh]" style={{ animationDelay: "0.5s" }}>
            <div className="relative w-full max-w-[600px]">
              {/* Removed the glowing background blob div here */}
              <Carousel
                opts={{ align: "start", loop: true }}
                plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
                className="w-full"
              >
                <CarouselContent>
                  {serviceImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative grid place-items-center">
                        {/* Cleaned up image styles: removed border, shadow, rounded corners, background */}
                        <img
                          src={image.src}
                          alt={image.alt}
                          className="relative w-full max-h-[500px] object-contain"
                        />
                        {/* Kept the label, let me know if this should be removed too */}
                        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 shadow-lg">
                          <span className="text-xs sm:text-sm font-semibold text-foreground">{image.label}</span>
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

      {/* Scroll indicator - Absolute bottom, small footprint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-bounce hidden sm:block">
        <div className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-primary" />
        </div>
      </div>
    </section>
  );
}