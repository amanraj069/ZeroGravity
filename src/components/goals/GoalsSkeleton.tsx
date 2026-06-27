"use client";

import React from "react";

export default function GoalsSkeleton({ 
  includeTabs = true,
  mode = 'daily'
}: { 
  includeTabs?: boolean;
  mode?: 'daily' | 'goals';
}) {
  return (
    <div className={`${includeTabs ? "max-w-6xl mx-auto px-4 py-3 sm:py-6" : ""} space-y-2 sm:space-y-6`}>
      {/* Main Navigation Tabs Skeleton */}
      {includeTabs && (
        <div className="flex bg-gray-100/50 dark:bg-[#12121a]/80 p-1 rounded-xl border border-gray-200/50 dark:border-gray-800/50 relative overflow-hidden backdrop-blur-sm w-full">
          <div className={`flex-1 py-2 sm:py-2.5 flex items-center justify-center rounded-lg ${mode === 'daily' ? 'bg-gray-200 dark:bg-[#1e1e24] shadow-sm' : 'bg-transparent'} animate-pulse`}>
            <div className={`h-4 w-20 sm:w-24 ${mode === 'daily' ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-300 dark:bg-gray-700/50'} rounded`} />
          </div>
          <div className={`flex-1 py-2 sm:py-2.5 flex items-center justify-center rounded-lg ${mode === 'goals' ? 'bg-gray-200 dark:bg-[#1e1e24] shadow-sm' : 'bg-transparent'} animate-pulse`}>
            <div className={`h-4 w-12 sm:w-16 ${mode === 'goals' ? 'bg-gray-400 dark:bg-gray-500' : 'bg-gray-300 dark:bg-gray-700/50'} rounded`} />
          </div>
        </div>
      )}

      {/* Header Section Skeleton */}
      <div className="bg-white dark:bg-gray-800 p-3 lg:p-4 shadow-sm rounded-lg">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-6 sm:h-7 w-28 sm:w-36 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Give Quiz Button with Glow - Only for Daily mode */}
            {mode === 'daily' && (
              <div className="hidden sm:block relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
                <div className="relative h-9 sm:h-10 w-28 sm:w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse rounded-lg" />
              </div>
            )}
            {/* AI Planner Button with Glow - Only for Daily mode */}
            {mode === 'daily' && (
              <div className="hidden sm:block relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
                <div className="relative h-9 sm:h-10 w-24 sm:w-32 bg-black dark:bg-white animate-pulse rounded-lg" />
              </div>
            )}
            {/* Add Task Button Skeleton */}
            <div className="h-9 sm:h-10 w-[110px] sm:w-[120px] bg-transparent border border-gray-200 dark:border-gray-700 animate-pulse rounded-lg" />
          </div>
        </div>
      </div>

      {mode === 'daily' ? (
        /* Date Selector Skeleton (Daily Tasks) */
        <div className="bg-white dark:bg-gray-800 p-4 shadow-sm mt-2 sm:mt-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Mobile Give Quiz Skeleton */}
              <div className="relative sm:hidden shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
                <div className="relative w-[38px] h-[38px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse rounded-lg" />
              </div>
              {/* Mobile AI Planner Skeleton */}
              <div className="relative sm:hidden flex-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
                <div className="relative h-[38px] bg-black dark:bg-white border border-gray-200 dark:border-gray-700 animate-pulse rounded-lg" />
              </div>
              {/* Date Picker Skeleton */}
              <div className="h-[38px] flex-1 sm:flex-none sm:w-48 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse rounded-lg" />
            </div>
            <div className="flex-1 flex gap-1.5 sm:gap-2 overflow-hidden pb-1">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className={`flex-1 min-w-0 sm:min-w-[100px] h-10 ${
                    i === 1
                      ? "bg-gray-100/80 dark:bg-gray-700/50 border-b-2 border-black dark:border-white"
                      : "bg-white dark:bg-gray-800 border-b-2 border-transparent"
                  } animate-pulse`}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Filter Tabs Skeleton (Goals) */
        <div className="bg-white dark:bg-gray-800 p-0 shadow-sm mt-2 sm:mt-4 rounded-lg overflow-hidden">
          <div className="flex items-center bg-transparent/50 border-b border-gray-100 dark:border-gray-800">
            {[1, 2, 3, 4, 5].map((i) => (
              <div 
                key={i} 
                className={`flex-1 h-12 flex items-center justify-center border-b-2 ${i === 1 ? 'border-black dark:border-white bg-gray-50/50 dark:bg-gray-800/30' : 'border-transparent'} animate-pulse`}
              >
                <div className="h-3 w-12 sm:w-16 bg-gray-200 dark:bg-gray-700/60" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List Skeleton */}
      <div className="space-y-2 sm:space-y-4 mt-2 sm:mt-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800/50 flex items-stretch gap-3 sm:gap-4 animate-pulse min-h-[90px] sm:min-h-[110px] rounded-xl relative">
            <div className="flex flex-col justify-between items-center shrink-0">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 dark:border-gray-600 mt-0.5 rounded-md animate-pulse" />
              {/* Mobile Edit/Delete Buttons Skeleton */}
              <div className="md:hidden flex flex-col gap-1 mt-auto pb-0.5">
                <div className="w-7 h-7 bg-gray-50/50 dark:bg-gray-800/40 rounded-md animate-pulse" />
                <div className="w-7 h-7 bg-gray-50/50 dark:bg-gray-800/40 rounded-md animate-pulse" />
              </div>
            </div>
            <div className="flex-1 space-y-3 sm:space-y-4 py-0.5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 sm:space-y-2.5 flex-1 min-w-0">
                  <div className="h-3.5 sm:h-5 w-[60%] sm:w-[40%] bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                  <div className="space-y-1 sm:space-y-1.5 mt-1">
                    <div className="h-2.5 sm:h-4 w-[90%] sm:w-[85%] bg-gray-100 dark:bg-gray-800/60 animate-pulse rounded" />
                    <div className="h-2.5 sm:h-4 w-[75%] sm:w-[65%] bg-gray-100 dark:bg-gray-800/60 animate-pulse rounded" />
                  </div>
                </div>
                {/* Desktop Edit/Delete Buttons Skeleton */}
                <div className="hidden md:flex items-center gap-1 ml-2 shrink-0">
                  <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg animate-pulse" />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-3 sm:h-3.5 w-32 sm:w-40 bg-gray-100 dark:bg-gray-800/50 animate-pulse rounded" />
                  <div className="absolute bottom-4 right-4 md:static md:bottom-auto md:right-auto h-4 sm:h-5 w-14 sm:w-20 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 animate-pulse rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

