"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  showText?: boolean;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  text = "Loading...",
  showText = true,
  fullScreen = false,
}: LoadingSpinnerProps) {
  // Dimensions for the outer wrapper to prevent layout shift
  const wrapperClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  // Dimensions for the cosmic rings
  const outerRingClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const innerRingClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
  };

  const coreClasses = {
    sm: "w-1.5 h-1.5",
    md: "w-2 h-2",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div className={`relative flex items-center justify-center ${wrapperClasses[size]}`}>
        {/* Outer Orbiting Ring */}
        <div
          className={`absolute ${outerRingClasses[size]} rounded-full border border-gray-200 dark:border-gray-800 border-t-black dark:border-t-white animate-[spin_3s_linear_infinite]`}
        />
        {/* Inner Orbiting Ring (Reverse) */}
        <div
          className={`absolute ${innerRingClasses[size]} rounded-full border border-gray-100 dark:border-gray-700 border-b-purple-500 animate-[spin_2s_linear_infinite_reverse]`}
        />
        {/* Glowing Core */}
        <div
          className={`absolute ${coreClasses[size]} rounded-full bg-black dark:bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)] animate-pulse`}
        />
      </div>
      
      {showText && text && (
        <p
          className={`mt-4 text-gray-600 dark:text-gray-400 font-light tracking-wide ${textSizeClasses[size]}`}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <div className="flex-1 flex items-center justify-center">{spinner}</div>
      </div>
    );
  }

  return <div className="flex items-center justify-center p-4">{spinner}</div>;
}
