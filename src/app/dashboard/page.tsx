"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import LoginStreakBonus from "@/components/LoginStreakBonus";
import { ShoppingBag } from "lucide-react";
import {
  DashboardLayout,
  WaitlistUsersSection,
  type WaitlistUser,
} from "@/components/dashboard";

export default function Dashboard() {
  const {
    user,
    isLoggedIn,
    isLoading: authLoading,
    refreshPoints,
    checkSession,
  } = useAuth();
  const router = useRouter();
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [pointsAnimation, setPointsAnimation] = useState<{
    points: number;
  } | null>(null);
  // const [uploading, setUploading] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate random stars for Students Hub background
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1, // Random size between 1-4px
      mobileSize: Math.random() * 1.5 + 0.5, // Smaller on mobile: 0.5-2px
      opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2-1
      delay: Math.random() * 3, // Random animation delay for appearing
      twinkleDuration: 4 + Math.random() * 4, // Slower twinkle: 4-8s
      twinkleDelay: Math.random() * 3, // Random delay for twinkling animation
      moveX: (Math.random() - 0.5) * 40, // Random X movement between -20px to 20px
      moveY: (Math.random() - 0.5) * 40, // Random Y movement between -20px to 20px
      showOnMobile: i < 30, // Only show 30 stars on mobile (reduced from 80)
    }));
  }, []);

  // Generate random stars for Goals card
  const goalsStars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // Random size between 1-3px
      mobileSize: Math.random() * 1 + 0.5, // Smaller on mobile: 0.5-1.5px
      opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2-1
      delay: Math.random() * 2.5,
      twinkleDuration: 4 + Math.random() * 4, // Slower twinkle: 4-8s
      twinkleDelay: Math.random() * 3,
      moveX: (Math.random() - 0.5) * 30,
      moveY: (Math.random() - 0.5) * 30,
      showOnMobile: i < 15, // Only show 15 stars on mobile (reduced from 40)
    }));
  }, []);

  // Generate random stars for Academia card
  const academiaStars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // Random size between 1-3px
      mobileSize: Math.random() * 1 + 0.5, // Smaller on mobile: 0.5-1.5px
      opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2-1
      delay: Math.random() * 2.5,
      twinkleDuration: 4 + Math.random() * 4, // Slower twinkle: 4-8s
      twinkleDelay: Math.random() * 3,
      moveX: (Math.random() - 0.5) * 30,
      moveY: (Math.random() - 0.5) * 30,
      showOnMobile: i < 15, // Only show 15 stars on mobile (reduced from 40)
    }));
  }, []);

  // Navigation items array with styling
  const navigationItems = [
    {
      name: "Goals",
      url: "/goals",
      description: "Set and track your goals",
      stars: goalsStars,
      id: "goals-card",
    },
    {
      name: "Academia",
      url: "/academia",
      description: "Store your academics in encrypted format",
      stars: academiaStars,
      id: "academia-card",
    },
  ];

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user) {
      // Only fetch admin-specific data if user is admin
      if (user.role === "admin") {
        fetchWaitlistUsers();
      }

      // Check if we should show streak bonus immediately
      // Check both user object and localStorage for streak info from login
      const checkStreakInfo = () => {
        if (
          user.loginStreakDay !== undefined &&
          user.loginStreakDay > 0 &&
          user.loginStreakClaimed === false
        ) {
          setShowStreakBonus(true);
        } else {
          // Also check localStorage for streak info from recent login
          const storedStreakInfo = localStorage.getItem("pendingStreakInfo");
          if (storedStreakInfo) {
            try {
              const streakInfo = JSON.parse(storedStreakInfo);
              if (streakInfo.currentDay > 0 && streakInfo.claimed === false) {
                setShowStreakBonus(true);
                // Clear stored info after showing
                localStorage.removeItem("pendingStreakInfo");
              }
            } catch {
              // Invalid JSON, clear it
              localStorage.removeItem("pendingStreakInfo");
            }
          }
        }
      };

      // Check immediately
      checkStreakInfo();
    }
  }, [isLoggedIn, authLoading, user, router]);

  const handleClaimSuccess = async (pointsAwarded?: number) => {
    // Show points animation if points were awarded
    if (pointsAwarded && pointsAwarded > 0) {
      setPointsAnimation({ points: pointsAwarded });
      setTimeout(() => setPointsAnimation(null), 2000);
    }
    // Refresh user data to get updated points and streak status
    await refreshPoints();
    await checkSession();
  };

  const fetchWaitlistUsers = async () => {
    setWaitlistLoading(true);
    try {
      const response = await apiCallWithAuth(API_ENDPOINTS.WAITLIST.LIST);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWaitlistUsers(data.data.entries);
        }
      }
    } catch (err) {
      console.error("Failed to fetch waitlist users:", err);
    } finally {
      setWaitlistLoading(false);
    }
  };

  // const handleImageClick = () => {
  //   fileInputRef.current?.click();
  // };

  // const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   // Validate file type
  //   if (!file.type.startsWith("image/")) {
  //     alert("Please select an image file");
  //     return;
  //   }

  //   // Validate file size (5MB)
  //   if (file.size > 5 * 1024 * 1024) {
  //     alert("File size must be less than 5MB");
  //     return;
  //   }

  //   setUploading(true);
  //   try {
  //     const formData = new FormData();
  //     formData.append("profilePicture", file);

  //     const token = localStorage.getItem("authToken");
  //     const response = await fetch(API_ENDPOINTS.AUTH.UPLOAD_PROFILE_PICTURE, {
  //       method: "POST",
  //       credentials: "include",
  //       headers: token
  //         ? {
  //             Authorization: `Bearer ${token}`,
  //           }
  //         : {},
  //       body: formData,
  //     });

  //     if (response.ok) {
  //       const data = await response.json();
  //       if (data.success && data.user) {
  //         setUser(data.user);
  //       }
  //     } else {
  //       const error = await response.json();
  //       alert(error.message || "Failed to upload profile picture");
  //     }
  //   } catch (err) {
  //     console.error("Error uploading profile picture:", err);
  //     alert("Failed to upload profile picture");
  //   } finally {
  //     setUploading(false);
  //     // Reset file input
  //     if (fileInputRef.current) {
  //       fileInputRef.current.value = "";
  //     }
  //   }
  // };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Dashboard"
        subtitle="Preparing your workspace..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  return (
    <DashboardLayout>
      {/* Points Animation - Top Center Popup */}
      {pointsAnimation && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-fade-in-down">
          <div
            className="px-6 py-3 shadow-lg bg-black dark:bg-white text-white dark:text-black"
            style={{ borderRadius: 0 }}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                +{pointsAnimation.points}
              </span>
              <span className="text-sm">points</span>
            </div>
          </div>
        </div>
      )}

      {/* Login Streak Bonus Modal */}
      {showStreakBonus && user && (
        <LoginStreakBonus
          streakInfo={{
            currentDay: user.loginStreakDay || 0,
            completed: user.loginStreakCompleted || false,
            claimed: user.loginStreakClaimed || false,
          }}
          userName={user.firstName}
          onClose={() => setShowStreakBonus(false)}
          onClaimSuccess={handleClaimSuccess}
        />
      )}

      <div className="my-2 lg:my-4 mb-24">
        {/* Header with Points */}
        <div className="mb-4 lg:mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
                Dashboard
              </h1>
              {/* Light mode hint - same row on desktop only */}
              <span className="hidden sm:inline text-sm text-gray-400 dark:hidden">
                Turn off the light to see the stars
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Points Display - Left */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-semibold text-black dark:text-white">
                  {(user?.points || 0).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  points
                </span>
              </div>
              {/* Shop Button - Right */}
              <Link
                href="/shop"
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:border-black dark:hover:border-gray-500 transition-colors whitespace-nowrap"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Shop
              </Link>
            </div>
          </div>
          {/* Light mode hint - below on mobile only */}
          <div className="sm:hidden">
            <span className="text-[12px] text-gray-400 dark:hidden">
              Turn off the light to see the stars
            </span>
          </div>
        </div>

        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes starTwinkle {
              0%, 100% {
                opacity: 0.3;
              }
              50% {
                opacity: 1;
              }
            }
            
            @keyframes starTwinkleBloom {
              0%, 100% {
                opacity: 0.4;
                box-shadow: 0 0 3px 1px rgba(59, 130, 246, 0.3), 0 0 6px 2px rgba(59, 130, 246, 0.15);
              }
              50% {
                opacity: 0.9;
                box-shadow: 0 0 4px 2px rgba(59, 130, 246, 0.4), 0 0 8px 3px rgba(59, 130, 246, 0.2);
              }
            }
            
            @keyframes starFadeIn {
              0% {
                opacity: 0;
                transform: scale(0);
              }
              100% {
                opacity: var(--star-opacity);
                transform: scale(1);
              }
            }
            
            .card-star-base {
              animation: starFadeIn 0.5s ease-out forwards, starTwinkleBloom var(--twinkle-duration) ease-in-out infinite;
              animation-delay: var(--appear-delay), var(--twinkle-delay);
              opacity: 0;
              transform: scale(1) translate(0, 0);
              transition: transform 0.3s ease-out;
              width: var(--mobile-size);
              height: var(--mobile-size);
              box-shadow: 0 0 3px 1px rgba(59, 130, 246, 0.25), 0 0 6px 2px rgba(59, 130, 246, 0.1);
            }
            
            .dark .card-star-base {
              animation: starFadeIn 0.5s ease-out forwards, starTwinkle var(--twinkle-duration) ease-in-out infinite;
              box-shadow: none;
            }
            
            @media (min-width: 768px) {
              .card-star-base {
                width: var(--desktop-size);
                height: var(--desktop-size);
              }
            }
            
            #goals-card:hover .card-star-base,
            #academia-card:hover .card-star-base {
              transform: scale(1) translate(var(--move-x), var(--move-y)) !important;
            }
          `,
          }}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6">
          {navigationItems.map((item) => {
            return (
              <Link
                key={item.url}
                href={item.url}
                id={item.id}
                className="group relative overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-black hover:border-blue-400 dark:hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-white/20 hover:scale-[1.02]"
              >
                {/* Starfield Background */}
                <div className="absolute inset-0 bg-white dark:bg-black">
                  {item.stars.map((star, index) => (
                    <div
                      key={index}
                      className={`card-star-base absolute rounded-full bg-blue-500 dark:bg-white ${
                        !star.showOnMobile
                          ? "hidden md:dark:block"
                          : "hidden dark:block"
                      }`}
                      style={
                        {
                          left: star.left,
                          top: star.top,
                          "--desktop-size": `${star.size}px`,
                          "--mobile-size": `${star.mobileSize}px`,
                          "--star-opacity": `${star.opacity}`,
                          "--appear-delay": `${star.delay * 0.1}s`,
                          "--twinkle-duration": `${star.twinkleDuration}s`,
                          "--twinkle-delay": `${star.twinkleDelay}s`,
                          "--move-x": `${star.moveX}px`,
                          "--move-y": `${star.moveY}px`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 md:p-8 flex flex-col items-center justify-center min-h-[120px] md:min-h-[180px]">
                  {/* Title */}
                  <h2 className="text-xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2 md:mb-3 group-hover:scale-105 transition-transform duration-300">
                    {item.name}
                  </h2>

                  {/* Description */}
                  <p className="text-xs md:text-base text-gray-600 dark:text-gray-300 text-center mb-2 md:mb-4 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {item.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transform group-hover:translate-x-2 transition-all duration-300 text-base md:text-lg">
                    →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Students Hub Section */}
        <Link
          href="/studentsHub"
          className="block mb-6 group w-full"
          id="students-hub-link"
        >
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @keyframes starTwinkleHub {
                0%, 100% {
                  opacity: 0.3;
                }
                50% {
                  opacity: 1;
                }
              }
              
              @keyframes starTwinkleBloomHub {
                0%, 100% {
                  opacity: 0.4;
                  box-shadow: 0 0 3px 1px rgba(59, 130, 246, 0.3), 0 0 6px 2px rgba(59, 130, 246, 0.15);
                }
                50% {
                  opacity: 0.9;
                  box-shadow: 0 0 4px 2px rgba(59, 130, 246, 0.4), 0 0 8px 3px rgba(59, 130, 246, 0.2);
                }
              }
              
              @keyframes starFadeInHub {
                0% {
                  opacity: 0;
                  transform: scale(0);
                }
                100% {
                  opacity: var(--star-opacity);
                  transform: scale(1);
                }
              }
              
              .star-base {
                animation: starFadeInHub 0.5s ease-out forwards, starTwinkleBloomHub var(--twinkle-duration) ease-in-out infinite;
                animation-delay: var(--appear-delay), var(--twinkle-delay);
                opacity: 0;
                transform: scale(1) translate(0, 0);
                transition: transform 0.3s ease-out;
                width: var(--mobile-size);
                height: var(--mobile-size);
                box-shadow: 0 0 3px 1px rgba(59, 130, 246, 0.25), 0 0 6px 2px rgba(59, 130, 246, 0.1);
              }
              
              .dark .star-base {
                animation: starFadeInHub 0.5s ease-out forwards, starTwinkleHub var(--twinkle-duration) ease-in-out infinite;
                box-shadow: none;
              }
              
              @media (min-width: 768px) {
                .star-base {
                  width: var(--desktop-size);
                  height: var(--desktop-size);
                }
              }
              
              #students-hub-link:hover .star-base {
                transform: scale(1) translate(var(--move-x), var(--move-y)) !important;
              }
            `,
            }}
          />
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-6 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 hover:border-blue-400 dark:hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-white/20 hover:scale-[1.02] relative overflow-hidden">
            {/* Starfield Background */}
            <div className="absolute inset-0 bg-white dark:bg-black">
              {stars.map((star, index) => (
                <div
                  key={index}
                  className={`star-base absolute rounded-full bg-blue-500 dark:bg-white ${
                    !star.showOnMobile
                      ? "hidden md:dark:block"
                      : "hidden dark:block"
                  }`}
                  style={
                    {
                      left: star.left,
                      top: star.top,
                      "--desktop-size": `${star.size}px`,
                      "--mobile-size": `${star.mobileSize}px`,
                      "--star-opacity": `${star.opacity}`,
                      "--appear-delay": `${star.delay * 0.1}s`,
                      "--twinkle-duration": `${star.twinkleDuration}s`,
                      "--twinkle-delay": `${star.twinkleDelay}s`,
                      "--move-x": `${star.moveX}px`,
                      "--move-y": `${star.moveY}px`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>

            {/* Content */}
            <div className="relative z-10">
              {/* Rocket - Vertically centered, horizontally on right */}
              <div className="flex absolute top-1/2 right-2 md:right-8 lg:right-12 transform -translate-y-1/2 z-0 pointer-events-none">
                <div className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  🚀
                </div>
              </div>

              {/* Text Content */}
              <div className="relative z-10 pr-16 md:pr-0">
                <div className="mb-3 md:mb-6">
                  <h2 className="text-2xl md:text-5xl lg:text-6xl font-light text-gray-900 dark:text-white mb-1 md:mb-3 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    Students Hub
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 text-xs md:text-lg mb-2 md:mb-4">
                    Explore all the amazing benefits and features available to
                    you
                  </p>
                </div>

                <div className="flex items-center text-xs md:text-lg text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  <span className="mr-2">Discover Benefits</span>
                  <span className="transform group-hover:translate-x-2 transition-transform duration-300">
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Leaderboard Section */}
        <Link
          href="/leaderboard"
          className="block mb-6 group w-full"
          id="leaderboard-link"
        >
          <div className="border-2 border-yellow-400/60 dark:border-yellow-400/50 bg-gradient-to-br from-white via-yellow-50/30 to-amber-50/40 dark:from-gray-900 dark:via-yellow-950/30 dark:to-amber-950/20 px-6 py-8 md:px-12 md:py-10 lg:px-16 lg:py-12 hover:border-yellow-500 dark:hover:border-yellow-300 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/30 dark:hover:shadow-yellow-400/30 hover:scale-[1.02] relative overflow-hidden ring-1 ring-yellow-300/20 dark:ring-yellow-500/10 mb-24">
            {/* Golden gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 via-transparent to-amber-400/10 dark:from-yellow-500/5 dark:via-transparent dark:to-amber-500/5"></div>

            {/* Content */}
            <div className="relative z-10">
              {/* Detailed Trophy Icon - Vertically centered, horizontally aligned with rocket */}
              <div className="flex absolute top-1/2 right-2 md:right-8 lg:right-12 transform -translate-y-1/2 z-0 pointer-events-none">
                <div className="w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 xl:w-40 xl:h-40 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300 relative">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-yellow-400/30 dark:bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-400/50 dark:group-hover:bg-yellow-500/30 transition-all duration-300"></div>

                  {/* Detailed Trophy SVG */}
                  <svg
                    viewBox="0 0 200 250"
                    className="w-full h-full relative z-10"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Defs for gradients and filters */}
                    <defs>
                      {/* Golden gradient */}
                      <linearGradient
                        id="trophyGold"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
                        <stop
                          offset="30%"
                          stopColor="#FFA500"
                          stopOpacity="1"
                        />
                        <stop
                          offset="60%"
                          stopColor="#FFD700"
                          stopOpacity="1"
                        />
                        <stop
                          offset="100%"
                          stopColor="#B8860B"
                          stopOpacity="1"
                        />
                      </linearGradient>

                      {/* Highlight gradient */}
                      <linearGradient
                        id="trophyHighlight"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#FFF8DC"
                          stopOpacity="0.8"
                        />
                        <stop
                          offset="100%"
                          stopColor="#FFD700"
                          stopOpacity="0.3"
                        />
                      </linearGradient>

                      {/* Shadow gradient */}
                      <linearGradient
                        id="trophyShadow"
                        x1="0%"
                        y1="0%"
                        x2="0%"
                        y2="100%"
                      >
                        <stop
                          offset="0%"
                          stopColor="#000000"
                          stopOpacity="0.3"
                        />
                        <stop
                          offset="100%"
                          stopColor="#000000"
                          stopOpacity="0.1"
                        />
                      </linearGradient>

                      {/* Glow filter */}
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Base/Pedestal */}
                    <ellipse
                      cx="100"
                      cy="240"
                      rx="70"
                      ry="15"
                      fill="url(#trophyShadow)"
                      opacity="0.4"
                    />
                    <rect
                      x="60"
                      y="200"
                      width="80"
                      height="40"
                      rx="5"
                      fill="url(#trophyGold)"
                    />
                    <rect
                      x="65"
                      y="205"
                      width="70"
                      height="30"
                      rx="3"
                      fill="url(#trophyHighlight)"
                      opacity="0.4"
                    />

                    {/* Cup body */}
                    <path
                      d="M 80 60 Q 80 40 100 40 Q 120 40 120 60 L 120 180 Q 120 200 100 200 Q 80 200 80 180 Z"
                      fill="url(#trophyGold)"
                      filter="url(#glow)"
                    />

                    {/* Cup highlight */}
                    <path
                      d="M 85 65 Q 85 50 100 50 Q 115 50 115 65 L 115 175 Q 115 190 100 190 Q 85 190 85 175 Z"
                      fill="url(#trophyHighlight)"
                      opacity="0.6"
                    />

                    {/* Left handle */}
                    <path
                      d="M 80 80 Q 50 80 50 120 Q 50 160 80 160"
                      fill="none"
                      stroke="url(#trophyGold)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 75 85 Q 55 85 55 120 Q 55 155 75 155"
                      fill="none"
                      stroke="url(#trophyHighlight)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.7"
                    />

                    {/* Right handle */}
                    <path
                      d="M 120 80 Q 150 80 150 120 Q 150 160 120 160"
                      fill="none"
                      stroke="url(#trophyGold)"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 125 85 Q 145 85 145 120 Q 145 155 125 155"
                      fill="none"
                      stroke="url(#trophyHighlight)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.7"
                    />

                    {/* Crown/Star on top */}
                    <g transform="translate(100, 30)">
                      {/* Center star */}
                      <path
                        d="M 0 -15 L 4 -4 L 15 -4 L 6 2 L 9 13 L 0 7 L -9 13 L -6 2 L -15 -4 L -4 -4 Z"
                        fill="#FFD700"
                        stroke="#FFA500"
                        strokeWidth="1"
                      />
                      {/* Left small star */}
                      <path
                        d="M -20 -5 L -18 0 L -13 0 L -16 3 L -15 8 L -20 5 L -25 8 L -24 3 L -27 0 L -22 0 Z"
                        fill="#FFD700"
                        opacity="0.8"
                      />
                      {/* Right small star */}
                      <path
                        d="M 20 -5 L 22 0 L 27 0 L 24 3 L 25 8 L 20 5 L 15 8 L 16 3 L 13 0 L 18 0 Z"
                        fill="#FFD700"
                        opacity="0.8"
                      />
                    </g>

                    {/* Sparkles/Shine effects */}
                    <circle cx="90" cy="100" r="3" fill="#FFF8DC" opacity="0.9">
                      <animate
                        attributeName="opacity"
                        values="0.3;1;0.3"
                        dur="2s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx="110"
                      cy="120"
                      r="2.5"
                      fill="#FFF8DC"
                      opacity="0.8"
                    >
                      <animate
                        attributeName="opacity"
                        values="0.3;1;0.3"
                        dur="2.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle cx="95" cy="140" r="2" fill="#FFF8DC" opacity="0.7">
                      <animate
                        attributeName="opacity"
                        values="0.3;1;0.3"
                        dur="1.8s"
                        repeatCount="indefinite"
                      />
                    </circle>

                    {/* Rim highlight */}
                    <ellipse
                      cx="100"
                      cy="60"
                      rx="20"
                      ry="3"
                      fill="url(#trophyHighlight)"
                      opacity="0.8"
                    />
                  </svg>
                </div>
              </div>

              {/* Text Content */}
              <div className="relative z-10 pr-16 md:pr-0">
                <div className="mb-3 md:mb-6">
                  <h2 className="text-2xl md:text-5xl lg:text-6xl font-light text-yellow-900 dark:text-yellow-200 mb-1 md:mb-3 group-hover:text-yellow-800 dark:group-hover:text-yellow-100 transition-colors">
                    Leaderboard
                  </h2>
                  <p className="text-yellow-700 dark:text-yellow-300 text-xs md:text-lg mb-2 md:mb-4">
                    Compete with others and see who&apos;s on top this week
                  </p>
                </div>

                <div className="flex items-center text-xs md:text-lg text-yellow-700 dark:text-yellow-300 group-hover:text-yellow-800 dark:group-hover:text-yellow-200 transition-colors">
                  <span className="mr-2">View Rankings</span>
                  <span className="transform group-hover:translate-x-2 transition-transform duration-300">
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {user?.role === "admin" && (
          <WaitlistUsersSection
            waitlistUsers={waitlistUsers}
            waitlistLoading={waitlistLoading}
            onRefresh={fetchWaitlistUsers}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
