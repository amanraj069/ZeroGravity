"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  DashboardLayout,
  SignupToggleSection,
  WaitlistUsersSection,
  type WaitlistUser,
} from "@/components/dashboard";

export default function Dashboard() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [signupToggleLoading, setSignupToggleLoading] = useState(false);
  // const [uploading, setUploading] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate random stars for Students Hub background
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1, // Random size between 1-4px
      opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2-1
      delay: Math.random() * 3, // Random animation delay for appearing
      twinkleDuration: 2 + Math.random() * 3, // Random twinkle duration between 2-5s
      twinkleDelay: Math.random() * 2, // Random delay for twinkling animation
      moveX: (Math.random() - 0.5) * 40, // Random X movement between -20px to 20px
      moveY: (Math.random() - 0.5) * 40, // Random Y movement between -20px to 20px
    }));
  }, []);

  // Generate random stars for Goals card
  const goalsStars = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // Random size between 1-3px
      opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2-1
      delay: Math.random() * 2.5,
      twinkleDuration: 2 + Math.random() * 3,
      twinkleDelay: Math.random() * 2,
      moveX: (Math.random() - 0.5) * 30,
      moveY: (Math.random() - 0.5) * 30,
    }));
  }, []);

  // Generate random stars for Academia card
  const academiaStars = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1, // Random size between 1-3px
      opacity: Math.random() * 0.8 + 0.2, // Random opacity between 0.2-1
      delay: Math.random() * 2.5,
      twinkleDuration: 2 + Math.random() * 3,
      twinkleDelay: Math.random() * 2,
      moveX: (Math.random() - 0.5) * 30,
      moveY: (Math.random() - 0.5) * 30,
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
      }
    }
  }, [isLoggedIn, authLoading, user, router]);

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
      <div className="mt-4">
        <style
          dangerouslySetInnerHTML={{
            __html: `
            @keyframes starTwinkle {
              0%, 100% {
                opacity: 0.2;
              }
              50% {
                opacity: 1;
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
              animation: starFadeIn 0.5s ease-out forwards, starTwinkle var(--twinkle-duration) ease-in-out infinite;
              animation-delay: var(--appear-delay), var(--twinkle-delay);
              opacity: 0;
              transform: scale(1) translate(0, 0);
              transition: transform 0.3s ease-out;
            }
            
            #goals-card:hover .card-star-base,
            #academia-card:hover .card-star-base {
              transform: scale(1) translate(var(--move-x), var(--move-y)) !important;
            }
          `,
          }}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {navigationItems.map((item) => {
            return (
              <Link
                key={item.url}
                href={item.url}
                id={item.id}
                className="group relative overflow-hidden border-2 border-gray-300 dark:border-gray-700 bg-black hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-white/20 hover:scale-[1.02] rounded-lg"
              >
                {/* Starfield Background */}
                <div className="absolute inset-0 bg-black">
                  {item.stars.map((star, index) => (
                    <div
                      key={index}
                      className="card-star-base absolute rounded-full bg-white"
                      style={
                        {
                          left: star.left,
                          top: star.top,
                          width: `${star.size}px`,
                          height: `${star.size}px`,
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
                <div className="relative z-10 p-8 flex flex-col items-center justify-center min-h-[180px]">
                  {/* Title */}
                  <h2 className="text-2xl md:text-3xl font-light text-white mb-3 group-hover:scale-105 transition-transform duration-300">
                    {item.name}
                  </h2>

                  {/* Description */}
                  <p className="text-sm md:text-base text-gray-300 text-center mb-4 group-hover:text-white transition-colors">
                    {item.description}
                  </p>

                  {/* Arrow indicator */}
                  <div className="text-gray-300 group-hover:text-white transform group-hover:translate-x-2 transition-all duration-300 text-lg">
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
              @keyframes starTwinkle {
                0%, 100% {
                  opacity: 0.2;
                }
                50% {
                  opacity: 1;
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
              
              .star-base {
                animation: starFadeIn 0.5s ease-out forwards, starTwinkle var(--twinkle-duration) ease-in-out infinite;
                animation-delay: var(--appear-delay), var(--twinkle-delay);
                opacity: 0;
                transform: scale(1) translate(0, 0);
                transition: transform 0.3s ease-out;
              }
              
              #students-hub-link:hover .star-base {
                transform: scale(1) translate(var(--move-x), var(--move-y)) !important;
              }
            `,
            }}
          />
          <div className="border-2 border-gray-300 dark:border-gray-700 bg-black p-10 md:p-12 lg:p-16 hover:border-white transition-all duration-300 hover:shadow-xl hover:shadow-white/20 hover:scale-[1.02] relative overflow-hidden">
            {/* Starfield Background */}
            <div className="absolute inset-0 bg-black">
              {stars.map((star, index) => (
                <div
                  key={index}
                  className="star-base absolute rounded-full bg-white"
                  style={
                    {
                      left: star.left,
                      top: star.top,
                      width: `${star.size}px`,
                      height: `${star.size}px`,
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
              {/* Rocket - Vertically centered, horizontally on right, hidden on mobile */}
              <div className="hidden md:flex absolute top-1/2 right-8 lg:right-12 transform -translate-y-1/2 z-0 pointer-events-none">
                <div className="text-6xl lg:text-7xl xl:text-8xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  🚀
                </div>
              </div>

              {/* Text Content */}
              <div className="relative z-10">
                <div className="mb-6">
                  <h2 className="text-4xl md:text-5xl lg:text-6xl font-light text-white mb-3 group-hover:text-white transition-colors">
                    Students Hub
                  </h2>
                  <p className="text-gray-300 text-base md:text-lg mb-4">
                    Explore all the amazing benefits and features available to
                    you
                  </p>
                </div>

                <div className="flex items-center text-base md:text-lg text-gray-300 group-hover:text-white transition-colors">
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
