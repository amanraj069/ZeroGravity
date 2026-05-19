"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";

export default function Login() {
  const { login, loginWithGoogle, user } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

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

  useEffect(() => {
    // Redirect to dashboard if user is already logged in
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Basic validation
    if (!formData.email || !formData.password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    try {
      // First, check if signin is enabled
      const signinStatusResponse = await apiCall(
        API_ENDPOINTS.AUTH.SIGNIN_STATUS,
      );
      const signinStatusData = await signinStatusResponse.json();

      if (!signinStatusData.success || !signinStatusData.enabled) {
        setError("Signin is currently disabled");
        setIsLoading(false);
        return;
      }

      // Then, check if user exists
      const checkUserResponse = await apiCall(
        API_ENDPOINTS.AUTH.CHECK_USER(formData.email),
      );
      const checkUserData = await checkUserResponse.json();

      if (checkUserData.success && checkUserData.exists) {
        // User exists, proceed with login (no signup check needed)
        const result = await login(formData.email, formData.password);

        if (result.success) {
          // Redirect to dashboard
          router.push("/dashboard");
        } else {
          setError(result.message);
        }
      } else {
        // User doesn't exist, check signup status before allowing signup
        const signupStatusResponse = await apiCall(
          API_ENDPOINTS.AUTH.SIGNUP_STATUS,
        );
        const signupStatusData = await signupStatusResponse.json();

        if (signupStatusData.success && signupStatusData.enabled) {
          // Signup is enabled, redirect to signup page
          setError("User not found. Please sign up first.");
          setTimeout(() => {
            router.push("/signup");
          }, 2000);
        } else {
          // Signup is disabled
          setError("User not found and signup is currently disabled.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Memoize Google Sign-In callback to prevent rerenders when form inputs change
  const handleGoogleSignInSuccess = useCallback(
    async (credential: string) => {
      setIsGoogleLoading(true);
      setError("");

      try {
        const signinStatusResponse = await apiCall(
          API_ENDPOINTS.AUTH.SIGNIN_STATUS,
        );
        const signinStatusData = await signinStatusResponse.json();

        if (!signinStatusData.success || !signinStatusData.enabled) {
          setError("Signin is currently disabled");
          setIsGoogleLoading(false);
          return;
        }

        const result = await loginWithGoogle(credential);

        if (result.success) {
          router.push("/dashboard");
        } else {
          setError(result.message || "Google authentication failed");
        }
      } catch (err) {
        console.error("Google login error:", err);
        setError("An unexpected error occurred during Google authentication");
      } finally {
        setIsGoogleLoading(false);
      }
    },
    [loginWithGoogle, router],
  );

  const handleGoogleSignInError = useCallback(() => {
    setError("Google authentication failed. Please try again.");
    setIsGoogleLoading(false);
  }, []);

  // Don't render anything if user is logged in (will redirect)
  if (user) {
    return null;
  }

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
        {/* ── LEFT: Login Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="w-full max-w-md flex-shrink-0 min-w-0 p-6 sm:p-8 bg-white dark:bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl"
        >
          <div className="text-center mb-6 sm:mb-8">
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-2"
            >
              Login
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-sm sm:text-base text-gray-600 dark:text-gray-400"
            >
              Welcome back to ZeroGravity
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {error && (
              <div className="text-red-600 dark:text-red-400 text-sm text-center bg-red-50 dark:bg-red-900/30 p-3 rounded-xl border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black dark:text-white mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-all bg-white dark:bg-gray-900 text-black dark:text-white text-sm sm:text-base rounded-xl focus:ring-2 focus:ring-purple-500/20"
                placeholder="Enter your email here"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <label
                htmlFor="password"
                className="block text-sm font-medium text-black dark:text-white mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 border border-gray-300 dark:border-gray-700 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-all bg-white dark:bg-gray-900 text-black dark:text-white text-sm sm:text-base rounded-xl focus:ring-2 focus:ring-purple-500/20"
                  placeholder="••••••••"
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
              transition={{ delay: 0.7, duration: 0.5 }}
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full bg-black dark:bg-red-700 text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 dark:hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base rounded-xl shadow-lg hover:shadow-black/20 dark:hover:shadow-red-900/40"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </motion.button>

              <div className="relative flex items-center justify-center my-4 sm:my-6">
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
                <span className="flex-shrink mx-3 text-xs uppercase tracking-widest text-gray-400 dark:text-gray-500 font-medium">
                  or
                </span>
                <div className="flex-grow border-t border-gray-300 dark:border-gray-700"></div>
              </div>

              <motion.div
                className="w-full"
                style={{ willChange: "opacity" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.5 }}
              >
                <GoogleSignInButton
                  onSuccess={handleGoogleSignInSuccess}
                  onError={handleGoogleSignInError}
                  disabled={isLoading}
                  isLoading={isGoogleLoading}
                />
              </motion.div>
            </motion.div>
          </form>

          <motion.div
            className="mt-6 sm:mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-black dark:text-white hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>
          </motion.div>

          <motion.div
            className="mt-4 sm:mt-6 text-center"
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
        </motion.div>

        {/* ── RIGHT: Hero Panel (desktop only) ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
          className="hidden lg:flex flex-col justify-center w-fit"
        >
          {/* Eyebrow — matches site pattern */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-[10px] uppercase tracking-[0.5em] font-bold text-gray-400 dark:text-gray-500 mb-6"
          >
            ZeroGravity
          </motion.p>

          {/* Main headline — font-light, tracking-tighter like HeroSection */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
            className="text-5xl xl:text-6xl font-light text-black dark:text-white tracking-tighter leading-[1.1] mb-6"
          >
            Can you defy
            <br />
            <span className="italic">the gravity?</span>
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
            Push your limits, earn streaks, and rise up the leaderboard - one
            task at a time.
          </motion.p>

          {/* Feature tags — minimal, site-consistent */}
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
                  className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 backdrop-blur-sm rounded-full whitespace-nowrap cursor-pointer transition-all duration-500 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.15)]"
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
                  className="px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] font-bold text-gray-600 dark:text-gray-400 bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 backdrop-blur-sm rounded-full whitespace-nowrap cursor-pointer transition-all duration-500 hover:bg-black/[0.08] dark:hover:bg-white/[0.08] hover:border-black/20 dark:hover:border-white/20 hover:text-black dark:hover:text-white hover:shadow-[0_8px_16px_-6px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_8px_16px_-6px_rgba(255,255,255,0.15)]"
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
