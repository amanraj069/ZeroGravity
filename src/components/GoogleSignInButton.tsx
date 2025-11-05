"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GooglePromptNotification {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  isDismissedMoment: () => boolean;
  isDisplayed: () => boolean;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  use_fedcm_for_prompt?: boolean;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonConfig {
  type?: string;
  theme?: string;
  size?: string;
  text?: string;
  width?: number;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  isLoading = false,
}: GoogleSignInButtonProps) {
  const { theme } = useTheme();
  const [showGoogleButton] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services when available
  useEffect(() => {
    // Wait for Google Identity Services to load (provided by GoogleOAuthProvider)
    const checkGoogleLoaded = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(checkGoogleLoaded, 100);
        return;
      }

      if (isInitialized) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("Google Client ID is not set");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response?.credential) {
              onSuccess(response.credential);
            } else {
              onError?.();
            }
          },
          // Disable FedCM to avoid IdentityCredentialError
          use_fedcm_for_prompt: false,
          // Disable one-tap to avoid FedCM issues - just use the button
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("Error initializing Google Identity Services:", error);
        onError?.();
      }
    };

    checkGoogleLoaded();
  }, [onSuccess, onError, isInitialized]);

  // Track if button has been rendered to prevent re-rendering
  const hasRenderedButton = useRef(false);

  // Render Google button when ready
  useEffect(() => {
    if (!showGoogleButton || !buttonRef.current || !isInitialized) {
      return;
    }

    if (!window.google?.accounts?.id) {
      return;
    }

    // Don't render if button is disabled or loading
    if (disabled || isLoading) {
      // Clear button if disabled/loading
      if (buttonRef.current && hasRenderedButton.current) {
        buttonRef.current.innerHTML = "";
        hasRenderedButton.current = false;
      }
      return;
    }

    // Re-render if theme changes (clear button)
    if (hasRenderedButton.current && buttonRef.current.innerHTML) {
      // Clear button if theme changed to allow re-render with new theme
      const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
      const storedTheme = buttonRef.current.dataset.theme;
      if (storedTheme && storedTheme !== currentTheme) {
        buttonRef.current.innerHTML = "";
        hasRenderedButton.current = false;
      } else if (storedTheme === currentTheme) {
        return;
      }
    }

    const renderButton = () => {
      if (!buttonRef.current) return;

      try {
        // Clear any existing button
        buttonRef.current.innerHTML = "";

        // Calculate width to match container - use parent width or get from offset
        let containerWidth = 400; // default fallback
        if (buttonRef.current.parentElement) {
          containerWidth = buttonRef.current.parentElement.clientWidth;
        } else if (buttonRef.current.offsetParent) {
          containerWidth = (buttonRef.current.offsetParent as HTMLElement)
            .clientWidth;
        }

        // Render Google button with calculated width
        if (window.google?.accounts?.id) {
          // Use outline (white) theme for light mode, filled_black for dark mode
          const currentTheme = document.documentElement.classList.contains("dark") ? "dark" : "light";
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: "standard",
            theme: currentTheme === "dark" ? "filled_black" : "outline",
            size: "large",
            text: "signin_with",
            width: containerWidth,
          });
          // Store current theme to detect changes
          if (buttonRef.current) {
            buttonRef.current.dataset.theme = currentTheme;
          }
          hasRenderedButton.current = true;
        }

        // Apply styles after button is rendered - use longer delay to ensure button is fully ready
        setTimeout(() => {
          if (!buttonRef.current) return;

          // Target the button and iframe elements created by Google
          const buttons = buttonRef.current.querySelectorAll(
            'button, iframe, div[role="button"]'
          );
          buttons.forEach((element) => {
            (element as HTMLElement).style.borderRadius = "0";
          });
          // Also apply to any nested elements
          const allElements = buttonRef.current.querySelectorAll("*");
          allElements.forEach((element) => {
            (element as HTMLElement).style.borderRadius = "0";
          });

          // Ensure Google logo appears before text
          // Find button content and ensure logo comes first
          const button = buttonRef.current.querySelector(
            'button, div[role="button"]'
          );
          if (button) {
            // Ensure flex layout for proper alignment
            (button as HTMLElement).style.display = "flex";
            (button as HTMLElement).style.alignItems = "center";
            (button as HTMLElement).style.gap = "12px";

            // Find logo elements (svg or img) and ensure they're first
            // Only move if logo exists and is not already first
            const logo = button.querySelector("svg, img");
            if (
              logo &&
              logo.parentElement === button &&
              logo !== button.firstChild
            ) {
              // Move logo to be first child if not already
              button.insertBefore(logo, button.firstChild);
            }
          }
        }, 200);

        // Use MutationObserver to catch dynamically added elements (like iframes)
        // But disconnect it after button is fully rendered to avoid interference
        const observer = new MutationObserver(() => {
          if (!buttonRef.current) return;

          // Only apply styles, don't move elements during observer to avoid breaking handlers
          const buttons = buttonRef.current.querySelectorAll(
            'button, iframe, div[role="button"]'
          );
          buttons.forEach((element) => {
            (element as HTMLElement).style.borderRadius = "0";
          });

          // Apply flex styling if button exists
          const button = buttonRef.current.querySelector(
            'button, div[role="button"]'
          );
          if (button) {
            (button as HTMLElement).style.display = "flex";
            (button as HTMLElement).style.alignItems = "center";
            (button as HTMLElement).style.gap = "12px";
          }
        });

        if (buttonRef.current) {
          observer.observe(buttonRef.current, {
            childList: true,
            subtree: true,
          });
        }

        // Cleanup observer after button is fully loaded to avoid interfering with clicks
        setTimeout(() => observer.disconnect(), 500);
      } catch (error) {
        console.error("Error rendering Google button:", error);
        hasRenderedButton.current = false;
        onError?.();
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(renderButton, 0);

    // Helper function to remove rounded corners
    const removeRoundedCorners = () => {
      if (!buttonRef.current) return;
      const buttons = buttonRef.current.querySelectorAll(
        'button, iframe, div[role="button"]'
      );
      buttons.forEach((element) => {
        (element as HTMLElement).style.borderRadius = "0";
      });
      const allElements = buttonRef.current.querySelectorAll("*");
      allElements.forEach((element) => {
        (element as HTMLElement).style.borderRadius = "0";
      });
    };

    // Handle window resize to update button width
    const handleResize = () => {
      if (buttonRef.current && buttonRef.current.innerHTML) {
        // Only re-render on resize if really needed
        const currentWidth = buttonRef.current.clientWidth;
        if (currentWidth > 0) {
          renderButton();
          setTimeout(removeRoundedCorners, 150);
        }
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      hasRenderedButton.current = false;
    };
  }, [showGoogleButton, disabled, isLoading, isInitialized, theme, onError]); // Added theme and onError to dependencies

  // Show disabled button if disabled, loading, or not initialized
  if (!showGoogleButton || disabled || isLoading || !isInitialized) {
    return (
      <button
        type="button"
        disabled
        className="w-full bg-white dark:bg-red-700 text-gray-800 dark:text-white border border-gray-300 dark:border-none py-2 sm:py-3 px-4 font-medium cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2 opacity-50"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="sm:w-5 sm:h-5 flex-shrink-0"
        >
          <path
            d="M17.64 9.20454C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.8449H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.20454Z"
            fill="#4285F4"
          />
          <path
            d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65454 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z"
            fill="#34A853"
          />
          <path
            d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40681 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z"
            fill="#FBBC05"
          />
          <path
            d="M9 3.57955C10.3211 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65454 3.57955 9 3.57955Z"
            fill="#EA4335"
          />
        </svg>
        <span>Continue with Google</span>
      </button>
    );
  }

  // Render Google button
  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full [&_*]:!rounded-none" />
    </div>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (
            element: HTMLElement,
            config: GoogleButtonConfig
          ) => void;
          prompt: (
            callback: (notification: GooglePromptNotification) => void
          ) => void;
        };
      };
    };
  }
}
