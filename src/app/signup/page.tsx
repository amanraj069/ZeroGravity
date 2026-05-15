"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

export default function Signup() {
  const router = useRouter();
  const { sendOtp, verifyOtp, resendOtp, loginWithGoogle, user } = useAuth();
  const [isLoading] = useState(false);
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
  
  // Generate random stars for background atmosphere (client-side only to avoid hydration mismatch)
  const [stars, setStars] = useState<Array<{left: string, top: string, size: number, opacity: number, delay: number}>>([]);
  
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    const starCount = isMobile ? 50 : 120;
    const baseSize = isMobile ? 0.5 : 0.8;
    const sizeVariance = isMobile ? 1 : 1.5;

    setStars(Array.from({ length: starCount }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * sizeVariance + baseSize,
      opacity: Math.random() * 0.8 + 0.4,
      delay: Math.random() * 5,
    })));
  }, []);

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
    // Redirect to dashboard if user is already logged in (but not during signup process)
    if (user && !isSignupInProgress) {
      router.push("/dashboard");
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


  // Show OTP verification screen
  if (showOtpScreen) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Base Background Layer – light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:hidden z-0" />
      {/* Base Background Layer – dark mode */}
      <div className="absolute inset-0 hidden dark:block bg-black z-0" />
        
        {/* Background Atmosphere & Stars */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
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
        <div className="w-full max-w-md p-6 sm:p-8 bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-20">
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
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm text-center rounded-xl">
              {otpError}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-sm text-center rounded-xl">
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
                className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-semibold border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-black dark:text-white bg-white dark:bg-gray-900 rounded-xl"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleVerifyOtp}
              disabled={isVerifying || otp.join("").length !== 6}
              className="w-full bg-black dark:bg-green-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base rounded-xl shadow-lg"
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
    <div className="h-[100dvh] w-full flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Base Background Layer – light mode */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-slate-50 to-purple-50 dark:hidden z-0" />
      {/* Base Background Layer – dark mode */}
      <div className="absolute inset-0 hidden dark:block bg-black z-0" />
      
      {/* Background Atmosphere & Stars */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
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

        {/* ── LEFT: Signup Card ── */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md flex-shrink-0 p-6 sm:p-8 bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl relative z-20"
        >
          <div className="text-center mb-6 sm:mb-8">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2"
            >
              Create Account
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm sm:text-base text-gray-600 dark:text-gray-400"
            >
              Join ZeroGravity and start your productivity journey
            </motion.p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-xl text-center">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
                autoComplete="name"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
                autoComplete="username"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all"
                required
                autoComplete="email"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Setup your Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2.5 sm:py-3 pr-10 border border-gray-300 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:outline-none text-sm sm:text-base text-black dark:text-white bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
            </motion.div>

            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black dark:bg-red-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base rounded-xl shadow-lg hover:shadow-black/20 dark:hover:shadow-red-900/40"
              >
                {isSubmitting ? "Sending OTP..." : "Create Account"}
              </motion.button>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}>
                <GoogleSignInButton
                  onSuccess={async (credential) => {
                    setIsGoogleLoading(true);
                    setIsSignupInProgress(true);
                    setError("");
                    try {
                      const result = await loginWithGoogle(credential);
                      if (result.success) router.push("/dashboard");
                      else { setError(result.message || "Google authentication failed"); setIsSignupInProgress(false); }
                    } catch (err) { console.error("Google login error:", err); setError("An unexpected error occurred during Google authentication"); setIsSignupInProgress(false); }
                    finally { setIsGoogleLoading(false); }
                  }}
                  onError={() => { setError("Google authentication failed. Please try again."); setIsGoogleLoading(false); setIsSignupInProgress(false); }}
                  disabled={isSubmitting}
                  isLoading={isGoogleLoading}
                />
              </motion.div>
            </motion.div>
          </form>

          <motion.div className="mt-6 text-center space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.5 }}>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Already have an account? <Link href="/login" className="text-black dark:text-white hover:underline font-medium">Sign in</Link>
            </p>
          </motion.div>
          <motion.div className="mt-6 text-center space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4, duration: 0.5 }}>
            <Link href="/" className="block text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-xs sm:text-sm">← Back to home</Link>
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Hero Panel (desktop only) ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="hidden lg:flex flex-col justify-center w-fit"
        >
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500 mb-6"
          >
            ZeroGravity
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-5xl xl:text-6xl font-light text-black dark:text-white tracking-tighter leading-[1.1] mb-6"
          >
            Start your
            <br />
            <span className="italic">journey now.</span>
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.85, duration: 0.5, ease: "easeOut" }}
            className="origin-left w-12 h-px bg-black dark:bg-white mb-6"
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-10 max-w-xs"
          >
            Push your limits, earn streaks, and rise up the leaderboard - one task at a time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.6 }}
            className="flex flex-col gap-2"
          >
            <div className="flex gap-3">
              {["Daily Streaks", "Leaderboards"].map((tag) => (
                <motion.span key={tag} whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }} className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 backdrop-blur-sm rounded-full whitespace-nowrap cursor-pointer transition-all duration-500 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.15)]">{tag}</motion.span>
              ))}
            </div>
            <div className="flex gap-3">
              {["Power-Ups", "Quizzes"].map((tag) => (
                <motion.span key={tag} whileHover={{ y: -1.5 }} whileTap={{ scale: 0.98 }} className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 backdrop-blur-sm rounded-full whitespace-nowrap cursor-pointer transition-all duration-500 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.15)]">{tag}</motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

      </div>
    </div>
  );
}
