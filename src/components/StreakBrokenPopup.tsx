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
      {/* SVG Gradient */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="popupFireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>
      </svg>

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-2xl"
        onClick={onClose}
      />

      {/* Popup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-sm bg-[#0a0a0f]/95 border border-white/[0.07] rounded-3xl shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-hidden"
      >
        {/* Top orange accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/40 to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-white/25 hover:text-white/60 hover:bg-white/5 rounded-full transition-all z-10"
        >
          <X size={16} />
        </button>

        <div className="p-7">
          <AnimatePresence mode="wait">
            {restored ? (
              /* ── Success State ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="relative w-16 h-16 mx-auto mb-5">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
                  <div className="relative w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center ring-1 ring-emerald-500/20">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-white mb-1.5">Streak Restored!</h2>
                <p className="text-sm text-white/40">Your streak is back on track.</p>
              </motion.div>
            ) : (
              /* ── Main State ── */
              <motion.div key="main" exit={{ opacity: 0, scale: 0.95 }}>

                {/* Hero: bare fire icon */}
                <div className="flex flex-col items-center text-center mb-7">
                  <div className="relative mb-5">
                    {/* Diffuse glow only — no box */}
                    <div className="absolute inset-0 -m-4 bg-orange-500/20 rounded-full blur-2xl animate-pulse" />
                    <Flame
                      className="relative w-12 h-12 drop-shadow-[0_0_12px_rgba(249,115,22,0.7)]"
                      fill="url(#popupFireGradient)"
                      stroke="#fb923c"
                      strokeWidth={0.8}
                    />
                  </div>
                  <h2 className="text-xl font-semibold text-white tracking-tight leading-tight">
                    Streak <span className="italic font-light text-white/60">at Risk</span>
                  </h2>
                  <p className="text-xs text-white/30 mt-1">
                    {streakStatus.missedDays} day missed yesterday
                  </p>
                </div>

                {/* Body */}
                <div className="space-y-4 mb-6">
                  <p className="text-sm text-white/50 leading-relaxed text-center">
                    Your{" "}
                    <span className="font-semibold text-white">
                      {streakStatus.previousStreak}-day streak
                    </span>{" "}
                    is about to reset.
                  </p>

                  {ticketCount > 0 ? (
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-white/25 uppercase tracking-[0.2em] font-semibold block text-center">
                        Select Date to Bridge
                      </label>
                      <div className="relative">
                        <select
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="w-full bg-white/[0.04] border border-white/[0.08] text-white/80 text-sm rounded-xl px-4 py-3 outline-none focus:border-orange-500/30 focus:bg-white/[0.06] appearance-none cursor-pointer transition-all"
                        >
                          {streakStatus.missedDates?.map((date) => (
                            <option key={date} value={date} className="bg-[#0a0a0f]">
                              {new Date(date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-white/20">
                          <ChevronDown size={14} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                      <AlertCircle className="w-4 h-4 text-amber-400/70 shrink-0 mt-px" />
                      <p className="text-xs text-white/40 leading-relaxed">
                        No Time Travel Tickets left. Visit the shop to save your streak.
                      </p>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 px-3.5 py-2.5 bg-rose-500/8 border border-rose-500/15 rounded-xl text-rose-400/80 text-xs flex items-center gap-2"
                  >
                    <AlertCircle size={13} />
                    {error}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  {ticketCount > 0 ? (
                    <button
                      onClick={handleUseTicket}
                      disabled={isRestoring || !selectedDate}
                      className="group relative w-full h-12 rounded-2xl overflow-hidden transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 bg-white hover:bg-gray-100"
                    >
                      <div className="relative flex items-center justify-center gap-2 text-black font-semibold text-sm">
                        {isRestoring ? (
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>
                            <Flame size={15} fill="black" stroke="none" />
                            <span>Use Ticket ({ticketCount} left)</span>
                          </>
                        )}
                      </div>
                    </button>
                  ) : (
                    <Link
                      href="/shop"
                      onClick={onClose}
                      className="group relative w-full h-12 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      <ShoppingBag size={15} />
                      <span>Visit Shop</span>
                    </Link>
                  )}

                  <button
                    onClick={onClose}
                    className="w-full py-2 text-[10px] text-white/20 hover:text-white/40 transition-colors uppercase tracking-[0.18em] font-semibold"
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
