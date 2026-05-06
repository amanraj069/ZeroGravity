"use client";

import React, { useState } from "react";
import { X, Flame } from "lucide-react";
import Link from "next/link";
import { consumeTimeTravelTicket, StreakStatus } from "@/services/shopService";

interface StreakBrokenPopupProps {
  streakStatus: StreakStatus;
  ticketCount: number;
  onClose: () => void;
  onRestoreSuccess: () => void;
}

export default function StreakBrokenPopup({ streakStatus, ticketCount, onClose, onRestoreSuccess }: StreakBrokenPopupProps) {
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restored, setRestored] = useState(false);
  const [selectedDate, setSelectedDate] = useState(streakStatus.missedDates?.[0] || "");

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
          setTimeout(() => onClose(), 2000);
        }
        onRestoreSuccess();
      } else setError(result?.message || "Failed");
    } catch { setError("Network error."); }
    finally { setIsRestoring(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-md mx-4 bg-white dark:bg-gray-900 rounded-xl border-2 border-amber-400/40 dark:border-amber-600/40 shadow-2xl shadow-amber-500/10 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-black dark:hover:text-white transition-colors z-10" aria-label="Close"><X size={18} /></button>

        <div className="p-6 md:p-8">
          {restored ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Flame className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Streak Restored! 🔥</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your streak is back on track.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Flame className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-black dark:text-white">Streak at Risk!</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{streakStatus.missedDays} day{streakStatus.missedDays > 1 ? "s" : ""} missed</p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-5 space-y-2">
                <p className="text-sm text-amber-800 dark:text-amber-300">
                  Your <span className="font-bold">{streakStatus.previousStreak}-day streak</span> is about to break.
                  {ticketCount > 0 ? " Select a missed day and use a ticket to bridge it!" : " Get Time Travel Tickets from the shop to save it!"}
                </p>
                {ticketCount > 0 && streakStatus.missedDates && streakStatus.missedDates.length > 0 && (
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full mt-2 p-2 border border-amber-300 dark:border-amber-700 bg-white dark:bg-gray-800 text-sm rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    {streakStatus.missedDates.map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                )}
              </div>

              {error && <div className="mb-4 p-2 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-xs">{error}</div>}

              <div className="space-y-2">
                {ticketCount > 0 ? (
                  <button onClick={handleUseTicket} disabled={isRestoring || !selectedDate} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md">
                    {isRestoring ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Using...</span></>
                    ) : (
                      <><Flame className="w-4 h-4" /><span>Use Ticket for {selectedDate || "date"} ({ticketCount} left)</span></>
                    )}
                  </button>
                ) : (
                  <Link href="/shop" onClick={onClose} className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg text-sm transition-colors shadow-md">
                    <span>Go to Shop</span>
                  </Link>
                )}
                <button onClick={onClose} className="w-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs py-2 transition-colors">Dismiss</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
