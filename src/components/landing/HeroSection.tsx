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
          className="rounded-full bg-white/10 dark:bg-white/[0.02] backdrop-blur-xl py-1.5 px-3 sm:px-7 border border-black/5 dark:border-white/[0.08] shadow-2xl flex items-center gap-2 sm:gap-6 transition-all hover:bg-white/20 dark:hover:bg-white/[0.05]"
        >
          <p className="text-[9px] sm:text-[11px] font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap tracking-[0.2em] uppercase opacity-70">
            Here for a quiz?
          </p>
          <div className="h-3 w-[1px] bg-black/10 dark:bg-white/10 mx-1" />
          <form onSubmit={handleQuizJoin} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="CODE"
              value={quizCode}
              onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-12 sm:w-20 bg-transparent text-black dark:text-white px-0 py-1 focus:outline-none transition-colors uppercase placeholder:text-gray-400 dark:placeholder:text-white/20 tracking-[0.3em] text-center text-[10px] sm:text-xs font-black border-b border-transparent focus:border-black/40 dark:focus:border-white/40"
            />
            <button
              type="submit"
              disabled={!quizCode.trim()}
              className="text-black dark:text-white p-1 hover:scale-125 active:scale-95 transition-all disabled:opacity-20"
            >
              <svg
                className="w-4 h-4"
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
        </motion.div>
      </div>

      {/* Immersive Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          initial={{ scale: 1.15, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute inset-0"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[800px] bg-purple-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-[160px] pointer-events-none" />
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
                      className="group relative inline-flex items-center justify-center px-10 py-4 font-medium tracking-wide text-white dark:text-black transition-all duration-300 w-full sm:w-auto"
                    >
                      <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:scale-[1.02] shadow-xl dark:shadow-white/5" />
                      <span className="relative">Go to Dashboard</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="group relative inline-flex items-center justify-center px-10 py-4 font-medium tracking-wide text-black dark:text-white transition-all duration-300 w-full sm:w-auto border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30"
                    >
                      <span className="relative">My Profile</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="group relative inline-flex items-center justify-center px-12 py-4 font-medium tracking-wide text-white dark:text-black transition-all duration-300 w-full sm:w-auto shadow-2xl shadow-black/10 dark:shadow-white/5"
                    >
                      <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]" />
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
                      className="group relative inline-flex items-center justify-center px-12 py-4 font-medium tracking-wide text-black dark:text-white transition-all duration-300 w-full sm:w-auto border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5"
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
