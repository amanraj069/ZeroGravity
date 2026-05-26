"use client";

import React from "react";

export function QuizCardsSkeleton({ type = "hosted" }: { type?: "hosted" | "practice" }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 w-full">
      {/* Action Button Skeleton */}
      <div 
        className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-[#15151a]/40 p-8 rounded-xl"
        style={{ minHeight: "180px" }}
      >
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mb-3" />
        <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
      </div>

      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex flex-col bg-white dark:bg-[#15151a] shadow-sm p-5 sm:p-6 border border-gray-100 dark:border-gray-800 rounded-xl"
          style={{ minHeight: "180px" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-auto">
            <div className="h-6 sm:h-8 w-3/4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
            <div className="shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl mt-1" />
          </div>
          
          {type === "hosted" ? (
            <>
              {/* Hosted Quiz specific skeleton items */}
              <div className="flex mb-4 mt-2 items-center justify-between gap-2">
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-3 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              </div>
              <div className="hidden sm:block space-y-2 mb-3">
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              </div>
            </>
          ) : (
            <>
              {/* Practice Quiz specific skeleton items */}
              <div className="flex flex-row flex-wrap items-center gap-1.5 mt-3 mb-auto">
                <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
                <div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
              </div>
            </>
          )}

          {/* Bottom Stats */}
          <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="h-5 w-12 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              {type === "practice" && (
                <div className="h-5 w-16 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              )}
            </div>
            <div className="shrink-0 h-6 w-16 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function QuizzesSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent overflow-hidden">
      <main className="flex-1 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header Skeleton */}
          <div className="mb-5 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  <div className="h-7 sm:h-9 w-40 sm:w-56 bg-gray-200 dark:bg-gray-800 animate-pulse shadow-sm rounded-lg" />
                </div>
                {/* Mobile icon actions skeleton - Join button + trash icon */}
                <div className="flex items-center gap-2 sm:hidden">
                  <div className="h-7 w-16 bg-gray-900 dark:bg-white/20 animate-pulse rounded-lg" />
                  <div className="h-9 w-9 border border-gray-200 dark:border-gray-800 animate-pulse rounded-lg" />
                </div>
              </div>
              {/* Desktop actions skeleton */}
              <div className="hidden sm:flex flex-row gap-3 items-center justify-end shrink-0">
                <div className="h-11 w-28 bg-gray-900 dark:bg-white/20 animate-pulse rounded-xl" />
                <div className="h-11 w-24 border border-gray-200 dark:border-gray-800 animate-pulse rounded-xl" />
              </div>
            </div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="mb-4 sm:mb-6 h-11 sm:h-12 bg-gray-50/50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 animate-pulse rounded-lg" />

          <QuizCardsSkeleton />
        </div>
      </main>
    </div>
  );
}

