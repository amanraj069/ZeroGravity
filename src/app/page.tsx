"use client";

import HeroSection from "@/components/landing/HeroSection";
import HighlightsSection from "@/components/landing/HighlightsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import LoginCTASection from "@/components/landing/LoginCTASection";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function Home() {
  const { isLoggedIn, isLoading } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Optimized marquee spans - fewer on mobile to reduce DOM nodes and paint cost
  const marqueeCount = isMobile ? 6 : 12;
  const marqueeItems = Array.from({ length: marqueeCount }).map((_, i) => (
    <span key={i} className="inline-block mr-24 sm:mr-40 font-medium tracking-[0.1em] uppercase">
      ZeroGravity is live!
    </span>
  ));

  return (
    <div className="bg-transparent">
      <div className="relative">
        <HeroSection />
        
        {/* Live Banner - Optimized marquee */}
        <div className="bg-black text-white py-2.5 px-4 text-[10px] sm:text-xs overflow-hidden relative border-y border-white/5">
          <div className="flex animate-marquee whitespace-nowrap will-change-transform">
            {marqueeItems}
            {/* Duplicate for seamless loop */}
            {marqueeItems}
          </div>
        </div>
        
        <HighlightsSection />
        <FeaturesSection />
        {!isLoading && !isLoggedIn && <LoginCTASection />}
      </div>
    </div>
  );
}
