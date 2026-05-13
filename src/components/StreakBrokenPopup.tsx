"use client";

import React, { useState } from "react";
import { X, Flame, AlertCircle, ShoppingBag, CheckCircle2, ChevronDown } from "lucide-react";
import Link from "next/link";
import { consumeTimeTravelTicket, StreakStatus } from "@/services/shopService";
import { motion, AnimatePresence } from "framer-motion";

interface StreakBrokenPopupProps {
  streakStatus: StreakStatus;
  ticketCount: number;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export default function StreakBrokenPopup({
  streakStatus,
  ticketCount,
  onClose,
  onRestoreSuccess,
}: StreakBrokenPopupProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    streakStatus.missedDates?.[0] || ""
  );

  if (!streakStatus.canUse) return null;

  const handleUseTicket = async () => {
    if (isRestoring || !selectedDate) return;
    setIsRestoring(true);
    setError(null);
    try {
      const result = await consumeTimeTravelTicket(selectedDate);
      if (result?.success) {
        if (result.data?.remainingGap === 0) {
          setRestored(true);
          setTimeout(() => onClose(), 2500);
        }
        onRestoreSuccess();
      } else setError(result?.message || "Failed to restore streak");
    } catch {
      setError("Network error occurred.");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Popup Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md bg-[#050710] border border-white/10 rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Top Accent Gradient - Using Violet/Indigo to match theme */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-5 md:right-5 p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-all z-10"
        >
          <X size={18} className="md:w-5 md:h-5" />
        </button>

        <div className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {restored ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 md:py-6"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 md:mb-6">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">
                  Streak Restored!
                </h2>
                <p className="text-sm md:text-base text-white/60">
                  Progress bridged successfully. Your streak is back on track.
                </p>
              </motion.div>
            ) : (
              <motion.div key="main" exit={{ opacity: 0, scale: 0.95 }}>
                {/* Header */}
                <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-orange-500/20 rounded-2xl blur-lg animate-pulse" />
                    <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center">
                      <Flame className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-lg md:text-2xl font-bold text-white tracking-tight leading-tight">
                      Streak <span className="italic font-light">at Risk</span>
                    </h2>
                    <p className="text-xs md:text-sm text-white/40 mt-0.5">
                      {streakStatus.missedDays} day missed yesterday
                    </p>
                  </div>
                </div>

                {/* Info Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 mb-6 md:mb-8">
                  <p className="text-xs md:text-sm text-white/60 leading-relaxed">
                    Your <span className="font-bold text-white">{streakStatus.previousStreak}-day streak</span> is about to reset. Don&apos;t let your hard work go to waste!
                  </p>
                  
                  {ticketCount > 0 ? (
                    <div className="mt-4 md:mt-5 space-y-2 md:space-y-3">
                      <label className="text-[9px] md:text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
                        Select Date to Bridge
                      </label>
                      <div className="relative">
                         <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-white/[0.05] border border-white/10 text-white text-xs md:text-sm rounded-xl p-3 md:p-4 outline-none focus:border-violet-500/50 appearance-none cursor-pointer transition-colors"
                        >
                          {streakStatus.missedDates?.map((date) => (
                            <option key={date} value={date} className="bg-[#050710]">
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                          <ChevronDown size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 md:mt-5 flex items-start gap-2 md:gap-3 p-3 bg-violet-500/5 rounded-xl border border-violet-500/10">
                      <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-violet-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] md:text-xs text-violet-200/70 leading-relaxed">
                        You don&apos;t have any Time Travel Tickets. Visit the shop to get one and save your streak!
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 md:mb-6 p-3 md:p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] md:text-xs flex items-center gap-2 md:gap-3"
                  >
                    <AlertCircle size={14} className="md:w-4 md:h-4" />
                    {error}
                  </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-2 md:gap-3">
                  {ticketCount > 0 ? (
                    <button
                      onClick={handleUseTicket}
                      disabled={isRestoring || !selectedDate}
                      className="group relative w-full h-11 md:h-14 bg-white hover:bg-gray-100 text-black text-sm md:text-base font-bold rounded-xl overflow-hidden transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                      <div className="relative flex items-center justify-center gap-2 md:gap-2.5">
                        {isRestoring ? (
                          <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Flame size={18} className="fill-black md:w-5 md:h-5" />
                            <span>Use Ticket ({ticketCount} left)</span>
                          </>
                        )}
                      </div>
                    </button>
                  ) : (
                    <Link
                      href="/shop"
                      onClick={onClose}
                      className="group relative w-full h-11 md:h-14 bg-black border border-white/10 hover:border-white/30 text-white text-sm md:text-base font-bold rounded-xl flex items-center justify-center gap-2 md:gap-2.5 transition-all active:scale-[0.98]"
                    >
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <ShoppingBag size={18} className="md:w-5 md:h-5" />
                      <span>Visit Shop</span>
                    </Link>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="w-full py-1 md:py-2 text-[10px] md:text-xs text-white/20 hover:text-white/40 transition-colors uppercase tracking-widest font-bold"
                  >
                    Maybe Later
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
