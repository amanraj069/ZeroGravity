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
                  <th className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Streak
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reward
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
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
                        <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-3 sm:py-6 whitespace-nowrap">
                          <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                            #{entry.rank}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6">
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
                        <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-black dark:text-white">
                            {entry.user?.currentStreak || 0} days
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                            {entry.user?.email || "N/A"}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-right">
                          <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                            {(entry.points || 0).toLocaleString()}
                          </div>
                        </td>
                        <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-3 sm:py-6 whitespace-nowrap text-right">
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
                        <th className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Streak
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-2 sm:px-6 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2 sm:py-3 text-right text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Reward
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {leaderboard.notEligibleEntries.map((entry) => (
                        <tr
                          key={entry.userId}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer opacity-60"
                          onClick={() => {
                            if (entry.user) {
                              router.push(`/profile/${entry.user.userId}`);
                            }
                          }}
                        >
                          <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-3 sm:py-6 whitespace-nowrap">
                            <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                              XX
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-6">
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
                          <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-black dark:text-white">
                              {entry.user?.currentStreak || 0} days
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap">
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                              {entry.user?.email || "N/A"}
                            </div>
                          </td>
                          <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-right">
                            <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                              {(entry.points || 0).toLocaleString()}
                            </div>
                          </td>
                          <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-3 sm:py-6 whitespace-nowrap text-right">
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
