"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
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

interface NavigationItem {
  name: string;
  url: string;
}

export default function Dashboard() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [signupToggleLoading, setSignupToggleLoading] = useState(false);
  // const [uploading, setUploading] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);

  // Navigation items array
  const navigationItems: NavigationItem[] = [
    { name: "Goals", url: "/goals" },
    { name: "Quizzes", url: "/quizzes" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {navigationItems.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className="border border-gray-200 dark:border-gray-800 p-8 bg-white dark:bg-gray-800 rounded hover:border-gray-300 dark:hover:border-gray-700 transition-colors flex items-center justify-center min-h-[120px]"
            >
              <h2 className="text-2xl font-light text-black dark:text-white">
                {item.name}
              </h2>
            </Link>
          ))}
        </div>

        {/* Students Hub Section */}
        <Link href="/studentsHub" className="block mb-6 group">
          <div className="border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-8 hover:border-black dark:hover:border-white transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden">
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-3xl font-light text-black dark:text-white mb-2 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    Students Hub
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    Explore all the amazing benefits and features available to
                    you
                  </p>
                </div>
                <div className="text-4xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                  🚀
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                <span className="mr-2">Discover Benefits</span>
                <span className="transform group-hover:translate-x-2 transition-transform duration-300">
                  →
                </span>
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
