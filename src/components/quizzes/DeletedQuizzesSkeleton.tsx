"use client";

import React from "react";

export function DeletedQuizCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex flex-col bg-white dark:bg-[#15151a] shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-xl"
          style={{ minHeight: "180px" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-auto">
            {/* Title */}
            <div className="h-6 sm:h-8 w-3/4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
            {/* Icons (Restore, Delete) */}
            <div className="flex items-center gap-3">
              <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full sm:rounded-xl mt-1" />
              <div className="shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-full sm:rounded-xl mt-1" />
            </div>
          </div>
          
          {/* Categories */}
          <div className="flex flex-row flex-wrap items-center gap-1.5 mt-3 mb-auto">
            <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
            <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
          </div>

          {/* Bottom Stats */}
          <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            </div>
            {/* Status Badge */}
            <div className="shrink-0 h-6 w-16 bg-red-100 dark:bg-red-900/20 animate-pulse rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DeletedQuizzesSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent overflow-hidden">
      <main className="flex-1 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header Skeleton */}
          <div className="mb-5 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-7 sm:h-9 w-24 sm:w-32 bg-gray-200 dark:bg-gray-800 animate-pulse shadow-sm rounded-lg" />
              </div>
            </div>
          </div>

          {/* Tab Bar and Search Bar Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
             {/* Capsule Tabs */}
             <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 w-full sm:flex-[3] overflow-hidden">
                <div className="flex-1 relative px-5 py-2 sm:px-8 sm:py-2.5 rounded-xl">
                  <div className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-xl" />
                  <div className="relative h-4 w-28 mx-auto bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
                <div className="flex-1 flex items-center justify-center px-5 py-2 sm:px-8 sm:py-2.5 rounded-xl">
                  <div className="h-4 w-24 bg-gray-200/60 dark:bg-gray-800/60 animate-pulse rounded" />
                </div>
             </div>
             {/* Search Bar */}
             <div className="relative w-full sm:flex-[2] flex">
               <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10">
                 <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse" />
               </div>
               <div className="w-full flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15151a] rounded-2xl shadow-sm min-h-[48px] sm:min-h-0 sm:h-full flex items-center pl-10 pr-4">
                 <div className="h-4 w-48 bg-gray-200/60 dark:bg-gray-800/60 animate-pulse rounded" />
               </div>
             </div>
          </div>

          <DeletedQuizCardsSkeleton />
        </div>
      </main>
    </div>
  );
}
