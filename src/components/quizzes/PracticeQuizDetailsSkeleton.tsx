"use client";

import React from "react";
import { BackButton } from "@/components/BackButton";

export function PracticeQuizDetailsSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header Skeleton */}
          <div className="mb-3 sm:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
            <div className="w-full">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="mt-1 sm:mt-0">
                  <BackButton href="/dashboard/quizzes" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0">
                        Quiz Details
                      </h1>
                      <div className="h-4 sm:h-5 w-32 sm:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse mt-2 mb-2 sm:mb-3 rounded" />
                    </div>
                    
                    <div className="md:hidden flex flex-col items-end gap-1.5 mt-1">
                      <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
                        <div className="h-4 w-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Buttons Skeleton */}
            <div className="flex flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto md:pt-2 sm:ml-[3.25rem] md:ml-0 mt-2 sm:mt-0">
              <div className="hidden md:flex items-center">
                <div className="h-9 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
              </div>
              <div className="flex-1 sm:flex-none h-[42px] sm:h-11 w-full sm:w-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
              <div className="flex-1 sm:flex-none h-[42px] sm:h-11 w-full sm:w-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="bg-white dark:bg-[#15151a] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col mb-8 sm:mb-12">
            <div className="p-5 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 sm:gap-8 sm:divide-x divide-gray-100 dark:divide-gray-800">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`flex flex-col gap-1 ${i === 1 ? 'sm:pr-8' : i === 2 ? 'sm:px-8' : i === 3 ? 'pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 sm:px-8' : 'pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 sm:pl-8'}`}>
                  <div className="flex items-center gap-2 mb-1 sm:mb-2">
                    <div className="w-4 h-4 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                  </div>
                  <div className="h-7 sm:h-8 w-12 sm:w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mt-1" />
                </div>
              ))}
            </div>

            {/* Bottom Details Footer Strip Skeleton */}
            <div className="hidden md:flex px-5 sm:px-8 py-4 sm:py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121216]/50 rounded-b-lg flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                  <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                </div>
              </div>
            </div>
          </div>

          {/* Attempt History Skeleton */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white tracking-tight leading-none mb-6">
              Attempt <span className="font-normal italic text-gray-300 dark:text-gray-700">History</span>
            </h2>
            <div className="bg-white dark:bg-[#15151a] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[1, 2].map((i) => (
                  <div key={i} className="p-4 sm:p-6 flex flex-row items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-3">
                        <div className="h-3 sm:h-4 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                        <div className="h-1 w-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
                        <div className="h-3 sm:h-4 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                      </div>
                      <div className="h-6 sm:h-8 w-24 sm:w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    </div>
                    
                    <div className="flex flex-col items-end sm:items-start">
                      <div className="h-2 sm:h-3 w-12 sm:w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-2" />
                      <div className="h-6 sm:h-8 w-12 sm:w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
