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
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <div
        className={`${sizeClasses[size]} animate-spin border-b-2 border-black dark:border-white`}
        role="status"
        aria-label="Loading"
      />
      {showText && text && (
        <p className={`mt-3 text-gray-600 dark:text-gray-400 font-light ${textSizeClasses[size]}`}>
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
