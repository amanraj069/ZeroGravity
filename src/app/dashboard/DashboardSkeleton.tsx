"use client";

import React from "react";

export default function DashboardSkeleton() {
  return (
    <div className="relative mt-2 mb-24">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-black/5 dark:border-white/5 mb-5 space-x-2">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-10 sm:h-12 md:h-14 w-48 sm:w-64 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Points Skeleton */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 border-r border-black/10 dark:border-white/10">
            <div className="h-7 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-3 w-6 bg-gray-100 dark:bg-gray-800/50 rounded animate-pulse" />
          </div>
          <div className="flex sm:hidden items-center gap-1 px-2 border-r border-black/10 dark:border-white/10">
            <div className="h-5 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          {/* Shop Button Skeleton */}
          <div className="h-8 sm:h-9 w-16 sm:w-20 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>

      {/* Navigation Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] px-4 py-4 md:px-6 md:py-5 rounded-lg flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-4">
              <div className="h-12 w-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="space-y-2">
                <div className="h-5 w-32 sm:w-40 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-40 sm:w-56 bg-gray-100 dark:bg-gray-800/50 rounded" />
              </div>
            </div>
            <div className="h-8 w-8 sm:h-10 sm:w-10 border border-gray-200 dark:border-gray-800 rounded-full bg-gray-50 dark:bg-white/5" />
          </div>
        ))}
      </div>

      {/* Students Hub Skeleton */}
      <div className="w-full border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-[#050710] py-6 sm:py-10 px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse">
        <div className="text-center md:text-left space-y-3 w-full md:w-2/3">
          <div className="h-8 sm:h-12 w-48 sm:w-72 bg-gray-200 dark:bg-gray-800 rounded mx-auto md:mx-0" />
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-gray-100 dark:bg-gray-800/50 rounded" />
            <div className="h-3.5 w-[85%] bg-gray-100 dark:bg-gray-800/50 rounded mx-auto md:mx-0" />
          </div>
        </div>
        <div className="flex flex-row md:flex-col items-center md:items-end gap-4 sm:gap-6">
          <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gray-200 dark:bg-gray-800 rounded-lg sm:rounded-full" />
          <div className="h-3 w-20 bg-gray-100 dark:bg-gray-800/50 rounded" />
        </div>
      </div>
    </div>
  );
}
