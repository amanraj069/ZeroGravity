"use client";

import { Puzzle, BrainCircuit, Medal, GraduationCap, Gift, X, Sparkles } from "lucide-react";
import {
  AnimatedSection,
  AnimatedFeatureGrid,
} from "@/components/AnimatedSection";
import { motion, Variants, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import { useAuth } from "@/contexts/AuthContext";

const highlights = [
  {
    title: "Interactive Quizzes",
    description:
      "Practice with AI-generated quizzes, test your knowledge in real-time, and track your progress seamlessly.",
    icon: Puzzle,
    href: "/dashboard/quizzes",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    accent: "bg-blue-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.2)]",
  },
  {
    title: "AI based Daily Planner",
    description:
      "Intelligent study and goal planning that dynamically adapts to your personal pace and productivity patterns.",
    icon: BrainCircuit,
    href: "/dashboard/goals?tab=daily",
    gradient: "from-purple-500/20 via-purple-500/5 to-transparent",
    accent: "bg-purple-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)]",
  },
  {
    title: "Achievement Badges",
    description:
      "Unlock distinctive badges to showcase your major milestones and celebrate your journey through ZeroGravity.",
    icon: Medal,
    href: "/badges",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    accent: "bg-amber-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.2)]",
  },
  {
    title: "Academic Manager",
    description:
      "Comprehensive academic management now featuring integrated attendance tracking for all your courses.",
    icon: GraduationCap,
    href: "/dashboard/academia",
    gradient: "from-emerald-500/20 via-emerald-500/5 to-transparent",
    accent: "bg-emerald-500",
    glow: "dark:group-hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.2)]",
  },
];

export default function HighlightsSection() {
  const { isLoggedIn } = useAuth();
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [promoCount, setPromoCount] = useState<number | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Don't fetch promo status for logged-in users
    if (isLoggedIn) return;
    const fetchPromoStatus = async () => {
      try {
        const res = await apiCall(API_ENDPOINTS.PROMO.STATUS);
        const data = await res.json();
        if (data.success) {
          setPromoCount(data.availableCount);
        }
      } catch (error) {
        console.error("Failed to fetch promo status:", error);
      }
    };
    fetchPromoStatus();
  }, [isLoggedIn]);

  const handleClaimPromo = async () => {
    try {
      setLoadingCode(true);
      const res = await apiCall(API_ENDPOINTS.PROMO.GET_CODE);
      const data = await res.json();
      if (data.success && data.code) {
        router.push(`/login?luckyCode=${data.code}`);
      }
    } catch (error) {
      console.error("Failed to claim promo code:", error);
    } finally {
      setLoadingCode(false);
    }
  };

  const cardVariants: Variants = useMemo(() => ({
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }), []);

  return (
    <section className="bg-white dark:bg-[#0a0a0a] py-10 sm:py-24 border-y border-gray-100 dark:border-white/[0.03] relative overflow-hidden transition-colors duration-1000">
      {/* Dark Mode Cosmic Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-100 transition-opacity duration-1000">
        {/* Deep space base gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#0a0a0a] via-[#0d0d0d] to-[#111111]" />

        {/* Background Atmosphere - static blurs, no animate-pulse on large elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-purple-600/[0.07] rounded-full blur-[80px] sm:blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-violet-600/[0.07] rounded-full blur-[80px] sm:blur-[140px]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-violet-600/[0.05] rounded-full blur-[60px] sm:blur-[120px]" />

        {/* CSS-only starfield - single element replaces 60 DOM nodes */}
        <div className="absolute inset-0 css-starfield" />
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-8 relative z-10">
        <AnimatedSection className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-8 text-center md:text-left">
          <div className="max-w-2xl mx-auto md:mx-0">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
              <span className="h-[1px] w-12 bg-black dark:bg-white/20" />
              <span className="text-[10px] sm:text-xs uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500">
                Beyond Beta
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-black dark:text-white leading-[1.2] tracking-tight flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
              <span>The Evolution of</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="font-normal italic bg-clip-text text-transparent bg-gradient-to-r from-black via-black to-black dark:from-white dark:via-purple-200 dark:to-blue-200">
                  ZeroGravity
                </span>
                {!isLoggedIn && promoCount !== null && promoCount > 0 && (
                  <motion.button
                    onClick={() => setShowPromoPopup(true)}
                    className="text-black dark:text-white hover:opacity-85 focus:outline-none inline-flex items-center flex-shrink-0 leading-none"
                    aria-label="Free Pro Subscription Offer"
                    animate={{
                      x: [0, -1, 1, -1, 1, 0],
                      y: [0, 1, -1, 1, -1, 0],
                      rotate: [0, -3, 3, -3, 3, 0]
                    }}
                    transition={{
                      duration: 0.5,
                      repeat: Infinity,
                      repeatType: "mirror",
                      repeatDelay: 2.5
                    }}
                  >
                    <Gift className="w-5 h-5 sm:w-7 sm:h-7" />
                  </motion.button>
                )}
              </span>
            </h2>
          </div>
          <div className="md:max-w-[300px] mx-auto md:mx-0">
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-base font-light leading-relaxed">
              Upgrades engineered to elevate your productivity journey.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedFeatureGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-gray-100 dark:bg-white/5 border border-gray-100 dark:border-white/10">
          {highlights.map((item, index) => (
            <motion.div key={index} variants={cardVariants}>
              <Link
                href={item.href}
                className={`block h-full group bg-white dark:bg-[#0a0a0a]/80 overflow-hidden relative transition-all duration-500 ${item.glow}`}
              >
                {/* Subtle Hover Gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700`}
                />

                <div className="relative h-full p-5 sm:p-9 flex flex-col z-10">
                  {/* Header: Icon + (Badge & Title) */}
                  <div className="flex items-center gap-3 mb-3 sm:mb-6">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/10 flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:border-gray-200 dark:group-hover:border-white/20">
                      <item.icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black dark:text-white stroke-[1.25px] transition-transform duration-500 group-hover:rotate-3" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-base sm:text-[1.1rem] font-medium text-black dark:text-white tracking-tight group-hover:translate-x-1 transition-transform duration-500 leading-tight">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-sm leading-relaxed font-light mb-auto group-hover:text-black dark:group-hover:text-gray-200 transition-colors duration-500">
                    {item.description}
                  </p>

                  {/* Footer - Hidden on Mobile */}
                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 w-full border-t border-gray-50 dark:border-white/5 hidden sm:flex items-center justify-between group/btn">
                    <span className="text-[9px] uppercase tracking-[0.2em] text-black dark:text-white font-semibold group-hover:italic transition-all">
                      Explore
                    </span>
                    <div className="w-4 h-px bg-black/20 dark:bg-white/20 group-hover:w-8 transition-all duration-500" />
                  </div>
                </div>

                {/* Interactive Bottom Line */}
                <div
                  className={`absolute bottom-0 left-0 w-full h-[2px] ${item.accent} translate-y-full group-hover:translate-y-0 transition-transform duration-500 dark:shadow-[0_-5px_20px_currentColor]`}
                />
              </Link>
            </motion.div>
          ))}
        </AnimatedFeatureGrid>
      </div>

      {/* Promo Popup */}
      <AnimatePresence>
        {showPromoPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with rich blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPromoPopup(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
            />
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#13131a] border border-gray-200 dark:border-white/[0.08] rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-150 dark:border-white/[0.08] flex-shrink-0 gap-2">
                <h2 className="text-base sm:text-lg font-light text-gray-900 dark:text-white flex items-center gap-2 whitespace-nowrap">
                  <Gift className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                  <span>
                    Unlock Pro <span className="text-amber-600 dark:text-amber-500 font-normal italic">Free</span>
                  </span>
                </h2>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs font-medium px-2.5 py-1 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-white/60 rounded-full">
                    {promoCount} spots left
                  </span>
                  <button
                    onClick={() => setShowPromoPopup(false)}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                <div>
                  <label className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-2">
                    LUCKY PROMO DETAILS
                  </label>
                  <div className="w-full p-4 border border-gray-200 dark:border-white/[0.06] bg-gray-50 dark:bg-black/30 text-gray-800 dark:text-white rounded-xl leading-relaxed space-y-3">
                    <p className="text-sm">
                      ZeroGravity is giving away <strong className="text-gray-950 dark:text-white font-semibold">Pro Subscriptions</strong> to the next <strong className="text-purple-600 dark:text-purple-400 font-semibold">{promoCount} users</strong> who register.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      By claiming this account, you will unlock upgraded access to the AI Study Planner, interactive quizzes, achievement badges, and cosmic personalization features- completely free.
                    </p>
                  </div>
                </div>

                {/* Claim Button */}
                <button
                  onClick={handleClaimPromo}
                  disabled={loadingCode}
                  className="w-full h-12 bg-black dark:bg-white text-white dark:text-black font-semibold text-sm rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 hover:bg-gray-800 dark:hover:bg-gray-150 flex items-center justify-center gap-2"
                >
                  {loadingCode ? (
                    <span className="w-5 h-5 border-2 border-white/30 dark:border-black/35 border-t-white dark:border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white-400 dark:text-white-600 animate-pulse" />
                      <span>Claim Your Pro Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
