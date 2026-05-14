"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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
    <div className="relative h-[92dvh] flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-gray-900">
      {/* Top Banner for Quiz Join - Redesigned as a floating glass bar */}
      <div className="absolute top-20 lg:top-12 left-0 right-0 z-10 flex justify-center px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
          className="rounded-full bg-white/5 dark:bg-black/20 backdrop-blur-md py-1.5 pl-5 pr-1.5 border border-white/10 dark:border-white/5 shadow-2xl flex items-center transition-all hover:bg-white/10 dark:hover:bg-black/30 group/quiz"
        >
          <div className="flex items-center gap-4">
            <p className="text-[9px] font-bold text-white whitespace-nowrap tracking-[0.2em] uppercase opacity-40 group-hover/quiz:opacity-100 transition-opacity">
              HERE FOR A QUIZ?
            </p>
            <div className="h-4 w-[1px] bg-white/10" />
            <form onSubmit={handleQuizJoin} className="flex items-center gap-3">
              <input
                type="text"
                placeholder="CODE"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-16 sm:w-20 bg-transparent text-white px-0 py-1 focus:outline-none transition-all uppercase placeholder:text-white/40 tracking-[0.2em] text-center text-[10px] font-bold"
              />
              <button
                type="submit"
                disabled={!quizCode.trim()}
                className="group/btn relative flex items-center justify-center w-7 h-7 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black dark:hover:bg-white text-black dark:text-white hover:text-white dark:hover:text-black transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute inset-0 will-change-transform"
        >
          <Image
            src="/landing/zerogravity_bg.webp"
            alt="ZeroGravity Background"
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Subtle Cosmic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-white/5 dark:from-[#111116] dark:via-transparent dark:to-[#111116]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full sm:w-[1200px] h-full sm:h-[800px] bg-purple-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-[80px] sm:blur-[160px] pointer-events-none will-change-[filter]" />
      </div>

      <AnimatedHero className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <AnimatedHeroElement>
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light text-black dark:text-white mb-6 tracking-tighter leading-none select-none">
            Zero<span className="font-normal italic">Gravity</span>
          </h1>
        </AnimatedHeroElement>

        <AnimatedHeroElement>
          <p className="text-base sm:text-lg md:text-xl text-gray-500 dark:text-gray-400 mb-12 sm:mb-16 max-w-2xl mx-auto font-light leading-relaxed tracking-wide opacity-90">
            Break free from ordinary. <br className="hidden sm:block" />
            Transcend your limits and reach your goals.
          </p>
        </AnimatedHeroElement>

        <AnimatedHeroElement>
          <div className="flex flex-col sm:flex-row gap-5 items-center justify-center">
            {!isLoading && (
              <>
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="group relative inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-medium tracking-wide text-white dark:text-black transition-all duration-300 w-[85%] sm:w-auto rounded-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:scale-[1.02] shadow-xl dark:shadow-white/5 rounded-xl" />
                      <span className="relative">Go to Dashboard</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="group relative inline-flex items-center justify-center px-8 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-medium tracking-wide text-black dark:text-white transition-all duration-300 w-[85%] sm:w-auto border border-black/5 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl hover:bg-black/10 dark:hover:bg-white/10 rounded-xl"
                    >
                      <span className="relative">My Profile</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="group relative inline-flex items-center justify-center px-8 py-3 sm:px-12 sm:py-4 text-sm sm:text-base font-medium tracking-wide text-white dark:text-black transition-all duration-300 w-[85%] sm:w-auto shadow-2xl shadow-black/10 dark:shadow-white/5 rounded-xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] rounded-xl" />
                      <span className="relative flex items-center gap-3">
                        Get Started
                        <svg
                          className="w-5 h-5 transition-transform group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                    </Link>
                    <Link
                      href="/login"
                      className="group relative inline-flex items-center justify-center px-8 py-3 sm:px-12 sm:py-4 text-sm sm:text-base font-medium tracking-wide text-black dark:text-white transition-all duration-300 w-[85%] sm:w-auto border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 backdrop-blur-xl hover:bg-black/10 dark:hover:bg-white/10 rounded-xl"
                    >
                      <span className="relative">Log In</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </AnimatedHeroElement>
      </AnimatedHero>

      {/* Decorative scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 1.5 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-[9px] uppercase tracking-[0.5em] text-gray-400 dark:text-gray-600 font-bold">
          Discover
        </span>
        <div className="w-[1px] h-16 bg-gradient-to-b from-black/20 dark:from-white/20 to-transparent" />
      </motion.div>
    </div>
  );
}
