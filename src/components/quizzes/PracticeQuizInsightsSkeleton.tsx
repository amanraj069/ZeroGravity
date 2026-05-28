"use client";

import React from "react";
import { BackButton } from "@/components/BackButton";

export function PracticeQuizInsightsSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Skeleton */}
          <div className="mb-2 sm:mb-8 flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[200px] order-1">
              <BackButton href="/dashboard/quizzes" />
              <div>
                <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0.5 sm:mb-1">
                  Quiz Insights
                </h1>
                <div className="h-4 sm:h-5 w-32 sm:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mt-1" />
              </div>
            </div>

            <div className="shrink-0 order-2 sm:order-3 self-start sm:self-auto mt-0.5 sm:mt-0">
              <div className="h-9 sm:h-[42px] w-36 sm:w-44 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
            </div>
            
            {/* Trials Tab Skeleton */}
            <div className="order-3 sm:order-2 flex bg-gray-200/50 dark:bg-[#15151a] p-1.5 rounded-xl shadow-inner border border-gray-200/50 dark:border-gray-800/50 flex-1 sm:flex-none w-full sm:w-auto mt-1 sm:mt-0">
               <div className="flex gap-1 w-full">
                  <div className="h-7 sm:h-9 w-20 sm:w-24 bg-white dark:bg-gray-800 animate-pulse rounded-xl shadow-sm" />
                  <div className="h-7 sm:h-9 w-20 sm:w-24 bg-transparent animate-pulse rounded-xl" />
               </div>
            </div>
          </div>

          <div className="space-y-3 sm:space-y-8">
            {/* Analytics Dashboard Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-6">
              
              <div className="md:col-span-2 grid grid-cols-[40%_60%] md:grid-cols-2 gap-0 md:gap-6 bg-white dark:bg-[#15151a] md:bg-transparent md:dark:bg-transparent rounded-xl border border-gray-100 dark:border-gray-800 md:border-none shadow-sm md:shadow-none p-4 sm:p-5 md:p-0">
                {/* Main Stats Card Skeleton */}
                <div className="flex flex-col justify-center pr-3 sm:pr-4 border-r border-gray-100 dark:border-gray-800 md:border-none md:bg-white md:dark:bg-[#15151a] md:rounded-xl md:p-6 md:px-6 md:border md:dark:border-gray-800 md:shadow-sm md:h-full md:justify-between">
                  <div className="hidden md:block">
                    <div className="h-6 w-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-2" />
                    <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse rounded mb-0 sm:mb-8" />
                  </div>
                  <div className="flex flex-col gap-4 mt-0 md:mt-8 h-full md:h-auto justify-center">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-2 md:mb-0" />
                      <div className="flex items-baseline gap-1 mt-auto md:mt-0">
                        <div className="h-8 sm:h-10 w-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                        <div className="h-4 sm:h-6 w-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="flex flex-col pt-4 border-t border-gray-100 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-2 md:mb-0" />
                      <div className="flex items-baseline gap-1 mt-auto md:mt-0">
                        <div className="h-8 sm:h-10 w-10 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                        <div className="h-4 sm:h-6 w-8 bg-gray-100 dark:bg-gray-800 animate-pulse rounded ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accuracy Chart Skeleton */}
                <div className="flex flex-col items-center justify-center pl-2 sm:pl-4 md:bg-white md:dark:bg-[#15151a] md:rounded-xl md:p-6 md:px-6 md:border md:dark:border-gray-800 md:shadow-sm md:min-h-[280px]">
                  <div className="hidden md:block h-6 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-full mb-4 self-start" />
                  <div className="w-full min-h-[140px] md:h-full md:min-h-[180px] flex items-center justify-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[16px] border-gray-100 dark:border-gray-800 animate-pulse" />
                  </div>
                  <div className="flex gap-2 sm:gap-4 justify-between md:justify-center w-full md:w-auto mt-2 px-1 md:px-0">
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  </div>
                </div>
              </div>

              {/* Progression Chart Skeleton */}
              <div className="bg-white dark:bg-[#15151a] rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px]">
                <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded w-full mb-4 self-start" />
                <div className="w-full h-full min-h-[160px] sm:min-h-[180px] bg-gray-50 dark:bg-[#1c1c21] rounded-lg animate-pulse" />
              </div>
            </div>

            {/* Detailed Breakdown Skeleton */}
            <div className="space-y-3 sm:space-y-8 pt-4 pb-4 sm:pb-16">
              <div className="h-7 w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-4 px-2" />
              
              {[1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-[#15151a] rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="w-full p-4 sm:p-6 flex items-start sm:items-center justify-between gap-4 text-left">
                    <div className="flex items-start gap-4 w-full">
                      <div className="mt-1 sm:mt-0 shrink-0">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
                      </div>
                      <div className="w-full">
                        <div className="h-3 sm:h-4 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-2" />
                        <div className="h-4 sm:h-5 w-3/4 sm:w-full max-w-2xl bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
