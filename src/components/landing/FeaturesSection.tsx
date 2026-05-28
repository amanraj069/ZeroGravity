"use client";

import Image from "next/image";
import {
  AnimatedFeatureItem,
  AnimatedSection,
} from "@/components/AnimatedSection";
import { Target, TrendingUp, Bell, ShieldCheck, Zap } from "lucide-react";

const features = [
  {
    id: "goals",
    title: "Master Your Goals",
    description: "Transform ambitious dreams into achievable milestones with our AI-based daily planner that adapts to your unique journey.",
    bullets: ["Achievement streaks", "Daily planning", "Progress visualization"],
    image: "/landing/zerogravity-goal.webp",
    icon: Target,
    gradient: "from-purple-500/10 via-purple-500/5 to-transparent",
    border: "group-hover:border-purple-500/50 dark:group-hover:border-purple-500/30",
    iconColor: "text-purple-400",
    size: "lg:col-span-7"
  },
  {
    id: "quizzes",
    title: "AI-Powered Quizzes",
    description: "Practice with AI-generated quizzes, test your knowledge in real-time, and track your progress seamlessly over time.",
    bullets: ["Personalised Quizzes", "Live multiplayer", "Detailed analytics"],
    image: "/landing/zerogravity-icecream.webp",
    icon: TrendingUp,
    gradient: "from-blue-500/10 via-blue-500/5 to-transparent",
    border: "group-hover:border-blue-500/50 dark:group-hover:border-blue-500/30",
    iconColor: "text-blue-400",
    size: "lg:col-span-5"
  },
  {
    id: "academia",
    title: "Academic Manager",
    description: "Comprehensive academic management featuring integrated attendance tracking for all your courses.",
    bullets: ["Encrypted CGPA store","Attendance tracking", "Course management"],
    image: "/landing/zerogravity-meditate.webp",
    icon: Bell,
    gradient: "from-violet-500/10 via-violet-500/5 to-transparent",
    border: "group-hover:border-violet-500/50 dark:group-hover:border-violet-500/30",
    iconColor: "text-violet-400",
    size: "lg:col-span-5"
  },
  {
    id: "privacy",
    title: "Complete Privacy",
    description: "Granular control lets you decide exactly what to share and what to keep protected in your encrypted workspace.",
    bullets: ["Encrypted storage", "One-click toggle", "Granular settings"],
    image: "/landing/zerogravity-flex.webp",
    icon: ShieldCheck,
    gradient: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    border: "group-hover:border-emerald-500/50 dark:group-hover:border-emerald-500/30",
    iconColor: "text-emerald-400",
    size: "lg:col-span-7"
  }
];

export default function FeaturesSection() {
  return (
    <section className="relative pt-20 lg:pt-32 pb-16 overflow-hidden bg-white dark:bg-[#0a0a0c] transition-colors duration-1000">
      {/* Cosmic Atmosphere - static blurs, CSS starfield */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        <div className="absolute top-[10%] left-[-5%] w-[40%] h-[40%] bg-purple-600/[0.05] rounded-full blur-[80px] sm:blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/[0.05] rounded-full blur-[80px] sm:blur-[140px]" />
        
        {/* CSS-only starfield - single element replaces 60 DOM nodes */}
        <div className="absolute inset-0 css-starfield css-starfield--alt" />
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">
        <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-8 text-center md:text-left">
          <div className="max-w-2xl mx-auto md:mx-0">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="h-[1px] w-12 bg-black dark:bg-white/20" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500">
                Features Showcase
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white leading-[1.2] tracking-tight">
              Everything You Need to <span className="font-normal italic bg-clip-text text-transparent bg-gradient-to-r from-black via-black to-black dark:from-white dark:via-purple-200 dark:to-blue-200">Achieve Your Dreams</span>
            </h2>
          </div>
          <div className="md:max-w-[300px] mx-auto md:mx-0">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base font-light leading-relaxed">
              Professional tools for clarity, motivation, and total control of your journey.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {features.map((feature) => (
            <AnimatedFeatureItem 
              key={feature.id} 
              className={`group relative overflow-hidden bg-white/70 dark:bg-white/[0.02] rounded-3xl border border-slate-200/80 dark:border-white/[0.05] shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-none hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] dark:hover:shadow-none transition-all duration-500 cursor-default ${feature.border} ${feature.size}`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
              
              <div className="relative h-full flex flex-col p-8 sm:p-10">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
                  <div className="space-y-3 max-w-md">
                    <h3 className="text-2xl font-light text-black dark:text-white tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed font-light">
                      {feature.description}
                    </p>

                    {/* Points below description for narrow cards (Insights & Reminders) */}
                    {feature.size.includes("lg:col-span-5") && (
                      <ul className="pt-4 space-y-3">
                        {feature.bullets.map((bullet, i) => (
                          <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-light">
                            <Zap className={`w-3 h-3 ${feature.iconColor}`} />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Points on the side for wide cards (Goals & Privacy) */}
                  {feature.size.includes("lg:col-span-7") && (
                    <ul className="hidden xl:block space-y-3 shrink-0">
                      {feature.bullets.map((bullet, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-light">
                          <Zap className={`w-3 h-3 ${feature.iconColor}`} />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-auto relative">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.01]">
                    <Image
                      src={feature.image}
                      alt={feature.title}
                      width={800}
                      height={500}
                      loading="lazy"
                      className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-[1.03] will-change-transform"
                    />
                  </div>
                </div>
              </div>
            </AnimatedFeatureItem>
          ))}
        </div>
        
        {/* Quality Indicator */}
        <AnimatedSection className="mt-16 text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-gray-500 dark:text-gray-600 font-bold">
            Crafted for Perfection & Performance
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
}
