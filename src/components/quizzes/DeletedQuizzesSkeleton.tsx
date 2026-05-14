import React from "react";

export function DeletedQuizCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 rounded-xl"
        >
          {/* Header with Badges and Buttons */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="shrink-0 h-6 w-14 sm:w-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
              <div className="shrink-0 h-4 w-20 sm:w-24 bg-gray-50/50 dark:bg-gray-800 animate-pulse rounded" />
            </div>
            <div className="shrink-0 h-7 w-16 sm:w-20 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
          </div>

          {/* Quiz Title */}
          <div className="h-6 sm:h-7 w-3/4 bg-gray-200 dark:bg-gray-700 animate-pulse rounded-md mb-2 sm:mb-3" />

          {/* Quiz Description */}
          <div className="space-y-1.5 sm:space-y-2 mb-4">
            <div className="h-3 w-full bg-gray-50/50 dark:bg-gray-800 animate-pulse rounded" />
            <div className="h-3 w-5/6 bg-gray-50/50 dark:bg-gray-800 animate-pulse rounded" />
          </div>

          {/* Quiz Stats */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="h-5 sm:h-6 w-8 mx-auto bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-2.5 sm:h-3 w-12 sm:w-16 mx-auto bg-gray-50/50 dark:bg-gray-800 animate-pulse rounded" />
            </div>
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="h-5 sm:h-6 w-10 sm:w-12 mx-auto bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-2.5 sm:h-3 w-10 sm:w-12 mx-auto bg-gray-50/50 dark:bg-gray-800 animate-pulse rounded" />
            </div>
            <div className="text-center space-y-1.5 sm:space-y-2">
              <div className="h-5 sm:h-6 w-16 sm:w-20 mx-auto bg-gray-100 dark:bg-gray-700 animate-pulse rounded" />
              <div className="h-2.5 sm:h-3 w-12 sm:w-16 mx-auto bg-gray-50/50 dark:bg-gray-800 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DeletedQuizzesSkeleton() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="py-6 sm:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header Skeleton */}
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="p-2 -ml-2 text-gray-200 dark:text-gray-800 shrink-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-current animate-pulse rounded" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="h-7 sm:h-9 w-40 sm:w-56 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg mb-1 sm:mb-1.5" />
                <div className="h-4 sm:h-5 w-32 sm:w-48 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              </div>
            </div>
            <div className="w-full sm:w-80 h-11 sm:h-12 bg-gray-50 dark:bg-gray-800 animate-pulse rounded-lg border border-gray-100 dark:border-gray-700" />
          </div>

          <DeletedQuizCardsSkeleton />
        </div>
      </main>
    </div>
  );
}
