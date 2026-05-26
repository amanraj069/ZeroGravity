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
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="relative flex items-center justify-center w-16 h-16 mx-auto mb-6">
            {/* Outer Orbiting Ring */}
            <div
              className="absolute w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white animate-[spin_3s_linear_infinite]"
            />
            {/* Inner Orbiting Ring (Reverse) */}
            <div
              className="absolute w-10 h-10 rounded-full border-2 border-gray-100 dark:border-gray-700 border-b-purple-500 animate-[spin_2s_linear_infinite_reverse]"
            />
            {/* Glowing Core */}
            <div
              className="absolute w-3 h-3 rounded-full bg-black dark:bg-white shadow-[0_0_15px_rgba(0,0,0,0.5)] dark:shadow-[0_0_15px_rgba(255,255,255,0.5)] animate-pulse"
            />
          </div>
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
