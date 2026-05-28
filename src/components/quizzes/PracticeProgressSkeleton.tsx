"use client";

import React from "react";
import { BackButton } from "@/components/BackButton";

export function PracticeProgressSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent overflow-x-hidden">
      <main className="py-6 sm:py-10 px-4 max-w-6xl mx-auto w-full flex-1 flex flex-col">
        {/* Header Skeleton */}
        <div className="mb-3 sm:mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <BackButton href="/dashboard/quizzes" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0.5 sm:mb-1">
                Practice Progress
              </h1>
            </div>
          </div>

          {/* Categories Capsule Tabs Skeleton */}
          <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 w-full md:w-auto shrink-0 overflow-hidden relative z-0">
            {/* Active tab */}
            <div className="flex-1 relative px-5 py-2 sm:px-6 sm:py-2 rounded-xl">
              <div className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-xl" />
              <div className="relative h-4 w-16 sm:w-20 mx-auto bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
            </div>
            {/* Inactive tab */}
            <div className="flex-1 flex items-center justify-center px-5 py-2 sm:px-6 sm:py-2 rounded-xl">
              <div className="h-4 w-10 sm:w-14 bg-gray-200/50 dark:bg-gray-800/50 animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* AI Insights Section Skeleton */}
        <div className="bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-6 lg:p-8 mb-3 sm:mb-8">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="h-6 sm:h-7 w-48 sm:w-64 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
            <div className="hidden sm:block w-8 h-8 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Performance Summary Skeleton */}
            <div>
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-3" />
              <div className="space-y-2 mb-6 sm:mb-8">
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-4 w-4/6 bg-gray-100 dark:bg-gray-800 animate-pulse rounded hidden sm:block" />
                <div className="h-4 w-3/6 bg-gray-100 dark:bg-gray-800 animate-pulse rounded hidden sm:block" />
              </div>
              {/* "Improve this category" button skeleton */}
              <div className="h-10 w-48 bg-gray-900 dark:bg-gray-200 animate-pulse rounded-lg opacity-30" />
            </div>

            {/* Topic Mastery Skeleton */}
            <div>
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-4" />
              <div className="space-y-4">
                {[85, 65, 70, 50, 40].map((width, i) => (
                  <div key={i}>
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" style={{ width: `${120 + i * 20}px` }} />
                      <div className="h-4 w-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                    </div>
                    <div className="w-[85%] h-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-200 dark:bg-gray-700 animate-pulse rounded-full"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
          {/* Bar Chart Skeleton */}
          <div className="lg:col-span-3 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex flex-row items-center justify-between mb-4">
              <div className="h-5 sm:h-6 w-40 sm:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
              {/* Quiz filter tabs skeleton */}
              <div className="hidden sm:flex gap-1 bg-gray-100 dark:bg-[#1C1C22] p-1 rounded-lg">
                <div className="h-6 w-20 bg-white dark:bg-[#2C2C35] animate-pulse rounded-md shadow-sm" />
                <div className="h-6 w-14 bg-transparent rounded-md" />
                <div className="h-6 w-14 bg-transparent rounded-md" />
              </div>
              {/* Mobile dropdown skeleton */}
              <div className="block sm:hidden h-7 w-20 bg-gray-100 dark:bg-[#1C1C22] animate-pulse rounded-lg border border-gray-200 dark:border-white/10" />
            </div>
            <div className="h-[200px] w-full bg-gray-50 dark:bg-[#1C1C22] rounded-lg animate-pulse" />
          </div>

          {/* Category Stats Overview Skeleton */}
          <div className="lg:col-span-2 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5 flex flex-col">
            <div className="h-5 sm:h-6 w-32 sm:w-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-2 sm:mb-6" />
            <div className="flex-1 grid grid-rows-3 gap-2 sm:gap-4">
              {["Category Attempts", "Average Accuracy", "Topics Covered"].map((label) => (
                <div key={label} className="bg-gray-50 dark:bg-[#1C1C22] rounded-xl p-2 sm:p-4 flex items-center justify-between border border-gray-100 dark:border-white/5">
                  <div className="h-4 w-24 sm:w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  <div className="h-6 sm:h-8 w-10 sm:w-14 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          {/* Pie Chart Skeleton */}
          <div className="lg:col-span-2 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
            <div className="h-5 sm:h-6 w-40 sm:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-4" />
            <div className="h-[200px] w-full flex items-center justify-center">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[20px] border-gray-100 dark:border-[#1C1C22] animate-pulse" />
            </div>
          </div>

          {/* Line Chart Skeleton */}
          <div className="lg:col-span-3 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/5 rounded-2xl p-5">
            <div className="flex flex-row items-center justify-between mb-6">
              <div className="h-5 sm:h-6 w-40 sm:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
              <div className="hidden sm:flex gap-1 bg-gray-100 dark:bg-[#1C1C22] p-1 rounded-lg">
                <div className="h-6 w-20 bg-white dark:bg-[#2C2C35] animate-pulse rounded-md shadow-sm" />
                <div className="h-6 w-14 bg-transparent rounded-md" />
                <div className="h-6 w-14 bg-transparent rounded-md" />
              </div>
              <div className="block sm:hidden h-7 w-20 bg-gray-100 dark:bg-[#1C1C22] animate-pulse rounded-lg border border-gray-200 dark:border-white/10" />
            </div>
            <div className="h-[200px] w-full bg-gray-50 dark:bg-[#1C1C22] rounded-lg animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
