"use client";

import React from "react";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-3 md:space-y-4 pb-12 pt-2 lg:pt-4">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 lg:mb-6">
        <div className="flex items-center justify-between sm:justify-start sm:gap-3">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="sm:hidden h-8 w-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 sm:flex-none h-8 w-16 sm:w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          ))}
        </div>
      </div>

      {/* Top Sections Split Skeleton */}
      <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4">
        {/* Left Section (60%) */}
        <div className="w-full lg:w-[60%] border border-gray-200 dark:border-gray-800 p-3 md:p-5 bg-white dark:bg-gray-800 relative flex flex-col justify-center min-h-[160px] md:min-h-[200px]">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 w-full h-full relative">
            <div className="flex flex-row items-center gap-3 lg:gap-6 w-full sm:w-auto mt-1 sm:mt-0">
              {/* Profile Picture Skeleton */}
              <div className="w-24 h-24 md:w-32 lg:w-40 md:h-32 lg:h-40 bg-gray-200 dark:bg-gray-700 flex-shrink-0 animate-pulse" />
              
              {/* Name and Username Skeleton */}
              <div className="flex-1 min-w-0 flex flex-col justify-center gap-3">
                <div className="space-y-2">
                  <div className="h-7 md:h-8 w-[70%] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800/80 rounded animate-pulse" />
                </div>
                <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                
                {/* Stats Skeleton */}
                <div className="hidden sm:flex items-center gap-4 mt-3">
                  <div className="h-14 w-28 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 rounded animate-pulse" />
                  <div className="h-14 w-28 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/30 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section (40%) */}
        <div className="w-full lg:w-[40%] flex flex-col gap-3 md:gap-4">
          {/* Badges Strip Skeleton */}
          <div className="flex-1 border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-800/60 min-h-[120px] flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2 w-full">
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-2 w-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
            </div>
            <div className="flex items-stretch gap-2 h-full">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex-1 min-h-[90px] sm:min-h-[110px] md:min-h-[120px] bg-gray-100 dark:bg-[#050710] border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>

          {/* Streaks Skeleton */}
          <div className="grid grid-cols-2 gap-3">
            <div className="h-16 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-none animate-pulse" />
            <div className="h-16 bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-none animate-pulse" />
          </div>
        </div>
      </div>

      {/* Activity Graph Skeleton */}
      <div className="border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800/40 min-h-[150px]">
        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6 animate-pulse" />
        <div className="w-full h-24 bg-gray-50/50 dark:bg-gray-900/50 rounded animate-pulse" />
      </div>

      {/* Profile Details Card Skeleton */}
      <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 w-48 bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="h-5 w-full bg-gray-100 dark:bg-gray-700/50 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
