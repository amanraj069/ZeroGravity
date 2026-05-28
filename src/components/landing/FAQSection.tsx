"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AnimatedSection, AnimatedFeatureGrid } from "@/components/AnimatedSection";
import { motion, Variants } from "framer-motion";

const faqs = [
  {
    id: "ai-quizzes",
    question: "How does ZeroGravity generate personalized quizzes?",
    answer:
      "ZeroGravity uses AI to generate quizzes tailored to any topic you choose. Select your difficulty level, from beginner to the legendary GOD mode with multi-answer questions, and get instant, unique practice sets. Each quiz tracks your performance across multiple trials so you can see exactly how you're improving over time.",
  },
  {
    id: "daily-planner",
    question: "What makes the AI Daily Planner different from a regular to-do list?",
    answer:
      "Unlike static to-do lists, ZeroGravity's AI Daily Planner dynamically adapts to your personal pace and productivity patterns. It intelligently schedules study sessions and goal milestones, factors in your streak history, and adjusts recommendations based on how you actually work, not just how you plan to.",
  },
  {
    id: "privacy",
    question: "How does ZeroGravity protect my academic data?",
    answer:
      "Privacy is a core design principle. Your CGPA, grades, and academic records are stored with encryption. Granular privacy toggles let you decide exactly what's visible on your profile and what stays completely private, you're always in full control of your data.",
  },
  {
    id: "badges",
    question: "How do achievement badges and streaks work?",
    answer:
      "Every action on ZeroGravity contributes to your journey. Maintain daily login streaks to earn bonus coins, complete quizzes to unlock achievement badges, and hit milestones to level up your profile. Badges are displayed on your public profile as proof of your dedication and progress.",
  },
  {
    id: "free",
    question: "Is ZeroGravity free to use?",
    answer:
      "Yes! ZeroGravity is completely free during our launch period. All core features - AI quizzes, daily planner, academic management, and achievement tracking - are available to every registered user at no cost. We're focused on building the best student productivity platform.",
  },
];

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function FAQSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden bg-white dark:bg-[#0a0a0c] border-t border-gray-100 dark:border-white/[0.03] transition-colors duration-1000">
      {/* Cosmic atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        <div className="absolute bottom-[-10%] left-[10%] w-[50%] h-[50%] bg-indigo-600/[0.04] rounded-full blur-[100px] sm:blur-[160px]" />
        <div className="absolute top-[-10%] right-[5%] w-[40%] h-[40%] bg-purple-600/[0.04] rounded-full blur-[80px] sm:blur-[140px]" />
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Section Header — consistent with other landing sections */}
        <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-4 text-center md:text-left">
          <div className="max-w-2xl mx-auto md:mx-0">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="h-[1px] w-12 bg-black dark:bg-white/20" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500">
                Common Questions
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white leading-[1.2] tracking-tight">
              Frequently Asked{" "}
              <span className="font-normal italic bg-clip-text text-transparent bg-gradient-to-r from-black via-black to-black dark:from-white dark:via-purple-200 dark:to-blue-200">
                Questions
              </span>
            </h2>
          </div>
          <div className="md:max-w-[300px] mx-auto md:mx-0">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base font-light leading-relaxed">
              Everything you need to know about ZeroGravity.
            </p>
          </div>
        </AnimatedSection>

        {/* FAQ Accordion — inherited from Quiz Insights */}
        <AnimatedFeatureGrid className="space-y-3 sm:space-y-4 max-w-6xl mx-auto">
          {faqs.map((faq, index) => {
            const isExpanded = expandedId === faq.id;

            return (
              <motion.div
                key={faq.id}
                variants={cardVariants}
                className={`bg-white dark:bg-[#15151a] rounded-xl border transition-colors overflow-hidden ${
                  isExpanded
                    ? "border-gray-200 dark:border-white/[0.08] shadow-sm"
                    : "border-gray-100 dark:border-gray-800/60 hover:border-gray-200 dark:hover:border-gray-700"
                }`}
              >
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : faq.id)
                  }
                  className="w-full p-3 sm:p-6 flex items-start sm:items-center justify-between gap-2 sm:gap-4 text-left group"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-0.5 sm:mt-0 shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:border-gray-200 dark:group-hover:border-white/20">
                        <span className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400">{index + 1}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[12px] sm:text-base font-medium text-black dark:text-white leading-normal sm:leading-snug">
                        {faq.question}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-gray-400 dark:text-gray-500 transition-transform duration-300">
                    <ChevronDown
                      className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>

                {/* Expandable Answer — smooth CSS grid transition like Quiz Insights */}
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-[#15151a]/50 px-4 sm:px-6 py-4 sm:py-6">
                      <p className="text-[12px] sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-light pl-10 sm:pl-12">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatedFeatureGrid>
      </div>
    </section>
  );
}
