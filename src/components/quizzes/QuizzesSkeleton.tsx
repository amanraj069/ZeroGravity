"use client";

import React from "react";

export function QuizCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 shadow-sm p-3 sm:p-5 border border-gray-100 dark:border-gray-700"
        >
          {/* Header with Status + Title and Actions */}
          <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
            <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-1">
              <div className="shrink-0 h-5 sm:h-6 w-16 sm:w-20 bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-5 sm:h-6 w-full max-w-[200px] bg-gray-200 dark:bg-gray-700 animate-pulse" />
            </div>
            <div className="shrink-0 w-5 h-5 bg-gray-100 dark:bg-gray-700 animate-pulse" />
          </div>
          
          <div className="hidden sm:flex mb-3 justify-between items-center gap-2">
            <div className="h-3 w-32 bg-gray-50/50 dark:bg-gray-800/40 animate-pulse" />
            <div className="h-3 w-32 bg-gray-50/50 dark:bg-gray-800/40 animate-pulse" />
          </div>

          <div className="hidden sm:block mb-3 space-y-2">
            <div className="h-3.5 w-full bg-gray-50/50 dark:bg-gray-800/40 animate-pulse" />
            <div className="h-3.5 w-[85%] bg-gray-50/50 dark:bg-gray-800/40 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="h-5 sm:h-6 w-8 sm:w-10 mx-auto bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-3 w-14 sm:w-16 mx-auto bg-gray-50/50 dark:bg-gray-800/30 animate-pulse" />
            </div>
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="h-5 sm:h-6 w-8 sm:w-10 mx-auto bg-gray-100 dark:bg-gray-700 animate-pulse" />
              <div className="h-3 w-16 sm:w-20 mx-auto bg-gray-50/50 dark:bg-gray-800/30 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QuizzesSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
      <main className="flex-1 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header Skeleton */}
          <div className="mb-5 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  <div className="h-7 sm:h-9 w-40 sm:w-56 bg-gray-200 dark:bg-gray-800 animate-pulse shadow-sm" />
                </div>
                {/* Mobile icon actions skeleton */}
                <div className="flex items-center gap-2 sm:hidden">
                  <div className="h-9 w-9 border border-gray-200 dark:border-gray-800 animate-pulse" />
                  <div className="h-9 w-9 bg-black dark:bg-white/20 animate-pulse" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end sm:shrink-0">
                <div className="w-full sm:w-32 h-11 sm:h-12 border border-gray-200 dark:border-gray-800 animate-pulse" />
                <div className="hidden sm:block h-12 w-32 border border-gray-200 dark:border-gray-800 animate-pulse" />
                <div className="hidden sm:block h-12 w-40 bg-black dark:bg-white/20 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-4 sm:mb-6 h-11 sm:h-12 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 animate-pulse" />

          <QuizCardsSkeleton />
        </div>
      </main>
    </div>
  );
}

