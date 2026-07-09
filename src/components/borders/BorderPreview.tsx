"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { getBorderStyle, getAnimationClass } from "@/services/shopService";
import { Border } from "@/services/shopService";

interface BorderPreviewProps {
  border: Border;
  profilePicture?: string | null;
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-28 h-28",
  md: "w-36 h-36",
  lg: "w-48 h-48",
};

/**
 * Reusable component for displaying a border preview
 * Handles all border styling, animations, and fallback avatar display
 */
export default function BorderPreview({
  border,
  profilePicture,
  firstName,
  lastName,
  size = "md",
  className = "",
}: BorderPreviewProps) {
  // Calculate size in pixels for star scaling
  // Calculate initial size in pixels for star scaling
  const initialSizeInPx = size === "sm" ? 112 : size === "md" ? 144 : 192;
  const [currentSizeInPx, setCurrentSizeInPx] = useState(initialSizeInPx);

  useEffect(() => {
    // If it's used with the specific responsive classes from the shop
    if (className.includes("w-20")) {
      const handleResize = () => {
        if (window.innerWidth < 640) {
          setCurrentSizeInPx(80); // w-20
        } else if (window.innerWidth < 768) {
          setCurrentSizeInPx(112); // sm:w-28
        } else {
          setCurrentSizeInPx(144); // md:w-36
        }
      };
      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [className]);

  const borderStyle = getBorderStyle(border.id, currentSizeInPx);
  const animationClass = border.animated ? getAnimationClass(border.id) : "";
  // Only use sizeClass if className doesn't contain width/height overrides
  const hasSizeOverride = className.includes("w-") || className.includes("h-");
  const sizeClass = hasSizeOverride ? "" : sizeClasses[size];

  return (
    <div
      className={`${sizeClass} aspect-square overflow-hidden rounded-xl ${animationClass} ${className}`}
      style={borderStyle}
    >
      <div className="w-full h-full overflow-hidden rounded-lg relative z-20">
        {profilePicture ? (
          <Image
            src={profilePicture}
            alt={`${firstName} ${lastName}`}
            width={size === "sm" ? 112 : size === "md" ? 144 : 192}
            height={size === "sm" ? 112 : size === "md" ? 144 : 192}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
            <span
              className={`font-bold text-gray-500 dark:text-gray-400 ${size === "sm"
                  ? "text-3xl"
                  : size === "md"
                    ? "text-4xl"
                    : "text-5xl"
                }`}
            >
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
