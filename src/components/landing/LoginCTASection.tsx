"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatedCTA, AnimatedSection } from "@/components/AnimatedSection";

export default function LoginCTASection() {
  return (
    <AnimatedCTA className="relative bg-gray-50 dark:bg-[#111114] py-12 sm:py-32 border-t border-gray-100 dark:border-white/[0.03] transition-colors duration-1000 overflow-hidden">
      {/* Background Cosmic Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Background Image Texture */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] mix-blend-overlay dark:mix-blend-luminosity">
          <Image
            src="/landing/zerogravity3.webp"
            alt=""
            fill
            className="object-cover scale-110"
            priority
          />
        </div>
      </div>

      <AnimatedSection className="relative z-10 max-w-4xl mx-auto text-center px-8">
        <div className="space-y-8">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-5xl md:text-6xl font-light text-black dark:text-white mb-4 tracking-tight leading-tight">
              Ready to <span className="font-normal italic">break free?</span>
            </h2>
          </AnimatedSection>
          
          <AnimatedSection delay={0.1}>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0 opacity-80 font-light">
              Transcend ordinary and achieve extraordinary goals. <br className="hidden sm:block" />
              ZeroGravity is now live and waiting for you.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <div className="flex justify-center">
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-medium tracking-wide text-white dark:text-black transition-all duration-300 ease-in-out rounded-xl"
              >
                {/* Button background with subtle scale effect */}
                <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] shadow-xl dark:shadow-white/5 rounded-xl" />
                
                <span className="relative flex items-center gap-3">
                  Sign in to ZeroGravity
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>
    </AnimatedCTA>
  );
}
