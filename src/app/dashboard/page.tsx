"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import LoginStreakBonus from "@/components/LoginStreakBonus";
import {
  DashboardLayout,
  SignupToggleSection,
  SigninToggleSection,
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
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [signupToggleLoading, setSignupToggleLoading] = useState(false);
  const [signinEnabled, setSigninEnabled] = useState(true);
  const [signinToggleLoading, setSigninToggleLoading] = useState(false);
  const [showStreakBonus, setShowStreakBonus] = useState(false);
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
        fetchSignupStatus();
        fetchSigninStatus();
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

  const handleClaimSuccess = async () => {
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

  const fetchSignupStatus = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.SIGNUP_STATUS);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSignupEnabled(data.enabled);
        }
      }
    } catch (err) {
      console.error("Failed to fetch signup status:", err);
    }
  };

  const fetchSigninStatus = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.SIGNIN_STATUS);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSigninEnabled(data.enabled);
        }
      }
    } catch (err) {
      console.error("Failed to fetch signin status:", err);
    }
  };

  const toggleSignup = async () => {
    setSignupToggleLoading(true);
    try {
      const response = await apiCallWithAuth(API_ENDPOINTS.AUTH.TOGGLE_SIGNUP, {
        method: "POST",
        body: JSON.stringify({ enabled: !signupEnabled }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSignupEnabled(!signupEnabled);
        }
      } else {
        console.error(
          "Toggle signup failed:",
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      console.error("Failed to toggle signup:", err);
    } finally {
      setSignupToggleLoading(false);
    }
  };

  const toggleSignin = async () => {
    setSigninToggleLoading(true);
    try {
      const response = await apiCallWithAuth(API_ENDPOINTS.AUTH.TOGGLE_SIGNIN, {
        method: "POST",
        body: JSON.stringify({ enabled: !signinEnabled }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSigninEnabled(!signinEnabled);
        }
      } else {
        console.error(
          "Toggle signin failed:",
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      console.error("Failed to toggle signin:", err);
    } finally {
      setSigninToggleLoading(false);
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

      <div className="mt-2">
        {/* Header with Points */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl md:text-2xl font-light text-black dark:text-white">
                Dashboard
              </h1>
              {/* Light mode hint - same row on desktop only */}
              <span className="hidden sm:inline text-sm text-gray-400 dark:hidden">
                Turn off the light to see the stars
              </span>
            </div>
            <Link
              href="/shop"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="text-sm font-semibold text-black dark:text-white">
                {(user?.points || 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                points
              </span>
            </Link>
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
          <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black px-6 py-8 md:p-12 lg:p-16 hover:border-blue-400 dark:hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-white/20 hover:scale-[1.02] relative overflow-hidden">
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
              <div className="relative z-10 pr-12 md:pr-0">
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

        {user?.role === "admin" && (
          <>
            <SigninToggleSection
              signinEnabled={signinEnabled}
              signinToggleLoading={signinToggleLoading}
              onToggleSignin={toggleSignin}
            />

            <SignupToggleSection
              signupEnabled={signupEnabled}
              signupToggleLoading={signupToggleLoading}
              onToggleSignup={toggleSignup}
            />

            <WaitlistUsersSection
              waitlistUsers={waitlistUsers}
              waitlistLoading={waitlistLoading}
              onRefresh={fetchWaitlistUsers}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
