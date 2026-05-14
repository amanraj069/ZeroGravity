import React from "react";
import { DashboardLayout } from "@/components/dashboard";
import { ChevronLeft } from "lucide-react";

export function CoursesListSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {[...Array(4)].map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] shadow-sm rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-start justify-between mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                {/* Course Name Skeleton */}
                <div className="w-40 sm:w-64 h-6 sm:h-7 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
              </div>
              <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                {/* Grade Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="w-10 h-3 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                  <div className="w-8 h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
                {/* Credits Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-3 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                  <div className="w-4 h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
                {/* Absents Skeleton */}
                <div className="flex items-center gap-2">
                  <div className="w-12 h-3 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
                  <div className="w-4 h-4 sm:h-5 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                </div>
              </div>
            </div>
            
            {/* Actions Skeleton */}
            <div className="flex gap-2 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SemesterDetailSkeleton() {
  return (
    <DashboardLayout>
      <div className="mt-2 sm:mt-4">
        {/* Header Skeleton */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <div className="p-2 -ml-2 text-gray-500 dark:text-gray-400 shrink-0">
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="h-7 sm:h-10 w-40 sm:w-56 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg mb-1.5 sm:mb-2" />
              <div className="h-4 sm:h-5 w-32 sm:w-40 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            </div>
            {/* Add Course Button Skeleton */}
            <div className="h-9 sm:h-11 w-16 sm:w-32 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg shrink-0" />
          </div>
        </div>

        <CoursesListSkeleton />
      </div>
    </DashboardLayout>
  );
}
