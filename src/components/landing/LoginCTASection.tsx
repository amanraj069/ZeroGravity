"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatedCTA, AnimatedSection } from "@/components/AnimatedSection";
import { useState, useEffect } from "react";
import { Gift, X, Sparkles } from "lucide-react";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginCTASection() {
  const [showPromoPopup, setShowPromoPopup] = useState(false);
  const [promoCount, setPromoCount] = useState<number | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const router = useRouter();

  useEffect(() => {
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
  }, []);

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

  return (
    <AnimatedCTA className="relative bg-gray-50 dark:bg-[#111114] py-12 sm:py-32 border-t border-gray-100 dark:border-white/[0.03] transition-colors duration-1000 overflow-hidden">
      {/* Background Cosmic Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 opacity-[0.1] dark:opacity-[0.1] dark:mix-blend-luminosity">
          <Image
            src="/landing/zerogravity3.webp"
            alt=""
            fill
            className="object-cover scale-110"
            loading="lazy"
          />
        </div>
      </div>

      <AnimatedSection className="relative z-10 max-w-4xl mx-auto text-center px-8">
        <div className="space-y-8">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-5xl md:text-6xl font-light text-black dark:text-white mb-4 tracking-tight leading-tight">
              Ready to <span className="font-normal italic">break free?</span>
            </h2>
          </AnimatedSection>
          
          <AnimatedSection delay={0.1}>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0 opacity-80 font-light">
              Transcend ordinary and achieve extraordinary goals. <br className="hidden sm:block" />
              ZeroGravity is now live and waiting for you.
            </p>
          </AnimatedSection>
          
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {promoCount !== null && promoCount > 0 && (
                <motion.button
                  onClick={() => setShowPromoPopup(true)}
                  className="text-black dark:text-white hover:opacity-85 focus:outline-none flex items-center justify-center h-12 sm:h-14 w-12 sm:w-14"
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
                  <Gift className="w-10 h-10 sm:w-12 h-12" />
                </motion.button>
              )}
              
              <Link
                href="/login"
                className="group relative inline-flex items-center justify-center px-6 py-3 sm:px-10 sm:py-4 text-sm sm:text-base font-medium tracking-wide text-white dark:text-black transition-all duration-300 ease-in-out rounded-xl"
              >
                <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98] shadow-xl dark:shadow-white/5 rounded-xl" />
                <span className="relative flex items-center gap-3">
                  Sign in to ZeroGravity
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 group-hover:translate-x-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </AnimatedSection>

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
                      ZeroGravity is giving away lifetime <strong className="text-gray-950 dark:text-white font-semibold">Pro Subscriptions</strong> to the next <strong className="text-purple-600 dark:text-purple-400 font-semibold">{promoCount} users</strong> who register.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      By claiming this account, you will unlock unlimited access to the AI Study Planner, interactive quizzes, achievement badges, and cosmic personalization features- completely free, forever.
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
                      <Sparkles className="w-4 h-4 text-purple-400 dark:text-purple-600 animate-pulse" />
                      <span>Claim Your Pro Account</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>

          </div>
        )}
      </AnimatePresence>
    </AnimatedCTA>
  );
}
