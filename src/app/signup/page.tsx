"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall } from "@/config/api";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

export default function Signup() {
  const router = useRouter();
  const { signup, loginWithGoogle, user } = useAuth();
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
      const result = await signup(formData);

      if (result.success) {
        // Redirect to dashboard after successful signup
        router.push("/dashboard");
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
      <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 sm:p-8 text-center">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-light text-black mb-2">
              Sign Up Currently Unavailable
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Account creation is temporarily disabled. Please join our waitlist
              to be notified when registration opens.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handleJoinWaitlist}
              className="w-full bg-black text-white py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              Join Waitlist
            </button>

            <p className="text-sm sm:text-base text-gray-600">
              Are you an Admin?{" "}
              <Link
                href="/login"
                className="text-black hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-gray-500 hover:text-black text-xs sm:text-sm"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show signup form when signup is enabled
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-light text-black mb-2">
            Create Account
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Join ZeroGravity and start your productivity journey
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
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
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 focus:border-black focus:outline-none text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 focus:border-black focus:outline-none text-sm sm:text-base"
              required
            />
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 sm:py-3 border border-gray-300 focus:border-black focus:outline-none text-sm sm:text-base"
              required
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
                className="w-full px-3 py-2.5 sm:py-3 pr-10 border border-gray-300 focus:border-black focus:outline-none text-sm sm:text-base"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-black focus:outline-none"
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
              className="w-full bg-black text-white py-2 sm:py-2.5 sm:py-3 px-4 font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isSubmitting ? "Creating Account..." : "Create Account"}
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
          <p className="text-sm sm:text-base text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-black hover:underline font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
        <div className="mt-6 text-center space-y-2">
          <Link
            href="/"
            className="block text-gray-500 hover:text-black text-xs sm:text-sm"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
