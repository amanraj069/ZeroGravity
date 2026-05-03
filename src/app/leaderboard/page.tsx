"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  leaderboardService,
  LeaderboardEntry,
} from "@/services/leaderboardService";
import { BackButton } from "@/components/BackButton";
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

  // Generate random stars for background atmosphere
  const stars = useMemo(() => {
    return Array.from({ length: 30 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 5,
    }));
  }, []);

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
        err instanceof Error ? err.message : "Failed to load leaderboard",
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
      return date.toLocaleDateString("en-US", dateOptions);
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
          className="w-10 h-10 sm:w-14 sm:h-14 pr-3"
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
      <div className="relative mt-4 mb-12 space-y-4 sm:space-y-8">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-blue-500/[0.02] dark:bg-blue-900/[0.03] rounded-full blur-[100px]" />

          {/* Subtle Stars in Dark Mode */}
          <div className="hidden dark:block absolute inset-0">
            {stars.map((star, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [star.opacity, star.opacity * 2, star.opacity],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: star.delay,
                }}
                className="absolute bg-white rounded-full"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                }}
              />
            ))}
          </div>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6"
        >
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white leading-none tracking-tight">
              Leader<span className="font-normal italic">board</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap mt-2 sm:mt-0">
            <div className="flex items-center gap-2 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-sm">
              <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-light whitespace-nowrap">
                Weekly: {formatStartingDate(leaderboard.weekStart)}
              </p>
              <div className="w-px h-3 bg-gray-300 dark:bg-white/10" />
              <p className="text-[9px] sm:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">
                {formatDateRange(leaderboard.weekStart, leaderboard.weekEnd)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Leaderboard Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative group "
        >
          {/* Glass Card Container */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
          <div className="relative border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#050710]/80 backdrop-blur-xl shadow-sm dark:shadow-[0_12px_25px_rgba(0,0,0,0.45)] overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                    <th className="pl-4 sm:pl-10 pr-2 py-3 sm:py-4 text-center text-[9px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                      Rank
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-[9px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                      Competitor
                    </th>
                    <th className="w-8 sm:w-12 p-0"></th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-[9px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                      Streak
                    </th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-[9px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                      Points
                    </th>
                    <th className="pl-2 pr-4 sm:pr-10 py-3 sm:py-4 text-center text-[9px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                      Reward
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {leaderboard.entries.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
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
                          "bg-gradient-to-r from-yellow-500/10 to-transparent dark:from-yellow-400/10 dark:to-transparent border-l-4 border-yellow-500 underline-offset-4";
                        rewardPoints = 1000;
                      } else if (entry.rank === 2) {
                        rowBgClass =
                          "bg-gradient-to-r from-gray-400/10 to-transparent dark:from-gray-400/10 dark:to-transparent border-l-4 border-gray-400";
                        rewardPoints = 500;
                      } else if (entry.rank === 3) {
                        rowBgClass =
                          "bg-gradient-to-r from-orange-600/10 to-transparent dark:from-orange-500/10 dark:to-transparent border-l-4 border-orange-600";
                        rewardPoints = 250;
                      } else {
                        // No special background for ranks 4 and below
                        rowBgClass = "bg-transparent";
                      }
                      return (
                        <motion.tr
                          key={entry.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + (entry.rank || 0) * 0.05 }}
                          whileHover={{
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                          }}
                          className={`${rowBgClass} transition-all duration-200 cursor-pointer border-l-[3px] border-transparent hover:border-purple-500/50`}
                          onClick={() => {
                            if (entry.user) {
                              router.push(`/profile/${entry.user.userId}`);
                            }
                          }}
                        >
                          <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-[10px] sm:text-sm font-semibold text-black dark:text-white">
                              #{entry.rank}
                            </div>
                          </td>
                          <td className="pl-2 pr-3 sm:pl-6 sm:pr-0 py-2.5 sm:py-6 text-left">
                            {entry.user ? (
                              <div className="flex items-center gap-3 sm:gap-8">
                                <div
                                  className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${getAnimationClass(
                                    entry.user.equippedBorder || "",
                                  )}`}
                                  style={getBorderStyle(
                                    entry.user.equippedBorder || "default",
                                    56,
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
                          <td className="w-12 sm:w-14 p-0 text-center align-middle">
                            {(entry.rank === 1 ||
                              entry.rank === 2 ||
                              entry.rank === 3) && (
                              <div className="flex items-center justify-center">
                                <TrophyIcon
                                  rank={entry.rank}
                                  userId={entry.userId}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-2 sm:px-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm text-black dark:text-white">
                              {entry.user?.currentStreak || 0}{" "}
                              {(entry.user?.currentStreak || 0) === 0 ||
                              (entry.user?.currentStreak || 0) === 1
                                ? "day"
                                : "days"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                              {(entry.points || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            {rewardPoints ? (
                              <div className="flex flex-col items-center">
                                <div className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                                  +{rewardPoints.toLocaleString()}
                                </div>
                                <div className="text-[8px] uppercase tracking-tighter opacity-50">
                                  Points
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs sm:text-sm text-gray-400 dark:text-gray-600">
                                -
                              </div>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Not Eligible Section */}
        {leaderboard.notEligibleEntries &&
          leaderboard.notEligibleEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 pb-12"
            >
              <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white my-6 tracking-tight">
                Not <span className="font-normal italic">Eligible</span>
              </h2>
              <div className="border border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-[#050710]/80 backdrop-blur-xl shadow-sm overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                        <th className="pl-6 sm:pl-10 pr-2 py-4 text-center text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          Rank
                        </th>
                        <th className="px-6 py-4 text-left text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          Competitor
                        </th>
                        <th className="w-12 p-0"></th>
                        <th className="px-6 py-4 text-center text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          Streak
                        </th>
                        <th className="px-6 py-4 text-center text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          Points
                        </th>
                        <th className="pl-6 pr-10 py-4 text-center text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                          Reward
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {leaderboard.notEligibleEntries.map((entry) => (
                        <motion.tr
                          key={entry.userId}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            delay: 0.9 + leaderboard.entries.length * 0.05,
                          }}
                          whileHover={{
                            backgroundColor: "rgba(255, 255, 255, 0.03)",
                          }}
                          className="bg-transparent hover:bg-gray-50/5 dark:hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
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
                          <td className="pl-2 pr-3 sm:pl-6 sm:pr-0 py-2.5 sm:py-6 text-left">
                            {entry.user ? (
                              <div className="flex items-center gap-3 sm:gap-8">
                                <div
                                  className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${getAnimationClass(
                                    entry.user.equippedBorder || "",
                                  )}`}
                                  style={getBorderStyle(
                                    entry.user.equippedBorder || "default",
                                    56,
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
                          <td className="w-12 sm:w-14 p-0 text-center align-middle"></td>
                          <td className="px-2 sm:px-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm text-black dark:text-white">
                              {entry.user?.currentStreak || 0}{" "}
                              {(entry.user?.currentStreak || 0) === 0 ||
                              (entry.user?.currentStreak || 0) === 1
                                ? "day"
                                : "days"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                              {(entry.points || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2.5 sm:py-6 whitespace-nowrap text-center">
                            <div className="text-xs sm:text-sm font-semibold text-gray-400 dark:text-gray-600">
                              0
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
      </div>
    </DashboardLayout>
  );
}
