"use client";

import { useEffect, useRef, useState } from "react";

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  disabled = false,
  isLoading = false,
}: GoogleSignInButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGoogleButton, setShowGoogleButton] = useState(false);
  const isInitialized = useRef(false);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Initialize Google Identity Services when available
  useEffect(() => {
    // Wait for Google Identity Services to load (provided by GoogleOAuthProvider)
    const checkGoogleLoaded = () => {
      if (!window.google?.accounts?.id) {
        setTimeout(checkGoogleLoaded, 100);
        return;
      }

      if (isInitialized.current) return;

      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.error("Google Client ID is not set");
        return;
      }

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            if (response?.credential) {
              setIsProcessing(false);
              setShowGoogleButton(false);
              onSuccess(response.credential);
            } else {
              setIsProcessing(false);
              setShowGoogleButton(false);
              onError?.();
            }
          },
        });
        isInitialized.current = true;
      } catch (error) {
        console.error("Error initializing Google Identity Services:", error);
      }
    };

    checkGoogleLoaded();
  }, [onSuccess, onError]);

  // Render Google button when showGoogleButton is true
  useEffect(() => {
    if (!showGoogleButton || !buttonRef.current || !isInitialized.current) {
      return;
    }

    if (!window.google?.accounts?.id) {
      return;
    }

    try {
      // Clear any existing button
      buttonRef.current.innerHTML = "";

      // Render Google button
      window.google.accounts.id.renderButton(buttonRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        width: 300,
      });
    } catch (error) {
      console.error("Error rendering Google button:", error);
      setIsProcessing(false);
      setShowGoogleButton(false);
      onError?.();
    }
  }, [showGoogleButton, onError]);

  const handleClick = () => {
    if (disabled || isLoading || isProcessing) {
      return;
    }

    if (!window.google?.accounts?.id || !isInitialized.current) {
      console.error("Google Identity Services not initialized");
      onError?.();
      return;
    }

    setIsProcessing(true);

    // Try one-tap prompt first
    window.google.accounts.id.prompt((notification: any) => {
      if (
        notification.isNotDisplayed() ||
        notification.isSkippedMoment() ||
        notification.isDismissedMoment()
      ) {
        // One-tap not available or dismissed, show the Google button for user to click
        setIsProcessing(false);
        setShowGoogleButton(true);
      }
      // If notification.isDisplayed(), one-tap is shown, wait for user interaction
    });
  };

  // Hide custom button when Google button is shown
  if (showGoogleButton) {
    return (
      <div className="w-full flex justify-center">
        <div ref={buttonRef} className="w-full max-w-[300px]" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading || isProcessing}
      className="w-full bg-white border border-gray-300 text-black py-2 sm:py-3 px-4 font-medium hover:bg-gray-50 hover:border-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2"
    >
      {isLoading || isProcessing ? (
        <>
          <svg
            className="animate-spin h-4 w-4 sm:h-5 sm:w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Connecting...</span>
        </>
      ) : (
        <>
          {/* Google Icon */}
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
        </>
      )}
    </button>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
        };
      };
    };
  }
}
