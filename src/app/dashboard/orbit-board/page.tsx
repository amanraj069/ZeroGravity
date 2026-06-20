"use client";

import { Suspense } from "react";
import OrbitBoard from "./OrbitBoard";

function OrbitBoardSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white dark:bg-[#0a0a0a]">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
          <div className="w-32 h-6 bg-gray-200 dark:bg-white/10 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-20 h-8 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
          <div className="w-8 h-8 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
        </div>
      </div>
      {/* Columns skeleton */}
      <div className="flex-1 flex gap-4 p-4 sm:p-6 overflow-x-auto">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 w-72 sm:w-80 bg-gray-50 dark:bg-white/[0.02] rounded-xl border border-gray-200 dark:border-white/5 p-3"
          >
            <div className="w-24 h-5 bg-gray-200 dark:bg-white/10 rounded animate-pulse mb-3" />
            {[1, 2].map((j) => (
              <div
                key={j}
                className="w-full h-24 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse mb-2"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrbitBoardPage() {
  return (
    <Suspense fallback={<OrbitBoardSkeleton />}>
      <OrbitBoard />
    </Suspense>
  );
}
