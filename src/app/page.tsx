"use client";

import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import WaitlistSection from "@/components/landing/WaitlistSection";

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="relative">
        <HeroSection />
        <FeaturesSection />
        <WaitlistSection />
      </div>
    </div>
  );
}
