"use client";

import HeroSection from "@/components/landing/HeroSection";
import HighlightsSection from "@/components/landing/HighlightsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import LoginCTASection from "@/components/landing/LoginCTASection";

export default function Home() {
  return (
    <div className="bg-white dark:bg-gray-900">
      <div className="relative">
        <HeroSection />
        {/* Live Banner */}
        <div className="bg-black text-white py-2 px-4 text-xs sm:text-sm overflow-hidden relative">
          <div className="flex animate-marquee whitespace-nowrap">
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            {/* Duplicate for seamless loop */}
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
            <span className="inline-block mr-32 sm:mr-40">
              ZeroGravity is live!
            </span>
          </div>
        </div>
        <HighlightsSection />
        <FeaturesSection />
        <LoginCTASection />
      </div>
    </div>
  );
}
