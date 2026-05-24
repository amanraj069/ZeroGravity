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
        <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg">
          <div className="flex h-12">
            <div className={`flex-1 flex items-center justify-center bg-white dark:bg-gray-800 border-b-2 ${mode === 'daily' ? 'border-black dark:border-white' : 'border-transparent'} animate-pulse`}>
              <div className="h-4 w-20 sm:w-24 bg-gray-100 dark:bg-gray-700/50" />
            </div>
            <div className={`flex-1 flex items-center justify-center bg-white dark:bg-gray-800 border-b-2 ${mode === 'goals' ? 'border-black dark:border-white' : 'border-transparent'} animate-pulse`}>
              <div className="h-4 w-12 sm:w-16 bg-gray-50/50 dark:bg-gray-800/50" />
            </div>
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
            {/* AI Planner Button with Glow - Only for Daily mode */}
            {mode === 'daily' && (
              <div className="hidden sm:block relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
                <div className="relative h-9 sm:h-10 w-24 sm:w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse rounded-lg" />
              </div>
            )}
            <div className="h-9 sm:h-10 w-20 sm:w-28 bg-black dark:bg-white animate-pulse rounded-lg" />
          </div>
        </div>
      </div>

      {mode === 'daily' ? (
        /* Date Selector Skeleton (Daily Tasks) */
        <div className="bg-white dark:bg-gray-800 p-4 shadow-sm mt-2 sm:mt-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative sm:hidden flex-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
                <div className="relative h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse rounded-lg" />
              </div>
              <div className="h-10 flex-1 sm:flex-none sm:w-48 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse rounded-lg" />
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
          <div className="flex items-center bg-white dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
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
          <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800/50 flex items-start gap-3 sm:gap-4 animate-pulse min-h-[90px] sm:min-h-[110px] rounded-xl">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 dark:border-gray-600 shrink-0 mt-0.5 rounded-md" />
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="h-4 sm:h-5 w-[60%] sm:w-[40%] bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 sm:h-4 w-[90%] sm:w-[85%] bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-3 sm:h-3.5 w-20 sm:w-24 bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                  <div className="h-4 sm:h-5 w-12 sm:w-20 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 animate-pulse rounded-full" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 animate-pulse rounded-lg" />
                  <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 animate-pulse rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

