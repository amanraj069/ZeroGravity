"use client";

import Image from "next/image";
import {
  AnimatedFeatureGrid,
  AnimatedFeatureItem,
  AnimatedSection,
} from "@/components/AnimatedSection";
import { useEffect, useState } from "react";

export default function FeaturesSection() {
  const [stars, setStars] = useState<{ id: number; top: string; left: string; size: number; delay: number; color: string }[]>([]);

  useEffect(() => {
    const starColors = ["bg-white", "bg-purple-100", "bg-blue-100"];
    const newStars = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 0.5,
      delay: Math.random() * 5,
      color: starColors[Math.floor(Math.random() * starColors.length)],
    }));
    setStars(newStars);
  }, []);

  return (
    <section className="relative overflow-hidden bg-white dark:bg-[#111116] transition-colors duration-1000">
      {/* Background Cosmic Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        <div className="absolute top-[20%] left-[-10%] w-[50%] h-[50%] bg-purple-600/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/[0.04] rounded-full blur-[120px]" />
        
        {stars.map((star) => (
          <div
            key={star.id}
            className={`absolute rounded-full ${star.color} opacity-[0.2] animate-pulse`}
            style={{
              top: star.top,
              left: star.left,
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${4 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 py-16 sm:py-24 relative z-10">
        <AnimatedSection className="text-center mb-10 sm:mb-20">
          <h2 className="text-xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white mb-3 tracking-tight px-4">
            Everything You Need to Achieve Your Dreams
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-lg max-w-2xl mx-auto font-light px-6">
            Discover what makes ZeroGravity the ultimate tool for your journey.
          </p>
        </AnimatedSection>

        <AnimatedFeatureGrid className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center mb-16 lg:mb-32">
          <AnimatedFeatureItem className="order-2 lg:order-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <Image
                src="/landing/zerogravity-goal.webp"
                alt="Goal Management Features"
                width={500}
                height={400}
                className="relative rounded-xl border border-gray-100 dark:border-white/5 w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </AnimatedFeatureItem>
          <AnimatedFeatureItem className="order-1 lg:order-2 space-y-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-black dark:text-white">
              Master Your Goals with Precision
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed font-light">
              Transform ambitious dreams into achievable milestones with smart
              goal management that adapts to your journey.
            </p>
            <ul className="space-y-3 sm:space-y-4">
              {[
                "Rich goal descriptions with context and notes",
                "Smart categorization for work, health, and more",
                "Real-time progress visualization with celebrations"
              ].map((text, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black dark:bg-white mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </AnimatedFeatureItem>
        </AnimatedFeatureGrid>

        <AnimatedFeatureGrid className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center mb-16 lg:mb-32">
          <AnimatedFeatureItem className="space-y-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-black dark:text-white">
              Stay Motivated with Intelligent Insights
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed font-light">
              Beautiful visualizations and smart tracking that learns from your
              patterns to keep you engaged and motivated.
            </p>
            <ul className="space-y-3 sm:space-y-4">
              {[
                "Progress bars with milestone celebrations",
                "Interactive checklists for complex goals",
                "Achievement streaks keep you on fire"
              ].map((text, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black dark:bg-white mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </AnimatedFeatureItem>
          <AnimatedFeatureItem>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <Image
                src="/landing/zerogravity-icecream.webp"
                alt="Progress Tracking"
                width={500}
                height={400}
                className="relative rounded-xl border border-gray-100 dark:border-white/5 w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </AnimatedFeatureItem>
        </AnimatedFeatureGrid>

        <AnimatedFeatureGrid className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center mb-16 lg:mb-32">
          <AnimatedFeatureItem className="order-2 lg:order-1">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <Image
                src="/landing/zerogravity-meditate.webp"
                alt="Reminders and Notifications"
                width={500}
                height={400}
                className="relative rounded-xl border border-gray-100 dark:border-white/5 w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </AnimatedFeatureItem>
          <AnimatedFeatureItem className="space-y-6 order-1 lg:order-2">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-black dark:text-white">
              Never Miss a Moment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed font-light">
              Intelligent reminders that turn procrastination into progress with
              gentle nudges and motivation points.
            </p>
            <ul className="space-y-3 sm:space-y-4">
              {[
                "Smart deadline management with flexible scheduling",
                "Motivation points that fuel your progress",
                "Visual countdown timers for positive urgency"
              ].map((text, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black dark:bg-white mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </AnimatedFeatureItem>
        </AnimatedFeatureGrid>

        <AnimatedFeatureGrid className="grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-16 lg:gap-24 items-center">
          <AnimatedFeatureItem className="space-y-6">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-light text-black dark:text-white">
              Complete Privacy Control
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base lg:text-lg leading-relaxed font-light">
              Your journey, your choice. Granular privacy control lets you decide
              what to share and what to keep private.
            </p>
            <ul className="space-y-3 sm:space-y-4">
              {[
                "Individual privacy settings for each goal",
                "One-click toggle between private and public",
                "Secure, encrypted workspace for sensitive goals"
              ].map((text, i) => (
                <li key={i} className="flex items-start">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-black dark:bg-white mr-3 mt-1.5 flex-shrink-0"></div>
                  <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm lg:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </AnimatedFeatureItem>
          <AnimatedFeatureItem>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/10 to-violet-500/10 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
              <Image
                src="/landing/zerogravity-flex.webp"
                alt="Privacy Controls"
                width={500}
                height={400}
                className="relative rounded-xl border border-gray-100 dark:border-white/5 w-full h-auto transition-transform duration-700 group-hover:scale-[1.02]"
              />
            </div>
          </AnimatedFeatureItem>
        </AnimatedFeatureGrid>
      </div>
    </section>
  );
}
