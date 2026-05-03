"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";

interface BackButtonProps {
  className?: string;
  iconClassName?: string;
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  className = "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors",
  iconClassName = "w-6 h-6 sm:w-8 sm:h-8",
  label = "Go back",
}) => {
  const { goBack } = useNavigation();

  return (
    <button
      onClick={goBack}
      className={className}
      title={label}
      aria-label={label}
    >
      <ChevronLeft className={iconClassName} />
    </button>
  );
};
