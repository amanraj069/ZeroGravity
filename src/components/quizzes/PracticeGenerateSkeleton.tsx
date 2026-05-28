"use client";

import React from "react";
import { BackButton } from "@/components/BackButton";

export function PracticeGenerateSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4 sm:mb-8">
            <BackButton href="/dashboard/quizzes" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white">
                Generate AI Quiz
              </h1>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter a topic to generate a personalized practice quiz.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121216] p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="space-y-5 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8">
                {/* Topic Skeleton */}
                <div className="md:col-span-2">
                  <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-2" />
                  <div className="w-full h-10 sm:h-12 bg-gray-50 dark:bg-gray-800/50 animate-pulse rounded-xl border border-gray-100 dark:border-gray-800" />
                </div>

                {/* Quiz Name and Time Per Question Row Skeleton */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-5 sm:gap-8">
                  <div className="md:col-span-2">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-2" />
                    <div className="w-full h-10 sm:h-12 bg-gray-50 dark:bg-gray-800/50 animate-pulse rounded-xl border border-gray-100 dark:border-gray-800" />
                  </div>
                  <div className="md:col-span-3">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-2" />
                    <div className="flex items-center gap-3 sm:gap-4 h-[40px] sm:h-[50px]">
                      <div className="flex-1 h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
                      <div className="w-12 h-6 sm:h-8 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Categories Skeleton */}
                <div className="md:col-span-2">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-2" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 sm:h-10 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
                    <div className="h-8 sm:h-10 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-full" />
                    <div className="h-8 sm:h-10 w-28 bg-gray-50 dark:bg-gray-800/50 animate-pulse border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-full" />
                  </div>
                </div>

                {/* Difficulty Skeleton */}
                <div>
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-3" />
                  <div className="flex h-10 sm:h-12 bg-gray-100/80 dark:bg-[#121216]/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-white/5">
                    <div className="flex-1 bg-white dark:bg-[#202028] rounded-lg sm:rounded-xl shadow-sm" />
                    <div className="flex-1" />
                    <div className="flex-1" />
                    <div className="flex-1" />
                  </div>
                </div>

                {/* Number of Questions Skeleton */}
                <div>
                  <div className="h-4 w-36 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1.5 sm:mb-3" />
                  <div className="flex h-10 sm:h-12 bg-gray-100/80 dark:bg-[#121216]/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-white/5">
                    <div className="flex-1 bg-white dark:bg-[#202028] rounded-lg sm:rounded-xl shadow-sm" />
                    <div className="flex-1" />
                    <div className="flex-1" />
                  </div>
                </div>
              </div>

              {/* Footer Skeleton */}
              <div className="pt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
                <div className="h-10 sm:h-12 w-32 sm:w-40 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
