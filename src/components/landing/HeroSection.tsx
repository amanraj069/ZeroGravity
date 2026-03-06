"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AnimatedHero,
  AnimatedHeroElement,
} from "@/components/AnimatedSection";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroSection() {
  const { isLoggedIn, isLoading } = useAuth();
  return (
    <div className="relative h-[88dvh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/landing/zerogravity_bg.webp"
          alt="ZeroGravity Background"
          fill
          className="object-cover opacity-25"
          priority
        />
      </div>

      <AnimatedHero className="relative z-10 text-center max-w-4xl mx-auto px-4">
        <AnimatedHeroElement>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-black dark:text-white mb-4 sm:mb-6">
            ZeroGravity
          </h1>
        </AnimatedHeroElement>
        <AnimatedHeroElement>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-400 mb-8 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Break free from gravity. Reach your goals.
          </p>
        </AnimatedHeroElement>
        <AnimatedHeroElement>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="bg-black dark:bg-white text-white dark:text-black px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors w-full sm:w-auto text-center"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-black dark:text-white px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors w-full sm:w-auto text-center"
                    >
                      Profile
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="bg-black dark:bg-white text-white dark:text-black px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors w-full sm:w-auto text-center"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/login"
                      className="border border-gray-300 dark:border-gray-700 bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 text-black dark:text-white px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg font-medium transition-colors w-full sm:w-auto text-center"
                    >
                      Log In
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </AnimatedHeroElement>
      </AnimatedHero>
    </div>
  );
}
