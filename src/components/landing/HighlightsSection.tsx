"use client";

import { Puzzle, BrainCircuit, Medal, GraduationCap, Sparkles } from "lucide-react";
import {
  AnimatedSection,
  AnimatedFeatureGrid,
  AnimatedFeatureItem,
} from "@/components/AnimatedSection";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

const highlights = [
  {
    title: "Interactive Quizzes",
    description: "Host live sessions for participants or join hosted quizzes to test your speed and knowledge in real-time.",
    icon: Puzzle,
    badge: "Host & Join",
    href: "/quizzes",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    accent: "bg-violet-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)]",
  },
  {
    title: "AI Daily Planner",
    description: "Intelligent study and goal planning that dynamically adapts to your personal pace and productivity patterns.",
    icon: BrainCircuit,
    badge: "Smart Planning",
    href: "/dashboard",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    accent: "bg-purple-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]",
  },
  {
    title: "Achievement Badges",
    description: "Unlock distinctive badges to showcase your major milestones and celebrate your journey through ZeroGravity.",
    icon: Medal,
    badge: "Milestones",
    href: "/badges",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    accent: "bg-amber-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]",
  },
  {
    title: "Academic Manager",
    description: "Comprehensive academic management now featuring integrated attendance tracking for all your courses.",
    icon: GraduationCap,
    badge: "Academic Hub",
    href: "/academia",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    accent: "bg-emerald-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]",
  },
];

export default function HighlightsSection() {
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; delay: number }[]>([]);

  useEffect(() => {
    const newStars = Array.from({ length: 60 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
    }));
    setStars(newStars);
  }, []);

  return (
    <section className="bg-white dark:bg-[#0a0a0a] py-16 sm:py-24 border-y border-gray-100 dark:border-white/[0.03] relative overflow-hidden transition-colors duration-1000">
      {/* Dark Mode Cosmic Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        {/* Deep space base gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-[#0d0d0d] to-[#111111]" />
        
        {/* Animated Background Atmosphere */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/[0.07] rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/[0.07] rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-violet-600/[0.05] rounded-full blur-[120px]" />
        
        {/* Animated Stars */}
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white opacity-[0.15] animate-pulse"
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-8 text-center md:text-left">
          <div className="max-w-2xl mx-auto md:mx-0">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="h-[1px] w-12 bg-black dark:bg-white/20" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500">
                Beyond Beta 1
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light text-black dark:text-white leading-[1.1] tracking-tight">
              The Evolution of <span className="font-normal italic bg-clip-text text-transparent bg-gradient-to-r from-black via-black to-black dark:from-white dark:via-purple-200 dark:to-blue-200">ZeroGravity</span>
            </h2>
          </div>
          <div className="md:max-w-[300px] mx-auto md:mx-0">
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-lg font-light leading-relaxed mb-1">
              Revolutionary upgrades engineered to elevate your dynamic productivity journey.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedFeatureGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          {highlights.map((item, index) => (
            <AnimatedFeatureItem key={index}>
              <Link href={item.href} className={`block h-full group bg-white dark:bg-[#0a0a0a]/30 backdrop-blur-md overflow-hidden relative transition-all duration-500 ${item.glow}`}>
                {/* Subtle Hover Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                
                <div className="relative h-full p-7 sm:p-9 flex flex-col items-start z-10">
                  <div className="mb-7 relative">
                    <div className="w-12 h-12 flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/10 transition-all duration-500 group-hover:scale-110 group-hover:border-gray-200 dark:group-hover:border-white/20">
                      <item.icon className="w-5 h-5 text-black dark:text-white stroke-[1.25px] transition-transform duration-500 group-hover:rotate-3" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className={`w-1.5 h-1.5 rounded-full ${item.accent} dark:shadow-[0_0_12px_currentColor] opacity-40 dark:opacity-100 transition-transform duration-500 group-hover:scale-125`} />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gray-400 dark:text-gray-400 font-bold">
                      {item.badge}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-light text-black dark:text-white mb-3 tracking-tight group-hover:translate-x-1 transition-transform duration-500">
                    {item.title}
                  </h3>
                  
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed font-light mb-auto group-hover:text-black dark:group-hover:text-gray-200 transition-colors duration-500">
                    {item.description}
                  </p>
                  
                  <div className="mt-8 pt-5 w-full border-t border-gray-50 dark:border-white/5 flex items-center justify-between group/btn">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-black dark:text-white font-semibold group-hover:italic transition-all">Explore</span>
                    <div className="w-4 h-px bg-black/20 dark:bg-white/20 group-hover:w-8 transition-all duration-500" />
                  </div>
                </div>
                
                {/* Interactive Bottom Line */}
                <div className={`absolute bottom-0 left-0 w-full h-[2px] ${item.accent} translate-y-full group-hover:translate-y-0 transition-transform duration-500 dark:shadow-[0_-5px_20px_currentColor]`} />
              </Link>
            </AnimatedFeatureItem>
          ))}
        </AnimatedFeatureGrid>
      </div>
    </section>
  );
}
