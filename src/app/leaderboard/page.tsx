"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Image from "next/image";
import {
  leaderboardService,
  LeaderboardEntry,
} from "@/services/leaderboardService";
import { getBorderStyle, getAnimationClass } from "@/services/shopService";

export default function Leaderboard() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [leaderboard, setLeaderboard] = useState<{
    weekStart: string;
    weekEnd: string;
    entries: LeaderboardEntry[];
    notEligibleEntries: LeaderboardEntry[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchLeaderboard();
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leaderboardService.getWeeklyLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load leaderboard"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Format with full date and time including hours, minutes, seconds in IST
    const formatDateTime = (date: Date) => {
      const dateOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      };
      const timeOptions: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      };
      const dateStr = date.toLocaleDateString("en-US", dateOptions);
      const timeStr = date.toLocaleTimeString("en-US", timeOptions);
      return `${dateStr} at ${timeStr} IST`;
    };

    return `${formatDateTime(startDate)} - ${formatDateTime(endDate)}`;
  };

  const formatStartingDate = (start: string) => {
    const startDate = new Date(start);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata", // Use IST to match the week start date
    };
    return startDate.toLocaleDateString("en-US", options);
  };

  // Trophy component for top 3 ranks
  const TrophyIcon = ({ rank, userId }: { rank: number; userId: string }) => {
    const isGold = rank === 1;
    const isSilver = rank === 2;

    // Color schemes for different ranks
    const trophyColor = isGold
      ? {
          main: "#FFD700",
          secondary: "#FFA500",
          dark: "#B8860B",
          highlight: "#FFF8DC",
          glow: "#FFD700", // Golden glow
        }
      : isSilver
      ? {
          main: "#C0C0C0",
          secondary: "#A8A8A8",
          dark: "#808080",
          highlight: "#E8E8E8",
          glow: "#E8E8E8", // Silver glow
        }
      : {
          main: "#CD7F32",
          secondary: "#B87333",
          dark: "#8B4513",
          highlight: "#E6C19A",
          glow: "#CD7F32", // Bronze glow
        };

    const trophyId = `trophy-${rank}-${userId}`;

    return (
      <span className="inline-flex items-center flex-shrink-0">
        <svg
          viewBox="0 0 200 250"
          className="w-10 h-10 sm:w-14 sm:h-14"
          xmlns="http://www.w3.org/2000/svg"
          filter={`url(#glowOuter-${trophyId})`}
        >
          <defs>
            <linearGradient
              id={`trophyMain-${trophyId}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor={trophyColor.main} stopOpacity="1" />
              <stop
                offset="30%"
                stopColor={trophyColor.secondary}
                stopOpacity="1"
              />
              <stop offset="60%" stopColor={trophyColor.main} stopOpacity="1" />
              <stop
                offset="100%"
                stopColor={trophyColor.dark}
                stopOpacity="1"
              />
            </linearGradient>
            <linearGradient
              id={`trophyHighlight-${trophyId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor={trophyColor.highlight}
                stopOpacity="0.8"
              />
              <stop
                offset="100%"
                stopColor={trophyColor.main}
                stopOpacity="0.3"
              />
            </linearGradient>
            <linearGradient
              id={`trophyShadow-${trophyId}`}
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
            </linearGradient>
            <filter
              id={`glow-${trophyId}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="4" in="SourceAlpha" result="blur" />
              <feFlood
                floodColor={trophyColor.glow}
                floodOpacity="0.8"
                result="glowColor"
              />
              <feComposite
                in="glowColor"
                in2="blur"
                operator="in"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id={`glowStrong-${trophyId}`}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="8" in="SourceAlpha" result="blur" />
              <feFlood
                floodColor={trophyColor.glow}
                floodOpacity="0.9"
                result="glowColor"
              />
              <feComposite
                in="glowColor"
                in2="blur"
                operator="in"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter
              id={`glowOuter-${trophyId}`}
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur
                stdDeviation="12"
                in="SourceAlpha"
                result="blur"
              />
              <feFlood
                floodColor={trophyColor.glow}
                floodOpacity="0.7"
                result="glowColor"
              />
              <feComposite
                in="glowColor"
                in2="blur"
                operator="in"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Base/Pedestal */}
          <ellipse
            cx="100"
            cy="240"
            rx="70"
            ry="15"
            fill={`url(#trophyShadow-${trophyId})`}
            opacity="0.4"
          />
          <rect
            x="60"
            y="200"
            width="80"
            height="40"
            rx="5"
            fill={`url(#trophyMain-${trophyId})`}
          />
          <rect
            x="65"
            y="205"
            width="70"
            height="30"
            rx="3"
            fill={`url(#trophyHighlight-${trophyId})`}
            opacity="0.4"
          />
          {/* Cup body */}
          <path
            d="M 80 60 Q 80 40 100 40 Q 120 40 120 60 L 120 180 Q 120 200 100 200 Q 80 200 80 180 Z"
            fill={`url(#trophyMain-${trophyId})`}
            filter={`url(#glowStrong-${trophyId})`}
          />
          {/* Cup highlight */}
          <path
            d="M 85 65 Q 85 50 100 50 Q 115 50 115 65 L 115 175 Q 115 190 100 190 Q 85 190 85 175 Z"
            fill={`url(#trophyHighlight-${trophyId})`}
            opacity="0.6"
          />
          {/* Left handle */}
          <path
            d="M 80 80 Q 50 80 50 120 Q 50 160 80 160"
            fill="none"
            stroke={`url(#trophyMain-${trophyId})`}
            strokeWidth="8"
            strokeLinecap="round"
            filter={`url(#glow-${trophyId})`}
          />
          <path
            d="M 75 85 Q 55 85 55 120 Q 55 155 75 155"
            fill="none"
            stroke={`url(#trophyHighlight-${trophyId})`}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Right handle */}
          <path
            d="M 120 80 Q 150 80 150 120 Q 150 160 120 160"
            fill="none"
            stroke={`url(#trophyMain-${trophyId})`}
            strokeWidth="8"
            strokeLinecap="round"
            filter={`url(#glow-${trophyId})`}
          />
          <path
            d="M 125 85 Q 145 85 145 120 Q 145 155 125 155"
            fill="none"
            stroke={`url(#trophyHighlight-${trophyId})`}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.7"
          />
          {/* Crown/Star on top */}
          <g transform="translate(100, 30)" filter={`url(#glow-${trophyId})`}>
            <path
              d="M 0 -15 L 4 -4 L 15 -4 L 6 2 L 9 13 L 0 7 L -9 13 L -6 2 L -15 -4 L -4 -4 Z"
              fill={trophyColor.main}
              stroke={trophyColor.secondary}
              strokeWidth="1"
            />
            <path
              d="M -20 -5 L -18 0 L -13 0 L -16 3 L -15 8 L -20 5 L -25 8 L -24 3 L -27 0 L -22 0 Z"
              fill={trophyColor.main}
              opacity="0.8"
            />
            <path
              d="M 20 -5 L 22 0 L 27 0 L 24 3 L 25 8 L 20 5 L 15 8 L 16 3 L 13 0 L 18 0 Z"
              fill={trophyColor.main}
              opacity="0.8"
            />
          </g>
          {/* Sparkles */}
          <circle
            cx="90"
            cy="100"
            r="2"
            fill={trophyColor.highlight}
            opacity="0.9"
          >
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>
          <circle
            cx="110"
            cy="120"
            r="1.5"
            fill={trophyColor.highlight}
            opacity="0.8"
          >
            <animate
              attributeName="opacity"
              values="0.3;1;0.3"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </circle>
          {/* Rim highlight */}
          <ellipse
            cx="100"
            cy="60"
            rx="20"
            ry="3"
            fill={`url(#trophyHighlight-${trophyId})`}
            opacity="0.8"
          />
        </svg>
      </span>
    );
  };

  if (authLoading || loading) {
    return (
      <ZeroGravityLoading
        title="Loading Leaderboard"
        subtitle="Fetching weekly leaderboard..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  if (error || !leaderboard) {
    return (
      <DashboardLayout>
        <div className="mt-2 space-y-3 md:space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
            <h1 className="text-xl md:text-2xl font-semibold text-black dark:text-white mb-2">
              Leaderboard Error
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error || "Failed to load leaderboard."}
            </p>
            <button
              onClick={fetchLeaderboard}
              className="mt-4 px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mt-4 space-y-3 md:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-xl md:text-3xl font-light text-black dark:text-white">
              Weekly Leaderboard ({formatStartingDate(leaderboard.weekStart)})
            </h1>
            <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
              {formatDateRange(leaderboard.weekStart, leaderboard.weekEnd)}
            </p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="mt-12 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full ">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-2 sm:px-16 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Streak
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {leaderboard.entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                    >
                      No entries yet for this week
                    </td>
                  </tr>
                ) : (
                  leaderboard.entries.map((entry) => {
                    // Determine background color based on rank (only for top 3)
                    let rowBgClass = "";
                    let rewardPoints = null;

                    if (entry.rank === 1) {
                      rowBgClass =
                        "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-l-4 border-yellow-500 dark:border-yellow-400";
                      rewardPoints = 1000;
                    } else if (entry.rank === 2) {
                      rowBgClass =
                        "bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 border-l-4 border-gray-400 dark:border-gray-500";
                      rewardPoints = 500;
                    } else if (entry.rank === 3) {
                      rowBgClass =
                        "bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-l-4 border-orange-600 dark:border-orange-500";
                      rewardPoints = 250;
                    } else {
                      // No special background for ranks 4 and below - matches page background
                      rowBgClass = "bg-white dark:bg-gray-800";
                    }

                    return (
                      <tr
                        key={entry.userId}
                        className={`${rowBgClass} hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer`}
                        onClick={() => {
                          if (entry.user) {
                            router.push(`/profile/${entry.user.userId}`);
                          }
                        }}
                      >
                        <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-3 sm:py-6 whitespace-nowrap text-center">
                          <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                            #{entry.rank}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 text-left">
                          {entry.user ? (
                            <div className="flex items-center justify-around gap-8 sm:gap-0">
                              <div className="flex items-center gap-6 sm:gap-8 flex-shrink-0">
                                <div
                                  className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${getAnimationClass(
                                    entry.user.equippedBorder || ""
                                  )}`}
                                  style={getBorderStyle(
                                    entry.user.equippedBorder || "default",
                                    56
                                  )}
                                >
                                  {entry.user.profilePicture ? (
                                    <Image
                                      src={entry.user.profilePicture}
                                      alt={`${entry.user.firstName} ${entry.user.lastName}`}
                                      width={56}
                                      height={56}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-xs sm:text-base font-light text-gray-400 dark:text-gray-500">
                                      {entry.user.firstName
                                        .charAt(0)
                                        .toUpperCase()}
                                      {entry.user.lastName
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-black dark:text-white truncate">
                                    {entry.user.firstName} {entry.user.lastName}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                    @{entry.user.username}
                                  </div>
                                </div>
                              </div>
                              {(entry.rank === 1 ||
                                entry.rank === 2 ||
                                entry.rank === 3) && (
                                <div className="flex-shrink-0">
                                  <TrophyIcon
                                    rank={entry.rank}
                                    userId={entry.userId}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              User not found
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-center">
                          <div className="text-xs sm:text-sm text-black dark:text-white">
                            {entry.user?.currentStreak || 0} days
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-center">
                          <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                            {(entry.points || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-3 sm:py-6 whitespace-nowrap text-center">
                          {rewardPoints ? (
                            <div className="text-xs sm:text-sm font-semibold text-green-600 dark:text-green-400">
                              +{rewardPoints.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
                              -
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Not Eligible Section */}
        {leaderboard.notEligibleEntries &&
          leaderboard.notEligibleEntries.length > 0 && (
            <div className="mt-8">
              <h2 className="mt-8 text-base sm:text-lg md:text-xl font-light text-black dark:text-white mb-3">
                Not Eligible
              </h2>
              <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Streak
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reward
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {leaderboard.notEligibleEntries.map((entry) => (
                        <tr
                          key={entry.userId}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                          onClick={() => {
                            if (entry.user) {
                              router.push(`/profile/${entry.user.userId}`);
                            }
                          }}
                        >
                          <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-3 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                              XX
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-6 text-left">
                            {entry.user ? (
                              <div className="flex items-center gap-6 sm:gap-8">
                                <div
                                  className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${getAnimationClass(
                                    entry.user.equippedBorder || ""
                                  )}`}
                                  style={getBorderStyle(
                                    entry.user.equippedBorder || "default",
                                    56
                                  )}
                                >
                                  {entry.user.profilePicture ? (
                                    <Image
                                      src={entry.user.profilePicture}
                                      alt={`${entry.user.firstName} ${entry.user.lastName}`}
                                      width={56}
                                      height={56}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-xs sm:text-base font-light text-gray-400 dark:text-gray-500">
                                      {entry.user.firstName
                                        .charAt(0)
                                        .toUpperCase()}
                                      {entry.user.lastName
                                        .charAt(0)
                                        .toUpperCase()}
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs sm:text-sm font-medium text-black dark:text-white truncate">
                                    {entry.user.firstName} {entry.user.lastName}
                                  </div>
                                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                    @{entry.user.username}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                User not found
                              </div>
                            )}
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm text-black dark:text-white">
                              {entry.user?.currentStreak || 0} days
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                              {(entry.points || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-3 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm font-semibold text-gray-400 dark:text-gray-600">
                              0
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
      </div>
    </DashboardLayout>
  );
}
