"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  dailyTasksService,
  DailyTasksAnalytics,
} from "@/services/dailyTasksService";
import Link from "next/link";

export default function StreakIcon() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [analytics, setAnalytics] = useState<DailyTasksAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStreakInfo = useCallback(async () => {
    try {
      const data = await dailyTasksService.getStreakInfo();
      setAnalytics(data);
    } catch (error) {
      if (error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("too many requests"))) {
        // Silently ignore rate limit errors during background polling
      } else {
        console.error("Error fetching streak info:", error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isLoggedIn) {
      fetchStreakInfo();
      // Refresh streak info every 60 seconds
      const interval = setInterval(fetchStreakInfo, 60000);
      // Listen for streak-updated events from other components (e.g. DailyTasks, Shop)
      const handleStreakUpdated = () => fetchStreakInfo();
      window.addEventListener("streak-updated", handleStreakUpdated);
      return () => {
        clearInterval(interval);
        window.removeEventListener("streak-updated", handleStreakUpdated);
      };
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isLoggedIn, fetchStreakInfo]);

  // Close tooltip on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setShowTooltip(false);
      }
    };

    if (showTooltip) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTooltip]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (loading || !analytics) return null;

  const currentStreak = analytics.currentStreak;
  const allCompletedToday =
    analytics.totalActiveTasks > 0 &&
    analytics.completedToday >= analytics.totalActiveTasks;
  const hasActiveTasks = analytics.totalActiveTasks > 0;
  const someCompletedToday = analytics.completedToday > 0;

  // Determine fire state:
  // 1. All tasks completed today → full fire (filled with gradient)
  // 2. Some tasks completed but not all → partial fire (warm outline)
  // 3. No tasks completed today → cold fire (gray outline)
  // 4. No active tasks → neutral fire (gray outline, no urgency)
  const isFireActive = allCompletedToday && hasActiveTasks;
  const isPartiallyActive = someCompletedToday && !allCompletedToday && hasActiveTasks;

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  return (
    <div
      className="relative"
      ref={tooltipRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href="/dashboard/goals"
        className="streak-icon-btn relative flex items-center gap-1 p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label={`${currentStreak} day streak`}
        onClick={() => setShowTooltip(false)}
      >
        {/* Fire Icon */}
        <div className="relative">
          {isFireActive && (
            <div className="absolute inset-0 streak-glow rounded-full" />
          )}
          <Flame
            className={`w-5 h-5 transition-all duration-300 ${isFireActive
              ? "streak-fire-active"
              : isPartiallyActive
                ? "streak-fire-partial"
                : "streak-fire-inactive"
              }`}
            fill={isFireActive ? "url(#fireGradient)" : "none"}
            strokeWidth={isFireActive ? 1.5 : 2}
          />
          {/* SVG Gradient Definition */}
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="fireGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Streak Count */}
        <span
          className={`text-xs font-bold tabular-nums leading-none transition-colors duration-300 ${isFireActive
            ? "text-orange-500 dark:text-orange-400"
            : isPartiallyActive
              ? "text-amber-600 dark:text-amber-500"
              : "text-gray-500 dark:text-gray-400"
            }`}
        >
          {currentStreak}
        </span>
      </Link>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg z-50 p-3 rounded-xl streak-tooltip-enter"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Arrow */}
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rotate-45 bg-white dark:bg-gray-900 border-l border-t border-gray-200 dark:border-gray-800" />

          <div className="relative">
            {/* Streak Header */}
            <div className="flex items-center gap-2 mb-2.5">
              <Flame
                className={`w-4 h-4 ${isFireActive
                  ? "text-orange-500"
                  : isPartiallyActive
                    ? "text-amber-500"
                    : "text-gray-400"
                  }`}
                fill={isFireActive ? "currentColor" : "none"}
              />
              <span className="text-sm font-semibold text-black dark:text-white">
                {currentStreak} Day Streak
              </span>
            </div>

            {/* Stats */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Today</span>
                <span
                  className={`font-medium ${allCompletedToday
                    ? "text-green-600 dark:text-green-400"
                    : hasActiveTasks
                      ? "text-gray-700 dark:text-gray-300"
                      : "text-gray-400 dark:text-gray-500"
                    }`}
                >
                  {hasActiveTasks
                    ? `${analytics.completedToday}/${analytics.totalActiveTasks} tasks`
                    : "No tasks set"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">
                  Best Streak
                </span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {analytics.longestStreak} days
                </span>
              </div>
            </div>

            {/* Progress bar for today */}
            {hasActiveTasks && (
              <div className="mt-2.5">
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${allCompletedToday
                      ? "bg-green-500"
                      : "bg-amber-500"
                      }`}
                    style={{
                      width: `${Math.min(
                        (analytics.completedToday / analytics.totalActiveTasks) *
                        100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
