"use client";

import React from "react";

export default function CreateQuizSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="w-8 h-8 flex items-center justify-center text-gray-200 dark:text-gray-800">
                <div className="w-5 h-5 border-l-2 border-t-2 rotate-[-45deg] bg-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="h-7 sm:h-9 w-full max-w-[200px] sm:max-w-64 bg-gray-200 dark:bg-gray-800 animate-pulse" />
                  {/* Mobile Top Actions Skeleton */}
                  <div className="flex sm:hidden items-center gap-2 shrink-0">
                    <div className="w-9 h-9 border border-gray-200 dark:border-gray-800 animate-pulse" />
                    <div className="w-9 h-9 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </div>
                </div>
                <div className="h-3.5 w-full max-w-[180px] sm:max-w-48 bg-gray-100 dark:bg-gray-800 animate-pulse mt-1.5 sm:mt-2" />
              </div>
            </div>
            {/* Desktop Actions Skeleton */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-32 h-10 border border-gray-200 dark:border-gray-800 animate-pulse" />
              <div className="w-32 h-10 bg-black dark:bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 pt-2 sm:pt-6 pb-24 sm:pb-8 overflow-hidden">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 px-3 sm:px-4">
          
          {/* Sidebar Skeleton (Question Panel) - Desktop Only */}
          <aside className="hidden md:block md:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 h-[580px] flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="p-2 border-2 border-gray-100 dark:border-gray-700 aspect-square bg-gray-50/50 dark:bg-gray-700/30 animate-pulse" />
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 mt-auto">
                <div className="h-10 w-full bg-gray-50 dark:bg-gray-700 border border-dashed border-gray-200 dark:border-gray-600 animate-pulse" />
                <div className="h-10 w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 animate-pulse" />
              </div>
            </div>
          </aside>

          {/* Main Content Skeleton */}
          <section className="md:col-span-9">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden h-[calc(100dvh-240px)] md:h-[580px]">
              {/* Question Header Skeleton */}
              <div className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <div className="h-7 w-20 bg-gray-100 dark:bg-gray-700 animate-pulse" />
                  <div className="h-7 w-16 bg-gray-100 dark:bg-gray-700 animate-pulse" />
                </div>
              </div>

              {/* Question Input Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="space-y-2">
                    <div className="h-3.5 w-24 bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    <div className="h-10 sm:h-11 w-full bg-gray-50 dark:bg-gray-700 animate-pulse" />
                  </div>

                  <div className="space-y-3 sm:space-y-4 pt-1">
                    <div className="h-3.5 w-32 bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    <div className="space-y-2.5 sm:space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-10 sm:h-11 w-full bg-white dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 animate-pulse flex items-center px-4 gap-3">
                          <div className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-gray-600 shrink-0" />
                          <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-600" />
                        </div>
                      ))}
                      <div className="h-10 sm:h-11 w-full border border-dashed border-gray-200 dark:border-gray-700 animate-pulse" />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Skeleton - Fixed at bottom of section */}
                <div className="mt-auto p-4 sm:p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3 sm:space-y-0">
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end sm:gap-3">
                    {/* AI Button Skeleton */}
                    <div className="col-span-2 sm:w-48 h-9 sm:h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-white/10 dark:via-white/20 dark:to-white/10 animate-pulse border border-gray-300 dark:border-white/20" />
                    {/* Regular Button Skeletons */}
                    <div className="h-9 sm:h-10 border border-gray-200 dark:border-gray-700 animate-pulse" />
                    <div className="h-9 sm:h-10 border border-gray-200 dark:border-gray-700 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sticky Question Panel Skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden px-3 pb-3">
        <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg px-4 py-3 flex items-center justify-between">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="w-4 h-4 border-b-2 border-r-2 rotate-[-135deg] border-gray-400 mt-1" />
        </div>
      </div>
    </div>
  );
}

