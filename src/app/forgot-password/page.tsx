"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall } from "@/config/api";

export default function ForgotPassword() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [step, setStep] = useState<"email" | "password">("email");
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(
        () => setResendCooldown(resendCooldown - 1),
        1000,
      );
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Generate random stars for background atmosphere (client-side only to avoid hydration mismatch)
  const [stars, setStars] = useState<
    Array<{
      left: string;
      top: string;
      size: number;
      opacity: number;
      delay: number;
    }>
  >([]);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 50 : 120;
    const baseSize = isMobile ? 0.5 : 0.8;
    const sizeVariance = isMobile ? 1 : 1.5;

    setStars(
      Array.from({ length: starCount }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        size: Math.random() * sizeVariance + baseSize,
        opacity: Math.random() * 0.8 + 0.4,
        delay: Math.random() * 5,
      })),
    );
  }, []);

  // Stage 1 Action: Handles both Send OTP and Verify OTP depending on otpSent state
  const handleStage1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address");
      return;
    }

    if (!otpSent) {
      // 1. Send OTP
      setIsLoading(true);
      try {
        const response = await apiCall(
          API_ENDPOINTS.AUTH.FORGOT_PASSWORD_SEND_OTP,
          {
            method: "POST",
            body: JSON.stringify({ email }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setOtpSent(true);
          setResendCooldown(60);
          setSuccess("Verification OTP sent to your email successfully");
          // Focus first OTP digit input field
          setTimeout(() => {
            otpInputRefs.current[0]?.focus();
          }, 100);
          // Auto-clear success banner after 4 seconds
          setTimeout(() => {
            setSuccess("");
          }, 4000);
        } else {
          setError(
            data.message || "Failed to send reset OTP. Please try again.",
          );
        }
      } catch (err) {
        console.error("Forgot password send OTP error:", err);
        const error = err as Error;
        setError(
          error.message || "An unexpected error occurred. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    } else {
      // 2. Verify OTP
      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        setError("Please enter the complete 6-digit OTP code");
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiCall(
          API_ENDPOINTS.AUTH.FORGOT_PASSWORD_VERIFY_OTP,
          {
            method: "POST",
            body: JSON.stringify({ email, otp: otpCode }),
          },
        );

        const data = await response.json();

        if (data.success) {
          setSuccess("OTP verified successfully!");
          setTimeout(() => {
            setStep("password");
            setError("");
            setSuccess("");
          }, 1000);
        } else {
          setError(data.message || "Invalid OTP code. Please try again.");
        }
      } catch (err) {
        console.error("Forgot password verify OTP error:", err);
        const error = err as Error;
        setError(
          error.message || "An unexpected error occurred. Please try again.",
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiCall(
        API_ENDPOINTS.AUTH.FORGOT_PASSWORD_SEND_OTP,
        {
          method: "POST",
          body: JSON.stringify({ email }),
        },
      );
      const data = await response.json();

      if (data.success) {
        setSuccess("A new verification OTP has been sent to your email!");
        setResendCooldown(60);
        setOtp(["", "", "", "", "", ""]);
        setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
        // Auto-clear success message after 4 seconds
        setTimeout(() => {
          setSuccess("");
        }, 4000);
      } else {
        setError(data.message || "Failed to resend OTP");
      }
    } catch (err) {
      console.error("Resend OTP error:", err);
      setError("Failed to resend OTP code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  // Stage 2 Action: Resets the password
  const handleStage2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");

    if (!newPassword || !confirmPassword) {
      setError("Please fill in all password fields");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.FORGOT_PASSWORD_RESET, {
        method: "POST",
        body: JSON.stringify({
          email,
          otp: otpCode,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          "Password has been reset successfully! Redirecting to login...",
        );
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.message || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      console.error("Forgot password reset error:", err);
      const error = err as Error;
      setError(
        error.message || "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6);
      const newOtp = [...otp];
      digits.split("").forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    } else {
      const cleanValue = value.replace(/\D/g, "");
      const newOtp = [...otp];
      newOtp[index] = cleanValue;
      setOtp(newOtp);

      if (cleanValue && index < 5) {
        otpInputRefs.current[index + 1]?.focus();
      }
    }
    setError("");
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (
    index: number,
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text");
    if (!paste) return;
    const digits = paste.replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const newOtp = [...otp];
    digits.split("").forEach((digit, i) => {
      if (index + i < 6) newOtp[index + i] = digit;
    });
    setOtp(newOtp);
    const nextIndex = Math.min(index + digits.length, 5);
    otpInputRefs.current[nextIndex]?.focus();
    setError("");
  };

  return (
    <div className="h-[100dvh] w-full flex relative overflow-hidden">
      {/* Base Background Layer – light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:hidden z-0" />
      {/* Base Background Layer – dark mode */}
      <div className="absolute inset-0 hidden dark:block bg-black z-0" />

      {/* Background Atmosphere & Stars */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {/* Floating Background Blobs */}
        {/* Top-right: purple/indigo */}
        <motion.div
          animate={{ x: [0, 30, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] right-[-10%] md:top-0 md:right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-purple-400/[0.18] md:bg-purple-500/[0.22] dark:bg-indigo-500/[0.1] md:dark:bg-indigo-500/[0.2] rounded-full blur-[80px] md:blur-[140px]"
        />
        {/* Bottom-left: rose/pink */}
        <motion.div
          animate={{ x: [0, -40, 0], y: [0, 20, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-5%] left-[-10%] md:bottom-20 md:left-0 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-rose-300/[0.15] md:bg-rose-400/[0.18] dark:bg-blue-900/[0.08] md:dark:bg-blue-900/[0.15] rounded-full blur-[60px] md:blur-[120px]"
        />
        {/* Centre accent: blue/indigo — light mode only */}
        <motion.div
          animate={{ x: [0, 20, 0], y: [0, -20, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute top-[30%] left-[10%] w-[200px] md:w-[400px] h-[200px] md:h-[400px] bg-indigo-300/[0.12] md:bg-indigo-400/[0.14] dark:hidden rounded-full blur-[70px] md:blur-[120px]"
        />

        {/* Stars */}
        <div className="absolute inset-0">
          {stars.map((star, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{
                opacity: [star.opacity, 0.1, star.opacity],
                scale: [1, 0.8, 1],
              }}
              transition={{
                duration: 1.5 + Math.random() * 2,
                repeat: Infinity,
                delay: star.delay,
                ease: "easeInOut",
              }}
              className="absolute rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.5)] dark:bg-white dark:shadow-[0_0_8px_rgba(255,255,255,0.8)]"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Two-column wrapper ── */}
      <div className="relative z-20 w-full max-w-6xl mx-auto flex items-center justify-center px-6 lg:px-10 gap-10 lg:gap-24">
        {/* ── LEFT: Form Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md flex-shrink-0 min-w-0 py-10 sm:py-12 px-6 sm:px-8 min-h-[540px] sm:min-h-[590px] flex flex-col bg-transparent/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
        >
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.3 }}
                className="flex-grow flex flex-col justify-around py-2"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2">
                    Forgot Password
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Enter your email to receive a 6-digit OTP code to verify
                    your identity.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                <form
                  onSubmit={handleStage1Submit}
                  className="space-y-4 sm:space-y-5"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-black dark:text-white"
                      >
                        Email Address
                      </label>
                      <AnimatePresence>
                        {otpSent && success && (
                          <motion.span
                            initial={{ opacity: 0, x: 5 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 5 }}
                            className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1"
                          >
                            Sent successfully ✓
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={otpSent}
                        className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-all bg-transparent text-black dark:text-white text-sm sm:text-base rounded-xl focus:ring-2 focus:ring-purple-500/20 ${
                          otpSent
                            ? "pr-10 opacity-70 bg-gray-50 dark:bg-gray-800/20 cursor-not-allowed"
                            : ""
                        }`}
                        placeholder="Enter your registered email"
                      />
                      {otpSent && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtp(["", "", "", "", "", ""]);
                            setError("");
                            setSuccess("");
                          }}
                          title="Edit email address"
                          className="absolute right-3.5 text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                        >
                          <svg
                            className="w-4 h-4 sm:w-4.5 sm:h-4.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline OTP verification code boxes */}
                  <AnimatePresence>
                    {otpSent && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden space-y-4 pt-2"
                      >
                        <div>
                          <label className="block text-sm font-medium text-black dark:text-white text-center mb-2.5">
                            Enter Verification Code
                          </label>
                          <div className="grid grid-cols-6 gap-2 sm:gap-3 w-full max-w-[280px] sm:max-w-[300px] mx-auto">
                            {otp.map((digit, idx) => (
                              <input
                                key={idx}
                                ref={(el) => {
                                  otpInputRefs.current[idx] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                onPaste={(e) => handleOtpPaste(idx, e)}
                                value={digit}
                                onChange={(e) =>
                                  handleOtpChange(idx, e.target.value)
                                }
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                className="w-full h-12 sm:h-13 text-center text-lg sm:text-xl font-semibold border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-black dark:text-white bg-transparent rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all"
                              />
                            ))}
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Didn&apos;t receive the code?{" "}
                            {resendCooldown > 0 ? (
                              <span className="text-gray-500 font-medium">
                                Resend in {resendCooldown}s
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={isResending}
                                className="text-black dark:text-white hover:underline font-medium disabled:opacity-50"
                              >
                                {isResending ? "Sending..." : "Resend OTP"}
                              </button>
                            )}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black dark:bg-red-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base rounded-xl shadow-lg hover:shadow-black/20 dark:hover:shadow-red-900/40"
                  >
                    {isLoading
                      ? otpSent
                        ? "Verifying code..."
                        : "Sending code..."
                      : otpSent
                        ? "Verify OTP & Continue"
                        : "Send Verification OTP"}
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="password-step"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-grow flex flex-col justify-around py-2"
              >
                <div className="text-center mb-6 sm:mb-8">
                  <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2">
                    Reset Password
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    Set up and confirm your new secure password.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-200 dark:border-red-800">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 text-green-600 dark:text-green-400 text-sm text-center bg-green-50 dark:bg-green-900/30 p-3 rounded-xl border border-green-200 dark:border-green-800">
                    {success}
                  </div>
                )}

                <form
                  onSubmit={handleStage2Submit}
                  className="space-y-4 sm:space-y-5"
                >
                  {/* New Password */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-black dark:text-white mb-2"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-all bg-transparent text-black dark:text-white text-sm sm:text-base rounded-xl focus:ring-2 focus:ring-purple-500/20"
                        placeholder="Min 8 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none transition-colors"
                      >
                        {showPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-black dark:text-white mb-2"
                    >
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-all bg-transparent text-black dark:text-white text-sm sm:text-base rounded-xl focus:ring-2 focus:ring-purple-500/20"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white focus:outline-none transition-colors"
                      >
                        {showConfirmPassword ? (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            viewBox="0 0 24 24"
                          >
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-black dark:bg-red-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base rounded-xl shadow-lg hover:shadow-black/20 dark:hover:shadow-red-900/40"
                  >
                    {isLoading
                      ? "Resetting password..."
                      : "Reset & Save Password"}
                  </motion.button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 sm:mt-10">
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Remember your password?{" "}
                <Link
                  href="/login"
                  className="text-black dark:text-white hover:underline font-medium"
                >
                  Sign in
                </Link>
              </p>
            </motion.div>

            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.5 }}
            >
              <Link
                href="/"
                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm"
              >
                ← Back to home
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* ── RIGHT: Hero Panel (desktop only) ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="hidden lg:flex flex-col justify-center w-fit"
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500 mb-6"
          >
            ZeroGravity
          </motion.p>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-5xl xl:text-6xl font-light text-black dark:text-white tracking-tighter leading-[1.1] mb-6"
          >
            Restore your
            <br />
            <span className="italic">access now.</span>
          </motion.h2>

          {/* Divider */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.85, duration: 0.5, ease: "easeOut" }}
            className="origin-left w-12 h-px bg-black dark:bg-white mb-6"
          />

          {/* Sub-copy */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-xs"
          >
            Every setback is just a setup for an even stronger comeback. Recover
            your account and resume your streak.
          </motion.p>

          {/* Feature tags */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.6 }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-3">
              {["Daily Streaks", "Leaderboards"].map((tag) => (
                <motion.span
                  key={tag}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 backdrop-blur-sm rounded-full whitespace-nowrap cursor-pointer transition-all duration-500 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.15)]"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
            <div className="flex gap-3">
              {["Power-Ups", "Quizzes"].map((tag) => (
                <motion.span
                  key={tag}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 backdrop-blur-sm rounded-full whitespace-nowrap cursor-pointer transition-all duration-500 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.15)]"
                >
                  {tag}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
      {/* end two-column wrapper */}
    </div>
  );
}
