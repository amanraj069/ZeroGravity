"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { AnimatedCTA, AnimatedSection } from "@/components/AnimatedSection";
import { API_ENDPOINTS, apiCall } from "@/config/api";

export default function WaitlistSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [waitlistCount, setWaitlistCount] = useState(1096); // Default fallback

  // Fetch waitlist count on component mount
  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await apiCall(API_ENDPOINTS.WAITLIST.COUNT);
        const data = await response.json();
        if (data.success) {
          setWaitlistCount(data.data.count);
        }
      } catch (error) {
        console.error("Failed to fetch waitlist count:", error);
        // Keep default count if fetch fails
      }
    };

    fetchWaitlistCount();
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter your email address");
      setIsSuccess(false);
      return;
    }

    if (!name.trim()) {
      setMessage("Please enter your name");
      setIsSuccess(false);
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await apiCall(API_ENDPOINTS.WAITLIST.JOIN, {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage(
          "Welcome to ZeroGravity. You'll receive 30 days of Pro access when we launch."
        );
        setIsSuccess(true);
        setName("");
        setEmail("");
        // Update the count with the new total from the response
        if (data.data.totalCount) {
          setWaitlistCount(data.data.totalCount);
        }
      } else {
        setMessage(
          data.message || "Failed to join waitlist. Please try again."
        );
        setIsSuccess(false);
      }
    } catch (error) {
      console.error("Waitlist error:", error);
      setMessage("Network error. Please check your connection and try again.");
      setIsSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatedCTA className="bg-gray-50 dark:bg-gray-800 py-16 sm:py-20">
      <AnimatedSection className="max-w-4xl mx-auto text-center px-8">
        <AnimatedSection className="relative mb-6 sm:mb-8">
          <Image
            src="/landing/zerogravity3.webp"
            alt="Join ZeroGravity"
            width={150}
            height={112}
            className="mx-auto opacity-30 dark:opacity-20 w-32 h-24 sm:w-48 sm:h-36"
          />
        </AnimatedSection>
        <AnimatedSection>
          <h2 className="text-3xl sm:text-4xl font-light text-black dark:text-white mb-4 sm:mb-6">
            Transcend Ordinary. Achieve Extraordinary.
          </h2>
        </AnimatedSection>
        <AnimatedSection>
          <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg mb-2 max-w-2xl mx-auto">
            Join our waitlist to be among the first to experience the future.
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-8 sm:mb-10">
            Includes complimentary{" "}
            <span className="text-black dark:text-white font-medium">
              ZeroGravity Pro
            </span>{" "}
            for your first month.
          </p>
        </AnimatedSection>

        {/* Waitlist Section */}
        <AnimatedSection id="waitlist">
          <div className="max-w-md mx-auto">
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourEmail@gmail.com"
                  className="px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors"
                  disabled={isLoading}
                  required
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 transition-colors"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Joining..." : "Join Waitlist"}
                  </button>
                </div>
              </div>

              {message && (
                <div
                  className={`text-sm text-center ${
                    isSuccess ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {message}
                </div>
              )}
            </form>

            <div className="flex items-center justify-center mt-4 text-gray-600 dark:text-gray-400">
              <div className="w-2 h-2 bg-green-500  mr-2"></div>
              <span className="text-sm">
                {waitlistCount.toLocaleString()} people already joined
              </span>
            </div>
          </div>
        </AnimatedSection>
      </AnimatedSection>
    </AnimatedCTA>
  );
}
