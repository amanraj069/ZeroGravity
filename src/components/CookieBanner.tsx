"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, X } from "lucide-react";

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already set a preference
    const preference = localStorage.getItem("cookie-preference");
    if (!preference) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("cookie-preference", "all");
    setIsVisible(false);
  };

  const handleAcceptNecessary = () => {
    localStorage.setItem("cookie-preference", "necessary");
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 200, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 200, opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none"
        >
          <div className="w-full max-w-5xl border border-gray-200/50 dark:border-white/10 bg-white/70 dark:bg-dark-bg/80 backdrop-blur-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden pointer-events-auto ring-1 ring-gray-900/5 dark:ring-white/5 rounded-2xl">
            {/* Subtle overlay for contrast */}
            <div className="absolute inset-0 bg-gray-900/5 dark:bg-white/5 pointer-events-none" />
            
            <button
              onClick={handleAcceptNecessary}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-20"
              aria-label="Close and accept necessary"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={1.5} />
            </button>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6 pr-8 sm:pr-12 z-10">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="hidden sm:block mt-1 flex-shrink-0 bg-gray-100 dark:bg-dark-surface p-2.5 border border-gray-200 dark:border-white/10 shadow-inner rounded-xl">
                  <Info className="w-6 h-6 text-gray-900 dark:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white tracking-tight">
                    We value your privacy
                  </h3>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mr-2 sm:mr-4">
                    We use cookies to improve your experience.
                  </p>
                </div>
              </div>
              <div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={handleAcceptNecessary}
                  className="w-1/2 sm:w-auto px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-all duration-200 focus:ring-2 focus:ring-gray-200 dark:focus:ring-dark-border focus:ring-offset-2 dark:focus:ring-offset-dark-bg focus:outline-none text-center rounded-lg"
                >
                  Necessary
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="w-1/2 sm:w-auto px-3 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-dark-bg shadow-lg focus:outline-none text-center rounded-lg"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
