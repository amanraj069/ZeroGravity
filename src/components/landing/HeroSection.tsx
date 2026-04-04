"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatedHero,
  AnimatedHeroElement,
} from "@/components/AnimatedSection";
import { useAuth } from "@/contexts/AuthContext";

export default function HeroSection() {
  const { isLoggedIn, isLoading } = useAuth();
  const [quizCode, setQuizCode] = useState("");
  const router = useRouter();

  const handleQuizJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizCode.trim()) {
      router.push(`/joinQuiz?code=${quizCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="relative h-[88dvh] flex flex-col items-center justify-center overflow-hidden">
      {/* Top Banner for Quiz Join */}
      <div className="absolute top-4 lg:top-6 left-0 right-0 z-10 flex justify-center px-4">
        <div className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-md py-2.5 px-5 sm:px-6 border border-gray-200 dark:border-gray-700/80 shadow-sm flex items-center gap-3 sm:gap-4 transition-all hover:bg-white/95 dark:hover:bg-gray-900/90">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
            Here for a Quiz?
          </p>
          <form onSubmit={handleQuizJoin} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Code"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-24 sm:w-28 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 focus:border-black dark:focus:border-white text-black dark:text-white px-1 py-1 focus:outline-none transition-colors uppercase placeholder:normal-case placeholder:text-gray-500 tracking-widest text-center text-sm font-semibold"
            />
            <button
              type="submit"
              disabled={!quizCode.trim()}
              className="bg-black dark:bg-white text-white dark:text-black px-5 py-1.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Go
            </button>
          </form>
        </div>
      </div>

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
