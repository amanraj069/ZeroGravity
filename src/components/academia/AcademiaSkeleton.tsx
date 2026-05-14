import React from "react";
import { DashboardLayout } from "@/components/dashboard";
import { BackButton } from "@/components/BackButton";

export function AcademiaGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] shadow-sm p-4 sm:p-6 relative rounded-xl"
        >
          {/* Courses Count Skeleton */}
          <div className="absolute top-4 sm:top-5 right-4 sm:right-5">
            <div className="w-16 h-3 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" />
          </div>

          <div className="flex flex-col h-full min-h-[88px] sm:min-h-[96px]">
            {/* Title Skeleton */}
            <div className="mb-4">
              <div className="w-28 sm:w-36 h-6 sm:h-7 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg" />
            </div>
            
            {/* SGPA / No Grades Skeleton */}
            <div className="mb-4">
              <div className="w-24 sm:w-28 h-5 sm:h-6 bg-gray-100 dark:bg-gray-800 animate-pulse rounded-md" />
            </div>
            
            {/* View Details Skeleton */}
            <div className="mt-auto">
              <div className="w-20 h-4 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AcademiaSkeleton() {
  return (
    <DashboardLayout>
      <div className="mt-2 sm:mt-4">
        {/* Header Skeleton */}
        <div className="mb-4 sm:mb-8">
          <div className="mb-2">
            <div className="flex items-center gap-2 sm:gap-4 mb-2">
              <BackButton />
              <div className="flex-1 min-w-0">
                <div className="h-8 sm:h-10 w-32 sm:w-48 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg mb-1.5 sm:mb-2" />
                <div className="h-4 sm:h-5 w-48 sm:w-64 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="h-2 sm:h-3 w-8 bg-gray-200 dark:bg-gray-800 animate-pulse rounded mb-1 ml-auto" />
                <div className="h-7 sm:h-9 w-16 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg ml-auto" />
              </div>
            </div>
          </div>
        </div>
        
        <AcademiaGridSkeleton />
      </div>
    </DashboardLayout>
  );
}
