"use client";

import React, { useState } from "react";
import { X, CheckCircle } from "lucide-react";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";

interface StreakInfo {
  currentDay: number;
  completed: boolean;
  claimed: boolean;
  isWelcomeBack?: boolean;
}

interface LoginStreakBonusProps {
  streakInfo: StreakInfo | null;
  userName: string;
  onClose: () => void;
  onClaimSuccess: (pointsAwarded?: number) => void;
}

// Progressive points: 50, 70, 95, 130, 170, 220, 265 = 1000 total
const STREAK_POINTS_BY_DAY = [50, 70, 95, 130, 170, 220, 265];

export default function LoginStreakBonus({
  streakInfo,
  userName,
  onClose,
  onClaimSuccess,
}: LoginStreakBonusProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show if no streak info or already claimed
  if (!streakInfo || streakInfo.currentDay === 0 || streakInfo.claimed) {
    return null;
  }

  const handleClaim = async () => {
    if (isClaiming) return; // Prevent double-clicking

    setIsClaiming(true);
    setError(null);

    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.CLAIM_STREAK_BONUS,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        // Calculate points to award for animation
        const currentDayIndex = streakInfo.currentDay - 1;
        const pointsToAward = STREAK_POINTS_BY_DAY[currentDayIndex] || 0;

        // Trigger animation in parent component
        onClaimSuccess(pointsToAward);

        // Close after a short delay to show success
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(data.message || "Failed to claim bonus");
      }
    } catch (err) {
      console.error("Error claiming streak bonus:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsClaiming(false);
    }
  };

  const currentDayIndex = streakInfo.currentDay - 1; // Convert to 0-indexed
  const pointsToAward = STREAK_POINTS_BY_DAY[currentDayIndex] || 0;
  const isWelcomeBack = streakInfo.isWelcomeBack || false;
  const isCurrentDay = streakInfo.currentDay > 0 && !streakInfo.claimed;

  // Get welcome message based on day
  const getWelcomeMessage = () => {
    if (isWelcomeBack) {
      return `Welcome back, ${userName}! Here's a small gift for you`;
    }
    if (streakInfo.currentDay === 1) {
      return `Hey ${userName}, Thank you for Signing up in ZeroGravity`;
    }
    return `Glad you decided to continue on Day ${streakInfo.currentDay}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div
        className="relative w-[90%] max-w-4xl mx-4 bg-light-card dark:bg-dark-surface border-2 border-black dark:border-dark-border shadow-2xl"
        style={{ borderRadius: 0 }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors z-10"
          aria-label="Close"
          style={{ borderRadius: 0 }}
        >
          <X size={20} />
        </button>

        {/* Content - Compact Layout */}
        <div className="p-6 md:p-10">
          {/* Header with Welcome Message - Smaller */}
          <div className="mb-6">
            <h2 className="text-lg md:text-xl font-semibold text-black dark:text-white mb-1">
              {streakInfo.completed
                ? "7-Day Streak Complete! 🎉"
                : `Day ${streakInfo.currentDay} of 7`}
            </h2>
            <p className="text-xs md:text-sm text-gray-700 dark:text-gray-400">
              {getWelcomeMessage()}
            </p>
          </div>

          {/* 7 Days Grid - Vertical on mobile, horizontal on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-2 lg:gap-3 mb-6">
            {STREAK_POINTS_BY_DAY.map((points, index) => {
              const dayNumber = index + 1;
              const isPastDay = dayNumber < streakInfo.currentDay;
              const isCurrentDayCard = dayNumber === streakInfo.currentDay;

              return (
                <div
                  key={dayNumber}
                  onClick={
                    isCurrentDayCard && !streakInfo.claimed
                      ? handleClaim
                      : undefined
                  }
                  className={`
                    border-2 p-1.5 md:p-4 transition-all duration-200 flex items-center justify-between md:flex-col md:justify-between md:min-h-[180px] overflow-hidden
                    ${
                      isCurrentDayCard && !streakInfo.claimed
                        ? "border-black dark:border-dark-border bg-black dark:bg-black text-white dark:text-white cursor-pointer hover:bg-gray-800 dark:hover:bg-gray-900"
                        : isPastDay
                        ? "border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/20"
                        : "border-light-border dark:border-dark-border bg-light-surface dark:bg-dark-card"
                    }
                  `}
                  style={{ borderRadius: 0 }}
                >
                  {/* Day Number - Left on mobile, Top on desktop */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isPastDay && (
                      <CheckCircle
                        className="text-green-600 dark:text-green-400 flex-shrink-0"
                        size={16}
                      />
                    )}
                    <div
                      className={`
                        text-xs md:text-sm font-semibold whitespace-nowrap
                        ${
                          isCurrentDayCard && !streakInfo.claimed
                            ? "text-white dark:text-gray-200"
                            : "text-gray-700 dark:text-gray-400"
                        }
                      `}
                    >
                      Day {dayNumber}
                    </div>
                  </div>

                  {/* Points Display - Right on mobile, Bottom on desktop with Bigger Font */}
                  <div
                    className={`
                      text-2xl md:text-3xl lg:text-4xl font-bold flex-shrink-0 text-right md:text-center
                      ${
                        isCurrentDayCard && !streakInfo.claimed
                          ? "text-white dark:text-white"
                          : isPastDay
                          ? "text-green-600 dark:text-green-400"
                          : "text-gray-400 dark:text-gray-500"
                      }
                    `}
                  >
                    +{points}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Current Day Info - Hidden on mobile, shown on desktop */}
          <div
            className="hidden md:block border-2 border-black dark:border-dark-border bg-light-card dark:bg-dark-surface p-4 mb-6"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-gray-700 dark:text-gray-400 mb-1">
                  {isCurrentDay ? "Available Now" : "Next Reward"}
                </div>
                <div className="text-xl md:text-2xl font-bold text-black dark:text-white">
                  +{pointsToAward.toLocaleString()} points
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Total:{" "}
                  <span className="font-semibold text-black dark:text-white">
                    {STREAK_POINTS_BY_DAY.reduce(
                      (sum, p, i) =>
                        i < streakInfo.currentDay ? sum + p : sum,
                      0
                    ).toLocaleString()}
                  </span>{" "}
                  /{" "}
                  {STREAK_POINTS_BY_DAY.reduce(
                    (a, b) => a + b,
                    0
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-800 text-red-700 dark:text-red-400 text-xs"
              style={{ borderRadius: 0 }}
            >
              {error}
            </div>
          )}

          {/* Claim Button - Smaller */}
          <button
            onClick={handleClaim}
            disabled={isClaiming}
            className="w-full bg-black dark:bg-dark-card text-white dark:text-white font-semibold py-4 px-4 text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-dark-hover border-2 border-transparent dark:border-dark-border"
            style={{ borderRadius: 0 }}
          >
            {isClaiming ? (
              <>
                <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent animate-spin" />
                <span>Claiming...</span>
              </>
            ) : (
              <span>Claim {pointsToAward.toLocaleString()} Points</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
