'use client';

import LandingCanvas from './components/landing/LandingCanvas';
import HeroSection from './components/landing/HeroSection';
import HowItWorksSection from './components/landing/HowItWorksSection';
import FeaturesSection from './components/landing/FeaturesSection';
import StatsSection from './components/landing/StatsSection';
import CtaSection from './components/landing/CtaSection';
import Footer from './components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#060709] text-zinc-100">
      <LandingCanvas />
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <StatsSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
