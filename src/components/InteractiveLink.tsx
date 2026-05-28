"use client";

import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, ReactNode } from "react";
import { Loader2 } from "lucide-react";

interface InteractiveLinkProps extends React.ComponentProps<typeof Link> {
  children: ReactNode;
  className?: string;
  showSpinner?: boolean;
  loadingText?: string;
  variant?: "button" | "card" | "text";
  onMouseEnter?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

export function InteractiveLink({
  children,
  className = "",
  showSpinner = true,
  loadingText,
  variant = "button",
  onMouseEnter,
  onMouseLeave,
  onClick,
  ...props
}: InteractiveLinkProps) {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Reset loading state when navigation completes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Aggressive background prefetching on hover
    if (typeof props.href === "string") {
      router.prefetch(props.href);
    } else if (props.href.pathname) {
      router.prefetch(props.href.pathname);
    }
    onMouseEnter?.(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Open in new tab or specific button check
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) {
      onClick?.(e);
      return;
    }

    const targetUrl = typeof props.href === "string" ? props.href : props.href.pathname || "";
    // Only show loading if actually navigating to a different path
    // Let Next.js handle same-page anchors without loading state
    if (targetUrl !== pathname && !targetUrl.startsWith("#")) {
      setIsNavigating(true);
    }
    
    onClick?.(e);
  };

  if (variant === "card") {
    return (
      <Link
        {...props}
        prefetch={true}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={handleClick}
        className={`relative block transition-all duration-200 active:scale-[0.98] ${
          isNavigating ? "pointer-events-none" : ""
        } ${className}`}
      >
        {children}
        {isNavigating && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-sm rounded-[inherit] transition-all duration-200 animate-in fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-black dark:text-white drop-shadow-md" />
          </div>
        )}
      </Link>
    );
  }

  return (
    <Link
      {...props}
      prefetch={true}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      className={`relative transition-all duration-200 active:scale-95 ${
        isNavigating ? "opacity-80 pointer-events-none" : ""
      } ${className}`}
    >
      <div className={`flex items-center justify-center gap-1.5 transition-opacity duration-200 ${isNavigating && showSpinner ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </div>
      {isNavigating && showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 animate-in fade-in zoom-in-95 duration-200">
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText && <span className="text-xs font-medium">{loadingText}</span>}
        </div>
      )}
    </Link>
  );
}
