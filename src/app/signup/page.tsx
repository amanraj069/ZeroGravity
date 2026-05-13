"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

export default function Signup() {
  const router = useRouter();
  const { sendOtp, verifyOtp, resendOtp, loginWithGoogle, user } = useAuth();
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignupInProgress, setIsSignupInProgress] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // OTP verification state
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Redirect to home if user is already logged in (but not during signup process)
    if (user && !isSignupInProgress) {
      router.push("/");
      return;
    }
    if (!user) {
      checkSignupStatus();
    }
  }, [user, router, isSignupInProgress]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const checkSignupStatus = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.SIGNUP_STATUS);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSignupEnabled(data.enabled);
        }
      }
    } catch (err) {
      console.error("Failed to check signup status:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setIsSignupInProgress(true);
    setError("");

    if (
      !formData.name ||
      !formData.username ||
      !formData.email ||
      !formData.password
    ) {
      setError("Please fill in all fields");
      setIsSubmitting(false);
      setIsSignupInProgress(false);
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      setIsSubmitting(false);
      setIsSignupInProgress(false);
      return;
    }

    try {
      const result = await sendOtp(formData);

      if (result.success) {
        // Show OTP verification screen
        setVerificationEmail(result.email || formData.email);
        setShowOtpScreen(true);
        setResendCooldown(60); // 60 seconds cooldown
      } else {
        setError(result.message);
        setIsSignupInProgress(false);
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("An unexpected error occurred");
      setIsSignupInProgress(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      return "Password must be at least 8 characters long";
    }
    if (!hasUpperCase) {
      return "Password must contain at least one uppercase letter";
    }
    if (!hasNumber) {
      return "Password must contain at least one number";
    }
    if (!hasSpecialChar) {
      return "Password must contain at least one special character";
    }
    return null;
  };

  const handleJoinWaitlist = () => {
    router.push("/");
    // Wait for navigation to complete, then scroll to waitlist section
    setTimeout(() => {
      const waitlistElement = document.getElementById("waitlist");
      if (waitlistElement) {
        waitlistElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 100);
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      digits.split("").forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      // Focus on the next empty input or the last one
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      // Handle single digit input
      const newOtp = [...otp];
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
    setOtpError("");
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsVerifying(true);
    setOtpError("");

    try {
      const result = await verifyOtp(verificationEmail, otpCode);

      if (result.success) {
        setSuccessMessage("Email verified successfully! Redirecting...");
        setTimeout(() => {
          router.push("/dashboard");
        }, 1500);
      } else {
        setOtpError(result.message);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError("An unexpected error occurred");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setIsResending(true);
    setOtpError("");

    try {
      const result = await resendOtp(verificationEmail);

      if (result.success) {
        setSuccessMessage("OTP resent successfully!");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setOtpError(result.message);
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setOtpError("Failed to resend OTP");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToSignup = () => {
    setShowOtpScreen(false);
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setSuccessMessage("");
    setIsSignupInProgress(false);
  };

  // Don't render anything if user is logged in and not during signup (will redirect)
  if (user && !isSignupInProgress) {
    return null;
  }

  if (isLoading) {
    return (
      <ZeroGravityLoading
        title="Checking Signup Status"
        subtitle="Verifying registration availability..."
        showNavigation={false}
      />
    );
  }

  // Show waitlist message when signup is disabled
  if (!signupEnabled) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 sm:p-8 text-center">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2">
              Sign Up Currently Unavailable
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Account creation is temporarily disabled. Please join our waitlist
              to be notified when registration opens.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleJoinWaitlist}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm sm:text-base"
            >
              Join Waitlist
            </button>

            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Are you an Admin?{" "}
              <Link
                href="/login"
                className="text-black dark:text-white hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show OTP verification screen
  if (showOtpScreen) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 sm:p-8">
          <div className="text-center mb-6 sm:mb-8">
            {/* Email icon */}
            <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
              <svg
                className="w-16 h-16 sm:w-24 sm:h-24 text-black dark:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2">
              Verify Your Email
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              We&apos;ve sent a 6-digit verification code to
            </p>
            <p className="text-sm sm:text-base font-medium text-black dark:text-white mt-1">
              {verificationEmail}
            </p>
          </div>

          {otpError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm text-center">
              {otpError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm text-center">
              {successMessage}
            </div>
          )}

          {/* OTP Input */}
          <div className="flex justify-center gap-2 sm:gap-3 mb-6">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  otpInputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-black dark:text-white bg-white dark:bg-gray-900"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.join("").length !== 6}
              className="w-full bg-black dark:bg-green-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isVerifying ? "Verifying..." : "Verify Email"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Didn&apos;t receive the code?{" "}
                {resendCooldown > 0 ? (
                  <span className="text-gray-500">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={isResending}
                    className="text-black dark:text-white hover:underline font-medium disabled:opacity-50"
                  >
                    {isResending ? "Sending..." : "Resend OTP"}
                  </button>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={handleBackToSignup}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm"
            >
              ← Back to signup
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show signup form when signup is enabled
  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-white dark:bg-gray-900 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Join ZeroGravity and start your productivity journey
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
              required
              autoComplete="name"
            />
          </div>

          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Setup your Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2.5 sm:py-3 pr-10 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500"
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-black dark:bg-red-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? "Sending OTP..." : "Create Account"}
            </button>

            <GoogleSignInButton
              onSuccess={async (credential) => {
                setIsGoogleLoading(true);
                setIsSignupInProgress(true);
                setError("");

                try {
                  const result = await loginWithGoogle(credential);

                  if (result.success) {
                    // Redirect to dashboard after successful login
                    router.push("/dashboard");
                  } else {
                    setError(result.message || "Google authentication failed");
                    setIsSignupInProgress(false);
                  }
                } catch (err) {
                  console.error("Google login error:", err);
                  setError(
                    "An unexpected error occurred during Google authentication"
                  );
                  setIsSignupInProgress(false);
                } finally {
                  setIsGoogleLoading(false);
                }
              }}
              onError={() => {
                setError("Google authentication failed. Please try again.");
                setIsGoogleLoading(false);
                setIsSignupInProgress(false);
              }}
              disabled={isSubmitting}
              isLoading={isGoogleLoading}
            />
          </div>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-black dark:text-white hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-6 text-center space-y-2">
          <Link
            href="/"
            className="block text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
