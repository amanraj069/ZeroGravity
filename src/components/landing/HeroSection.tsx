"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  AnimatedHero,
  AnimatedHeroElement,
} from "@/components/AnimatedSection";
import { useAuth } from "@/contexts/AuthContext";
import { Search, ChevronRight } from "lucide-react";

export default function HeroSection() {
  const { isLoggedIn, isLoading } = useAuth();
  const [quizCode, setQuizCode] = useState("");
  const router = useRouter();
  
  // Parallax effect for the background
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0.5]);

  const handleQuizJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (quizCode.trim()) {
      router.push(`/joinQuiz?code=${quizCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="relative h-[92dvh] flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#030303]">
      {/* Mesh Gradient Background Layer */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 via-white to-purple-50/40 dark:from-blue-900/10 dark:via-[#030303] dark:to-purple-900/10"></div>
        <motion.div 
          style={{ y: y1, opacity }} 
          className="absolute inset-0 z-0"
        >
          <Image
            src="/landing/zerogravity_bg.webp"
            alt="ZeroGravity Background"
            fill
            className="object-cover opacity-[0.25] dark:opacity-[0.35]"
            priority
            style={{
              maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
              WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)'
            }}
          />
        </motion.div>
      </div>

      {/* Dynamic Grid Background - Subtly overlaid */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none">
        <div className="absolute inset-0" style={{ 
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '48px 48px' 
        }}></div>
      </div>

      {/* Command Palette Style Action Bar */}
      <div className="absolute top-8 left-0 right-0 z-20 flex justify-center px-4">
        <motion.div 
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/60 dark:bg-black/60 backdrop-blur-xl border border-white dark:border-gray-800 rounded-2xl p-1.5 flex items-center gap-2 shadow-xl shadow-black/5"
        >
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black dark:group-focus-within:text-white transition-colors" size={14} />
              <form onSubmit={handleQuizJoin} className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Join session..."
                  value={quizCode}
                  onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-32 sm:w-44 bg-transparent border-none rounded-xl pl-10 pr-3 py-2.5 text-xs font-mono tracking-wider focus:outline-none text-black dark:text-white placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  disabled={!quizCode.trim()}
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-xl text-[10px] font-bold tracking-tight hover:opacity-80 transition-all disabled:opacity-20 active:scale-95"
                >
                  GO
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <AnimatedHero>
          <AnimatedHeroElement>
            <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold tracking-tighter text-black dark:text-white mb-6">
              Zero<span className="text-gray-400/80 dark:text-gray-600/80">Gravity</span>
            </h1>
          </AnimatedHeroElement>

          <AnimatedHeroElement>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-14 max-w-2xl mx-auto font-light leading-relaxed text-balance">
              The intelligent dashboard for deep productivity. <br className="hidden sm:block" />
              Break through the weight of complexity.
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
                        className="group relative flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-12 py-4 text-lg font-bold rounded-2xl transition-all hover:translate-y-[-4px] active:translate-y-[0px] shadow-2xl shadow-black/10 dark:shadow-white/5 w-full sm:w-auto"
                      >
                        Dashboard <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/profile"
                        className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white px-12 py-4 text-lg font-bold rounded-2xl transition-all w-full sm:w-auto"
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="group relative flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-12 py-4 text-lg font-bold rounded-2xl transition-all hover:translate-y-[-4px] active:translate-y-[0px] shadow-2xl shadow-black/10 dark:shadow-white/5 w-full sm:w-auto"
                      >
                        Get Started <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md hover:bg-gray-100 dark:hover:bg-gray-800 text-black dark:text-white px-12 py-4 text-lg font-bold rounded-2xl transition-all w-full sm:w-auto"
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
    </div>
  );
}
