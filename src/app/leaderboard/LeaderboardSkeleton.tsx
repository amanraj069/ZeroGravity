import React from "react";
import { DashboardLayout } from "@/components/dashboard";
import { BackButton } from "@/components/BackButton";

export default function LeaderboardSkeleton() {
  return (
    <DashboardLayout>
      <div className="relative mt-4 mb-12 space-y-4 sm:space-y-8">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-blue-500/[0.02] dark:bg-blue-900/[0.03] rounded-full blur-[100px]" />
        </div>

        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-6">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white leading-none tracking-tight">
              Leader<span className="font-normal italic">board</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap mt-2 sm:mt-0">
            <div className="flex items-center gap-2 px-2 py-1 bg-black/5 dark:bg-white/5 rounded-sm h-6 sm:h-8 w-48 sm:w-64 animate-pulse" />
          </div>
        </div>

        {/* Leaderboard Table Skeleton */}
        <div className="relative group">
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
                  {[1, 2, 3, 4, 5].map((index) => {
                    const rowBgClass = "bg-transparent";

                    return (
                      <tr
                        key={index}
                        className={`${rowBgClass} transition-all duration-200 border-l-[3px] border-transparent`}
                      >
                        <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            <div className="h-4 w-6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                          </div>
                        </td>
                        <td className="pl-2 pr-3 sm:pl-6 sm:pr-0 py-2.5 sm:py-6 text-left">
                          <div className="flex items-center gap-3 sm:gap-8">
                            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse flex-shrink-0" />
                            <div className="min-w-0 space-y-2">
                              <div className="h-3.5 w-24 sm:w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                              <div className="h-2.5 w-16 sm:w-20 bg-gray-100 dark:bg-gray-800/60 rounded animate-pulse" />
                            </div>
                          </div>
                        </td>
                        <td className="w-12 sm:w-14 p-0 text-center align-middle">
                          {(index === 1 || index === 2 || index === 3) && (
                            <div className="flex items-center justify-center">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            <div className="h-3.5 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-2.5 sm:py-6 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                          </div>
                        </td>
                        <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2.5 sm:py-6 whitespace-nowrap text-center">
                          <div className="flex justify-center">
                            {index <= 3 ? (
                              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                            ) : (
                              <div className="h-4 w-4 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
