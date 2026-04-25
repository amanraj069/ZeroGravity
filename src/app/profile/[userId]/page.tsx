"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Link from "next/link";
import Image from "next/image";
import { Flame, Eye, ShoppingBag, Share2, ChevronLeft } from "lucide-react";
import ActivityGraph from "@/components/ActivityGraph";
import {
  profileService,
  PublicProfileResponse,
} from "@/services/profileService";
import { getBorderStyle, getAnimationClass } from "@/services/shopService";
import {
  fetchBadgeProgress,
  getHighestBadge,
  BADGE_VISUALS,
  BadgeData,
} from "@/services/badgeService";
import { RandomStars } from "@/components/RandomStars";

export default function PublicProfile() {
  const { user: currentUser, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [profileData, setProfileData] = useState<PublicProfileResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [copied, setCopied] = useState(false);

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
      fetchBadgeProgress().then(setBadgeData);
    }
  }, [isLoggedIn, authLoading, userId, router, fetchProfile]);

  const handleShareProfile = async () => {
    if (!userId) return;
    const profileUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy profile link:", err);
    }
  };

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
      <div className="space-y-3 md:space-y-4 pb-12 pt-2 lg:pt-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 lg:mb-6">
          <div className="flex items-center justify-between sm:justify-start sm:gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mr-1"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
              Profile
            </h1>
            {currentUser?.userId === user.userId && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  <span className="text-sm font-semibold text-black dark:text-white">
                    {(user.points || 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    points
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            {currentUser?.userId === user.userId && (
              <Link
                href="/shop"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                <ShoppingBag className="w-3 h-3 flex-shrink-0" />
                Shop
              </Link>
            )}
            {currentUser?.userId === user.userId && (
              <Link
                href="/profile/edit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>
        </div>

        {/* Top Sections: 60% / 40% Split */}
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4">
          {/* Left Section (60%) */}
          <div className="w-full lg:w-[60%] border border-gray-200 dark:border-gray-800 p-3 md:p-5 bg-white dark:bg-gray-800 relative flex flex-col justify-center">
            <button
              onClick={handleShareProfile}
              className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-full z-10 group p-0 shadow-sm"
              title="Share profile link"
            >
              <Share2 className="w-3.5 h-3.5 m-0" />
              {copied && (
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                  Copied!
                </span>
              )}
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 w-full h-full relative">
              <div className="flex flex-row items-center gap-3 lg:gap-6 w-full sm:w-auto mt-1 sm:mt-0">
                {/* Profile Picture */}
                <div className="relative group flex-shrink-0">
                  <div
                    className={`w-24 h-24 md:w-32 lg:w-40 md:h-32 lg:h-40 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0 ${getAnimationClass(
                      user.equippedBorder || ""
                    )}`}
                    style={getBorderStyle(user.equippedBorder || "default")}
                  >
                    {user.profilePicture ? (
                      <Image
                        src={user.profilePicture}
                        alt={`${user.firstName} ${user.lastName}`}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-3xl md:text-5xl font-light text-gray-400 dark:text-gray-500">
                        {user.firstName.charAt(0).toUpperCase()}
                        {user.lastName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>

                {/* Name and Username */}
                <div className="flex-1 min-w-0 text-left flex flex-col justify-center h-full">
                  <div className="flex flex-col gap-1 md:gap-1.5 mb-1 md:mb-1.5 py-1 items-start">
                    <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </h2>
                    {user.highestBadgeId && (
                      <div className="flex">
                        <div
                          className={`inline-flex flex-shrink-0 items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r ${BADGE_VISUALS[user.highestBadgeId].bgLight} ${BADGE_VISUALS[user.highestBadgeId].bgDark} rounded whitespace-nowrap`}
                          title={`Highest Badge: ${user.highestBadgeId}`}
                        >
                          <span
                            className={`text-[11px] font-bold bg-gradient-to-r ${BADGE_VISUALS[user.highestBadgeId].gradient} bg-clip-text text-transparent`}
                          >
                            {BADGE_VISUALS[user.highestBadgeId].icon}
                          </span>
                          <span
                            className={`text-[10px] font-semibold ${BADGE_VISUALS[user.highestBadgeId].textColor}`}
                          >
                            {badgeData?.badges.find(b => b.id === user.highestBadgeId)?.name || user.highestBadgeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>

                  <div className="hidden sm:flex items-center justify-start gap-4 md:gap-8 mt-3 md:mt-5">
                    <div className="flex flex-col items-start gap-0.5 md:gap-1 p-1.5 md:p-2 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-md min-w-[100px] md:min-w-[120px]">
                      <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Active Tasks
                      </span>
                      <span className="text-lg md:text-2xl font-bold text-black dark:text-white leading-none">
                        {streakInfo?.totalActiveTasks ?? 0}
                      </span>
                    </div>
                    <div className="flex flex-col items-start gap-0.5 md:gap-1 p-1.5 md:p-2 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-md min-w-[100px] md:min-w-[120px]">
                      <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Completed
                      </span>
                      <span className="text-lg md:text-2xl font-bold text-black dark:text-white leading-none">
                        {streakInfo?.completedToday ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section (40%) - Badges & Streak */}
          <div className="w-full lg:w-[40%] flex flex-col gap-3 md:gap-4 justify-between">
            {/* Badges Strip */}
            <div className="flex-1 relative border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-800/60 overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-all group flex flex-col justify-center min-h-[140px]">
              <div className="flex items-center justify-between mb-2 w-full">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Badges
                </div>
              </div>
              <div className="flex items-stretch gap-2 h-full">
                {[0, 1, 2].map((slot) => {
                  const badgeId = user.selectedBadges?.[slot];
                  const badgeVisual = badgeId ? BADGE_VISUALS[badgeId] : null;
                  
                  // Fallback name if badgeData is still loading
                  const badgeName = badgeData?.badges.find(b => b.id === badgeId)?.name || (badgeId ? badgeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : "");

                  return (
                    <div
                      key={slot}
                      className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 border transition-all bg-white dark:bg-[#050710] shadow-sm rounded-xl relative min-h-[90px] sm:min-h-[110px]
                        ${badgeId ? "border-gray-200 dark:border-gray-800" : "border-dashed border-gray-300 dark:border-gray-700 opacity-40"}`}
                    >
                      {badgeId && badgeVisual ? (
                        <>
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 transition-opacity rounded-lg overflow-hidden bg-[#050b14] border border-gray-800/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]">
                            <RandomStars />
                            <div className={(badgeVisual.dropShadow || "") + " relative z-10"}>
                              <span className={`bg-gradient-to-br ${badgeVisual.gradient} bg-clip-text text-transparent`}>
                                {badgeVisual.icon || "·"}
                              </span>
                            </div>
                          </div>
                          <div className="text-center w-full overflow-hidden">
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-900 dark:text-white truncate">
                              {badgeName}
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 w-full h-full">
                          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-50 dark:bg-[#050b14]/50 flex items-center justify-center border border-gray-200 dark:border-gray-800/80 shrink-0">
                            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                          </div>
                          <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            Empty
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Streak Grid 2 Columns */}
            <div className="grid grid-cols-2 gap-3 h-auto">
              <div className="relative border border-orange-200 dark:border-orange-900/50 p-2.5 md:p-3 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 overflow-hidden flex flex-col justify-center">
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-400">
                    Current Streak
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                      {streakInfo?.currentStreak ?? 0}
                    </div>
                    <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="relative border border-purple-200 dark:border-purple-900/50 p-2.5 md:p-3 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 overflow-hidden flex flex-col justify-center">
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-400">
                    Highest Streak
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                      {streakInfo?.longestStreak ?? 0}
                    </div>
                    <Flame className="w-4 h-4 text-purple-500 dark:text-purple-400 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Graph */}
        <ActivityGraph joinedDate={user.createdAt} userId={user.userId} />

        {/* Profile Details Card */}
        <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
          <div className="space-y-4">
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
