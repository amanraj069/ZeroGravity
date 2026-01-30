"use client";

import React from "react";

interface ZeroGravityLoadingProps {
  title?: string;
  subtitle?: string;
  showNavigation?: boolean;
}

export default function ZeroGravityLoading({
  title = "ZeroGravity",
  subtitle = "Preparing your cosmic experience...",
}: ZeroGravityLoadingProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-black dark:border-t-white rounded-full mb-6"></div>
          <h2 className="text-xl font-light text-black dark:text-white mb-2">
            {title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 font-light">
            {subtitle}
          </p>
        </div>
      </main>
    </div>
  );
}
