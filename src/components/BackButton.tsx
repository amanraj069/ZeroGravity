"use client";

import React from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRouter } from "next/navigation";

interface BackButtonProps {
  className?: string;
  iconClassName?: string;
  label?: string;
  onClick?: () => void;
  href?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  className = "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors",
  iconClassName = "w-6 h-6 sm:w-8 sm:h-8",
  label = "Go back",
  onClick,
  href,
}) => {
  const { goBack } = useNavigation();
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else if (onClick) {
      onClick();
    } else {
      goBack();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={className}
      title={label}
      aria-label={label}
    >
      <ChevronLeft className={iconClassName} />
    </button>
  );
};
