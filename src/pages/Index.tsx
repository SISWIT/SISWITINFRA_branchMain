import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { FeaturesSection } from "@/components/sections/FeaturesSection";
import { WhySection } from "@/components/sections/WhySection";
import { LeadershipSection } from "@/components/sections/LeadershipSection";
import { CTASection } from "@/components/sections/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WhySection />
        <LeadershipSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
