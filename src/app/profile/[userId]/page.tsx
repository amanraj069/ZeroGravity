"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Image from "next/image";
import { Flame } from "lucide-react";
import ActivityGraph from "@/components/ActivityGraph";
import {
  profileService,
  PublicProfileResponse,
} from "@/services/profileService";
import { getBorderStyle, getAnimationClass } from "@/services/shopService";

export default function PublicProfile() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [profileData, setProfileData] = useState<PublicProfileResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await profileService.getPublicProfile(userId);
      setProfileData(data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && userId) {
      fetchProfile();
    }
  }, [isLoggedIn, authLoading, userId, router, fetchProfile]);

  if (authLoading || loading) {
    return (
      <ZeroGravityLoading
        title="Loading Profile"
        subtitle="Fetching profile information..."
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

  if (error || !profileData) {
    return (
      <DashboardLayout>
        <div className="mt-2 space-y-3 md:space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
            <h1 className="text-xl md:text-2xl font-semibold text-black dark:text-white mb-2">
              Profile Not Found
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error || "The user profile you're looking for doesn't exist."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { user, streakInfo } = profileData;

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
      <div className="mt-2 space-y-3 md:space-y-4">
        {/* Profile Info Card */}
        <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-4 md:gap-6">
            {/* Profile Picture */}
            <div className="relative group flex-shrink-0">
              <div
                className={`w-20 h-20 md:w-32 md:h-32 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${getAnimationClass(
                  user.equippedBorder || ""
                )}`}
                style={getBorderStyle(user.equippedBorder || "default")}
              >
                {user.profilePicture ? (
                  <Image
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl md:text-4xl font-light text-gray-400 dark:text-gray-500">
                    {user.firstName.charAt(0).toUpperCase()}
                    {user.lastName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Name and Username */}
            <div className="flex-1 min-w-0 text-right md:text-left">
              <h2 className="text-lg md:text-2xl font-semibold text-black dark:text-white truncate">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                @{user.username}
              </p>
              {/* Mobile: Show stats below username */}
              <div className="flex items-center gap-4 mt-2 md:hidden justify-end">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-black dark:text-white">
                    {streakInfo?.totalActiveTasks ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-semibold text-black dark:text-white">
                    {streakInfo?.completedToday ?? 0}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Today
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop: Active Tasks & Completed Today on far right */}
            <div className="hidden md:flex gap-6 pr-4">
              <div className="text-center">
                <div className="text-3xl font-light text-black dark:text-white">
                  {streakInfo?.totalActiveTasks ?? 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Active Tasks
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-light text-black dark:text-white">
                  {streakInfo?.completedToday ?? 0}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Completed Today
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Graph */}
        <ActivityGraph joinedDate={user.createdAt} userId={user.userId} />

        {/* Streak Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Current Streak */}
          <div className="relative border border-orange-200 dark:border-orange-900/50 p-3 md:p-4 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 overflow-hidden group hover:shadow-lg transition-shadow">
            {/* Fire effect background */}
            <div className="absolute inset-0 opacity-10 dark:opacity-5">
              <div className="absolute top-0 left-1/4 w-16 h-16 bg-orange-400 rounded-full blur-2xl animate-pulse"></div>
              <div
                className="absolute bottom-0 right-1/4 w-20 h-20 bg-red-400 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="text-sm md:text-base font-medium text-orange-700 dark:text-orange-400">
                Current Streak
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                  {streakInfo?.currentStreak ?? 0}
                </div>
                <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-400 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Highest Streak */}
          <div className="relative border border-purple-200 dark:border-purple-900/50 p-3 md:p-4 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 overflow-hidden group hover:shadow-lg transition-shadow">
            {/* Fire effect background */}
            <div className="absolute inset-0 opacity-10 dark:opacity-5">
              <div className="absolute top-0 right-1/4 w-16 h-16 bg-purple-400 rounded-full blur-2xl animate-pulse"></div>
              <div
                className="absolute bottom-0 left-1/4 w-20 h-20 bg-pink-400 rounded-full blur-3xl animate-pulse"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>

            <div className="relative z-10 flex items-center justify-between">
              <div className="text-sm md:text-base font-medium text-purple-700 dark:text-purple-400">
                Highest Streak
              </div>
              <div className="flex items-center gap-1 md:gap-2">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                  {streakInfo?.longestStreak ?? 0}
                </div>
                <Flame className="w-5 h-5 md:w-6 md:h-6 text-purple-500 dark:text-purple-400 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
          <div className="space-y-4">
            {/* Role & Subscription Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Role
                </label>
                <div className="text-sm text-black dark:text-white capitalize">
                  {user.role}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Subscription
                </label>
                <span
                  className={`inline-block px-2 py-0.5 text-xs ${
                    user.subscription === "pro"
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  }`}
                >
                  {user.subscription}
                </span>
              </div>
            </div>

            {/* Member Since & Status Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Member Since
                </label>
                <div className="text-sm text-black dark:text-white">
                  {formatDate(user.createdAt)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Account Status
                </label>
                <span
                  className={`inline-block px-2 py-0.5 text-xs ${
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
