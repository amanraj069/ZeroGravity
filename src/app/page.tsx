"use client";

import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WaitlistSection from "@/components/landing/WaitlistSection";
import LandingFooter from "@/components/landing/LandingFooter";

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <LandingNavbar />

      <main className="relative">
        <HeroSection />
        <FeaturesSection />
        <WaitlistSection />
      </main>

      <LandingFooter />
    </div>
  );
}
