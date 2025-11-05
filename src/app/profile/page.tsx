"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Link from "next/link";
import { Flame } from "lucide-react";

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveTasks: number;
  completedToday: number;
}

export default function Profile() {
  const { user, isLoggedIn, isLoading: authLoading, setUser } = useAuth();
  const router = useRouter();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user) {
      fetchStreakInfo();
    }
  }, [isLoggedIn, authLoading, user, router]);

  const fetchStreakInfo = async () => {
    setStreakLoading(true);
    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.DAILY_TASKS.STREAK_INFO
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStreakInfo(data.data);
        }
      }
    } catch (err) {
      console.error("Failed to fetch streak info:", err);
    } finally {
      setStreakLoading(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const token = localStorage.getItem("authToken");
      const response = await fetch(API_ENDPOINTS.AUTH.UPLOAD_PROFILE_PICTURE, {
        method: "POST",
        credentials: "include",
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        }
      } else {
        const error = await response.json();
        alert(error.message || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("Error uploading profile picture:", err);
      alert("Failed to upload profile picture");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Profile"
        subtitle="Fetching your profile..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <DashboardLayout>
        <div className="mt-4 mb-20 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-light text-black dark:text-white">
              Profile
            </h1>
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>

          {/* Profile Card */}
          <div className="border border-gray-200 dark:border-gray-800 p-8 bg-white dark:bg-gray-800 rounded">
            {/* Profile Header with Stats */}
            <div className="mb-8 flex items-start gap-8">
              {/* Left Side: Profile Picture and Name */}
              <div className="flex flex-col items-start">
                {/* Profile Picture */}
                <div className="relative group mb-4">
                  <div className="w-40 h-40 rounded overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-5xl font-light text-gray-400 dark:text-gray-500">
                        {user.firstName.charAt(0).toUpperCase()}
                        {user.lastName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {/* Edit Button */}
                  <button
                    onClick={handleImageClick}
                    disabled={uploading}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                    title="Edit profile picture"
                  >
                    {uploading ? (
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>

                {/* Name and Username */}
                <div>
                  <h2 className="text-2xl font-light text-black dark:text-white mb-2">
                    {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* Right Side: Stats Grid */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                {/* Current Streak */}
                <div className="relative border border-orange-200 dark:border-orange-900/50 p-6 rounded-lg bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 overflow-hidden group hover:shadow-lg transition-shadow">
                  {/* Fire effect background */}
                  <div className="absolute inset-0 opacity-10 dark:opacity-5">
                    <div className="absolute top-0 left-1/4 w-16 h-16 bg-orange-400 rounded-full blur-2xl animate-pulse"></div>
                    <div
                      className="absolute bottom-0 right-1/4 w-20 h-20 bg-red-400 rounded-full blur-3xl animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="absolute top-1/2 right-0 w-12 h-12 bg-yellow-400 rounded-full blur-xl animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400 animate-pulse" />
                      <div className="text-sm font-medium text-orange-700 dark:text-orange-400">
                        Current Streak
                      </div>
                    </div>
                    {streakLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                        <span className="text-2xl font-light text-gray-600 dark:text-gray-400">
                          Loading...
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                          {streakInfo?.currentStreak ?? 0}
                        </div>
                        <span className="text-lg text-orange-600 dark:text-orange-400 font-medium">
                          days
                        </span>
                        {(streakInfo?.currentStreak ?? 0) > 0 && (
                          <div className="flex gap-1 ml-2">
                            <Flame className="w-5 h-5 text-orange-500 dark:text-orange-400 animate-pulse" />
                            <Flame
                              className="w-4 h-4 text-red-500 dark:text-red-400 animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <Flame
                              className="w-3 h-3 text-yellow-500 dark:text-yellow-400 animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Highest Streak */}
                <div className="relative border border-purple-200 dark:border-purple-900/50 p-6 rounded-lg bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 overflow-hidden group hover:shadow-lg transition-shadow">
                  {/* Fire effect background */}
                  <div className="absolute inset-0 opacity-10 dark:opacity-5">
                    <div className="absolute top-0 right-1/4 w-16 h-16 bg-purple-400 rounded-full blur-2xl animate-pulse"></div>
                    <div
                      className="absolute bottom-0 left-1/4 w-20 h-20 bg-pink-400 rounded-full blur-3xl animate-pulse"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="absolute top-1/2 left-0 w-12 h-12 bg-orange-400 rounded-full blur-xl animate-pulse"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-pulse" />
                      <div className="text-sm font-medium text-purple-700 dark:text-purple-400">
                        Highest Streak
                      </div>
                    </div>
                    {streakLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                        <span className="text-2xl font-light text-gray-600 dark:text-gray-400">
                          Loading...
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-2">
                        <div className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                          {streakInfo?.longestStreak ?? 0}
                        </div>
                        <span className="text-lg text-purple-600 dark:text-purple-400 font-medium">
                          days
                        </span>
                        {(streakInfo?.longestStreak ?? 0) > 0 && (
                          <div className="flex gap-1 ml-2">
                            <Flame className="w-5 h-5 text-purple-500 dark:text-purple-400 animate-pulse" />
                            <Flame
                              className="w-4 h-4 text-pink-500 dark:text-pink-400 animate-pulse"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <Flame
                              className="w-3 h-3 text-orange-500 dark:text-orange-400 animate-pulse"
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Active Tasks */}
                {streakInfo && (
                  <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="text-2xl font-light text-black dark:text-white mb-1">
                      {streakInfo.totalActiveTasks}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Active Tasks
                    </div>
                  </div>
                )}

                {/* Completed Today */}
                {streakInfo && (
                  <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded">
                    <div className="text-2xl font-light text-black dark:text-white mb-1">
                      {streakInfo.completedToday}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Completed Today
                    </div>
                  </div>
                )}

                {/* Placeholder for when streakInfo is not loaded */}
                {!streakInfo && streakLoading && (
                  <>
                    <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                        <span className="text-2xl font-light text-gray-600 dark:text-gray-400">
                          Loading...
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Active Tasks
                      </div>
                    </div>
                    <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                        <span className="text-2xl font-light text-gray-600 dark:text-gray-400">
                          Loading...
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Completed Today
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Email
                </label>
                <div className="text-base text-black dark:text-white">
                  {user.email}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Role
                  </label>
                  <div className="text-base text-black dark:text-white capitalize">
                    {user.role}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Subscription
                  </label>
                  <div className="text-base text-black dark:text-white capitalize">
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm ${
                        user.subscription === "pro"
                          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {user.subscription}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Member Since
                </label>
                <div className="text-base text-black dark:text-white">
                  {formatDate(user.createdAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Account Status
                </label>
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded text-sm ${
                      user.isActive
                        ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );
}
