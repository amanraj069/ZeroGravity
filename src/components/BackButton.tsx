"use client";

import React, { useState, useEffect, Suspense } from "react";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface BackButtonProps {
  className?: string;
  iconClassName?: string;
  label?: string;
  onClick?: () => void;
  href?: string;
}

const BackButtonInner: React.FC<BackButtonProps> = ({
  className = "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors",
  iconClassName = "w-6 h-6 sm:w-8 sm:h-8",
  label = "Go back",
  onClick,
  href,
}) => {
  const { goBack } = useNavigation();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const handleClick = () => {
    if (!onClick) {
      setIsNavigating(true);
    }
    
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
      disabled={isNavigating}
      className={`${className} transition-all duration-200 active:scale-95 ${isNavigating ? 'opacity-50 pointer-events-none' : ''}`}
      title={label}
      aria-label={label}
    >
      {isNavigating ? (
        <Loader2 className={`${iconClassName} animate-spin`} />
      ) : (
        <ChevronLeft className={iconClassName} />
      )}
    </button>
  );
};

export const BackButton: React.FC<BackButtonProps> = (props) => {
  return (
    <Suspense fallback={
      <button 
        disabled 
        className={`${props.className || "text-gray-500 dark:text-gray-400"} opacity-50`} 
        title={props.label || "Go back"} 
        aria-label={props.label || "Go back"}
      >
        <ChevronLeft className={props.iconClassName || "w-6 h-6 sm:w-8 sm:h-8"} />
      </button>
    }>
      <BackButtonInner {...props} />
    </Suspense>
  );
};
