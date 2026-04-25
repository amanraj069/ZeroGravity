"use client";

import React from "react";

export default function GoalsSkeleton({ includeTabs = true }: { includeTabs?: boolean }) {
  return (
    <div className={`${includeTabs ? "max-w-6xl mx-auto px-4 py-3 sm:py-6" : ""} space-y-2 sm:space-y-6`}>
      {/* Main Navigation Tabs Skeleton */}
      {includeTabs && (
        <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden mb-1">
          <div className="flex h-12">
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 border-b-2 border-black dark:border-white animate-pulse">
              <div className="h-4 w-20 sm:w-24 bg-gray-100 dark:bg-gray-700/50" />
            </div>
            <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-800 border-b-2 border-transparent animate-pulse">
              <div className="h-4 w-12 sm:w-16 bg-gray-50/50 dark:bg-gray-800/50" />
            </div>
          </div>
        </div>
      )}

      {/* Header Section Skeleton */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-0">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="h-7 sm:h-8 w-32 sm:w-40 bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            {/* Desktop Stats dots skeleton */}
            <div className="hidden md:flex items-center gap-2">
              <div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <span className="text-gray-300 dark:text-gray-700 select-none">•</span>
              <div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 animate-pulse" />
              <span className="text-gray-300 dark:text-gray-700 select-none">•</span>
              <div className="h-5 w-28 bg-gray-100 dark:bg-gray-800 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* AI Planner Button with Glow - Hidden on mobile header, moves to date selector */}
            <div className="hidden sm:block relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
              <div className="relative h-9 sm:h-10 w-24 sm:w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse" />
            </div>
            <div className="h-9 sm:h-10 w-20 sm:w-28 bg-black dark:bg-white animate-pulse" />
          </div>
        </div>
        {/* Mobile Stats skeleton */}
        <div className="flex md:hidden items-center gap-1.5 mt-2">
          <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <span className="text-gray-400 dark:text-gray-600 text-[10px]">•</span>
          <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <span className="text-gray-400 dark:text-gray-600 text-[10px]">•</span>
          <div className="h-3 w-16 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>

      {/* Date Selector Skeleton */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm mt-2 sm:mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Mobile-only AI Planner Button skeleton */}
            <div className="relative sm:hidden flex-1">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur animate-pulse" />
              <div className="relative h-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse" />
            </div>
            <div className="h-10 flex-1 sm:flex-none sm:w-48 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse" />
          </div>
          {/* Upcoming Days - horizontal scrollable slots */}
          <div className="flex-1 flex gap-2 overflow-hidden pb-1">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className={`flex-1 min-w-[70px] sm:min-w-[100px] h-10 bg-white dark:bg-gray-800 border-b-2 ${i === 1 ? 'border-black dark:border-white' : 'border-transparent'} animate-pulse`} />
            ))}
          </div>
        </div>
      </div>

      {/* Tasks List Skeleton */}
      <div className="space-y-2 sm:space-y-4 mt-2 sm:mt-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800/50 flex items-start gap-3 sm:gap-4 animate-pulse min-h-[90px] sm:min-h-[110px]">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 dark:border-gray-600 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="space-y-2 sm:space-y-2.5">
                <div className="h-4 sm:h-5 w-[60%] sm:w-[40%] bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="h-3 sm:h-4 w-[90%] sm:w-[85%] bg-gray-100 dark:bg-gray-800/60 animate-pulse" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-3 sm:h-3.5 w-20 sm:w-24 bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
                  <div className="h-4 sm:h-5 w-12 sm:w-20 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 animate-pulse" />
                </div>
                <div className="flex gap-1.5">
                  <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 animate-pulse" />
                  <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
