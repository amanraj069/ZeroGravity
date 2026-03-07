"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Link from "next/link";
import Image from "next/image";
import { Flame, Pencil, ShoppingBag, Palette, Share2, Eye } from "lucide-react";
import ActivityGraph from "@/components/ActivityGraph";
import {
  getUserBorders,
  equipBorder,
  Border,
  getBorderStyle,
  getAnimationClass,
} from "@/services/shopService";
import { BorderPreview } from "@/components/borders";
import PhotoEditor from "@/components/PhotoEditor";
import {
  fetchBadgeProgress,
  getDefaultSelectedBadges,
  getHighestBadge,
  getSelectedBadges,
  BADGE_VISUALS,
  BadgeData,
} from "@/services/badgeService";

interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveTasks: number;
  completedToday: number;
}

export default function Profile() {
  const {
    user,
    isLoggedIn,
    isLoading: authLoading,
    setUser,
    refreshPoints,
  } = useAuth();
  const router = useRouter();
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [streakLoading, setStreakLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [userBorders, setUserBorders] = useState<Border[]>([]);
  const [equipping, setEquipping] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user) {
      fetchStreakInfo();
      fetchBadgeProgress().then((data) => {
        if (data) {
          setBadgeData(data);
          const saved = getSelectedBadges(user.userId);
          if (saved.length > 0) {
            setSelectedBadgeIds(saved);
          } else {
            setSelectedBadgeIds(getDefaultSelectedBadges(data.badges));
          }
        }
      });
    }
  }, [isLoggedIn, authLoading, user, router]);

  const fetchStreakInfo = async () => {
    setStreakLoading(true);
    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.DAILY_TASKS.STREAK_INFO,
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

    // Show photo editor
    setSelectedImageFile(file);
    setShowPhotoEditor(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePhotoEditorSave = async (croppedFile: File) => {
    setShowPhotoEditor(false);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("profilePicture", croppedFile);

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
      setSelectedImageFile(null);
    }
  };

  const handlePhotoEditorCancel = () => {
    setShowPhotoEditor(false);
    setSelectedImageFile(null);
  };

  const handleOpenBorderPicker = async () => {
    try {
      const data = await getUserBorders();
      if (data?.success) {
        setUserBorders(data.data.borders);
      }
    } catch (error) {
      console.error("Error fetching borders:", error);
    }
    setShowBorderPicker(true);
  };

  const handleEquipBorder = async (borderId: string) => {
    setEquipping(true);
    try {
      const result = await equipBorder(borderId);
      if (result?.success) {
        setUserBorders((prev) =>
          prev.map((b) => ({
            ...b,
            equipped: b.id === borderId,
          })),
        );
        // Refresh user data to get updated equippedBorder
        await refreshPoints();
        setShowBorderPicker(false);
      }
    } catch (error) {
      console.error("Error equipping border:", error);
    } finally {
      setEquipping(false);
    }
  };

  const handleShareProfile = async () => {
    if (!user) return;

    const profileUrl = `${window.location.origin}/profile/${user.userId}`;

    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy profile link:", err);
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = profileUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error("Fallback copy failed:", fallbackErr);
        alert(`Profile link: ${profileUrl}`);
      }
      document.body.removeChild(textArea);
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
      <div className=" space-y-3 md:space-y-4 pb-12 pt-2 lg:pt-4">
        {/* Header */}
        {/* Mobile: Stacked layout with points on right, buttons full width */}
        {/* Desktop: Original horizontal layout preserved */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2 lg:mb-6">
          {/* Mobile: Profile and Points in separate row, Desktop: Together on left */}
          <div className="flex items-center justify-between sm:justify-start sm:gap-3">
            <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
              Profile
            </h1>
            {/* Points Display - Right on mobile, next to Profile on desktop */}
            <div className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <span className="text-sm font-semibold text-black dark:text-white">
                {(user.points || 0).toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                points
              </span>
            </div>
          </div>
          {/* History, Shop, Edit Card, Edit Profile - Full width on mobile, original on desktop */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            {user?.subscription === "pro" && (
              <Link
                href="/profileVisitors"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap min-w-0"
              >
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                History
              </Link>
            )}
            <Link
              href="/shop"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap min-w-0"
            >
              <ShoppingBag className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              Shop
            </Link>
            <button
              onClick={handleOpenBorderPicker}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap min-w-0"
            >
              <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              Edit Card
            </button>
            <Link
              href="/profile/edit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors whitespace-nowrap min-w-0"
            >
              <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Profile Info Card */}
        <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800 relative">
          {/* Share Icon - Top Right on Desktop */}
          <button
            onClick={handleShareProfile}
            className="hidden md:flex absolute top-3 right-3 w-8 h-8 items-center justify-center text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-full z-10 group p-0"
            title="Share profile link"
          >
            <Share2 className="w-4 h-4 m-0" />
            {copied && (
              <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                Copied!
              </span>
            )}
          </button>
          <div className="flex items-center gap-4 md:gap-6">
            {/* Profile Picture */}
            <div className="relative group flex-shrink-0">
              {/* Share Icon - Bottom Right, beside Profile Picture on Mobile */}
              <button
                onClick={handleShareProfile}
                className="md:hidden absolute bottom-0 -right-9 w-7 h-7 flex items-center justify-center bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white border-2 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-full z-10 group shadow-sm p-0"
                title="Share profile link"
              >
                <Share2 className="w-3.5 h-3.5 m-0" />
                {copied && (
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black dark:bg-white text-white dark:text-black text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
                    Copied!
                  </span>
                )}
              </button>
              <div
                className={`w-20 h-20 md:w-32 md:h-32 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${getAnimationClass(
                  user.equippedBorder || "",
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
              {/* Edit Button */}
              <button
                onClick={handleImageClick}
                disabled={uploading}
                className="absolute bottom-1 right-1 w-6 h-6 md:w-8 md:h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                title="Edit profile picture"
              >
                {uploading ? (
                  <svg
                    className="animate-spin h-3 w-3 md:h-4 md:w-4"
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
                    className="h-3 w-3 md:h-4 md:w-4"
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

            {/* Name and Username - grows to fill space */}
            <div className="flex-1 min-w-0 text-right md:text-left">
              <div className="flex items-start justify-end md:justify-start gap-2 flex-wrap">
                <h2 className="text-lg md:text-2xl font-semibold text-black dark:text-white truncate">
                  {user.firstName} {user.lastName}
                </h2>
                {/* Highest badge pill — shown beside name */}
                {badgeData &&
                  (() => {
                    const highest = getHighestBadge(badgeData.badges);
                    if (!highest) return null;
                    const v = BADGE_VISUALS[highest.id];
                    return (
                      <Link
                        href="/badges"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 border ${v.border} bg-gradient-to-r ${v.bgLight} ${v.bgDark} ${v.glow} rounded-sm whitespace-nowrap`}
                        title={`Highest Badge: ${highest.name}`}
                      >
                        <span
                          className={`text-xs font-bold bg-gradient-to-r ${v.gradient} bg-clip-text text-transparent`}
                        >
                          {v.icon}
                        </span>
                        <span
                          className={`text-[10px] font-semibold ${v.textColor}`}
                        >
                          {highest.name}
                        </span>
                      </Link>
                    );
                  })()}
              </div>
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                @{user.username}
              </p>
              {/* Mobile: Show stats below username */}
              <div className="flex items-center gap-4 mt-2 md:hidden justify-end flex-wrap">
                <div className="flex items-center gap-1.5">
                  {streakLoading ? (
                    <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-base font-semibold text-black dark:text-white">
                      {streakInfo?.totalActiveTasks ?? 0}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {streakLoading ? (
                    <div className="w-3 h-3 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-base font-semibold text-black dark:text-white">
                      {streakInfo?.completedToday ?? 0}
                    </span>
                  )}
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Today
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop: Active Tasks & Completed Today on far right */}
            <div className="hidden md:flex gap-6 pr-4">
              <div className="text-center">
                {streakLoading ? (
                  <div className="flex items-center justify-center h-10">
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-light text-black dark:text-white">
                    {streakInfo?.totalActiveTasks ?? 0}
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Active Tasks
                </div>
              </div>
              <div className="text-center">
                {streakLoading ? (
                  <div className="flex items-center justify-center h-10">
                    <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="text-3xl font-light text-black dark:text-white">
                    {streakInfo?.completedToday ?? 0}
                  </div>
                )}
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Completed Today
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Graph */}
        <ActivityGraph joinedDate={user.createdAt} />

        {/* Streak Stats Grid — 3 columns: streak, highest, badges */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
              {streakLoading ? (
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                    {streakInfo?.currentStreak ?? 0}
                  </div>
                  <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500 dark:text-orange-400 animate-pulse" />
                </div>
              )}
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
              {streakLoading ? (
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
              ) : (
                <div className="flex items-center gap-1 md:gap-2">
                  <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {streakInfo?.longestStreak ?? 0}
                  </div>
                  <Flame className="w-5 h-5 md:w-6 md:h-6 text-purple-500 dark:text-purple-400 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          {/* Badges Strip — spans both columns on mobile, 1/3 on desktop */}
          <Link
            href="/badges"
            className="col-span-2 md:col-span-1 relative border border-gray-200 dark:border-gray-800 p-3 md:p-4 bg-white dark:bg-gray-800/60 overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-all group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Badges
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                View all →
              </span>
            </div>
            {badgeData ? (
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((slot) => {
                  const badgeId = selectedBadgeIds[slot];
                  const badge = badgeId
                    ? badgeData.badges.find((b) => b.id === badgeId)
                    : null;
                  const visual = badge ? BADGE_VISUALS[badge.id] : null;
                  return (
                    <div
                      key={slot}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 border rounded-sm transition-all
                        ${
                          badge && visual
                            ? `${visual.border} bg-gradient-to-br ${visual.bgLight} ${visual.bgDark} ${visual.glow}`
                            : "border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40"
                        }`}
                    >
                      <div
                        className={`w-7 h-7 flex items-center justify-center text-base font-bold rounded-sm
                          ${badge && visual ? `bg-gradient-to-br ${visual.gradient} opacity-90` : "bg-gray-200 dark:bg-gray-700"}`}
                      >
                        <span className="text-white drop-shadow-sm">
                          {badge && visual ? visual.icon : "·"}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] text-center leading-tight truncate w-full
                        ${badge && visual ? visual.textColor : "text-gray-400 dark:text-gray-600"}`}
                      >
                        {badge ? badge.name : "Empty"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {[0, 1, 2].map((slot) => (
                  <div
                    key={slot}
                    className="flex-1 h-14 border-dashed border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 rounded-sm animate-pulse"
                  />
                ))}
              </div>
            )}
          </Link>
        </div>

        {/* Profile Details Card */}
        <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Email
              </label>
              <div className="text-sm text-black dark:text-white break-all">
                {user.email}
              </div>
            </div>

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

      {/* Photo Editor Modal */}
      {showPhotoEditor && selectedImageFile && (
        <PhotoEditor
          imageFile={selectedImageFile}
          onSave={handlePhotoEditorSave}
          onCancel={handlePhotoEditorCancel}
        />
      )}

      {/* Border Picker Modal */}
      {showBorderPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90dvh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-medium text-black dark:text-white">
                Choose Border
              </h2>
              <button
                onClick={() => setShowBorderPicker(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[70dvh]">
              {userBorders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No borders yet
                  </p>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                  >
                    Visit Shop
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  {userBorders.map((border) => (
                    <button
                      key={border.id}
                      onClick={() => handleEquipBorder(border.id)}
                      disabled={equipping || border.equipped}
                      className={`p-3 md:p-6 border transition-all ${
                        border.equipped
                          ? "border-black dark:border-white bg-gray-50 dark:bg-gray-800"
                          : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2 md:gap-4">
                        <BorderPreview
                          border={border}
                          profilePicture={user.profilePicture}
                          firstName={user.firstName}
                          lastName={user.lastName || ""}
                          size="sm"
                        />
                        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                          {border.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-800">
              <Link
                href="/shop"
                onClick={() => setShowBorderPicker(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Get More Borders
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
