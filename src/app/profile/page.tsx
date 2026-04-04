"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Link from "next/link";
import Image from "next/image";
import {
  Flame,
  Pencil,
  ShoppingBag,
  Palette,
  Share2,
  Eye,
  Plus,
  X,
  Settings,
} from "lucide-react";
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
import { RandomStars } from "@/components/RandomStars";
import {
  fetchBadgeProgress,
  getDefaultSelectedBadges,
  getHighestBadge,
  getSelectedBadges,
  saveSelectedBadges,
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
  const [editingBadgeSlot, setEditingBadgeSlot] = useState<number | null>(null);

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

  const handleBadgeSelect = (badgeId: string | null) => {
    if (editingBadgeSlot === null || !user) return;

    // Create new array to avoid mutating state directly
    const current = [...selectedBadgeIds];

    // Ensure array has exactly 3 elements initially
    while (current.length < 3) current.push("");

    // If removing, just clear the string for this slot
    if (!badgeId) {
      current[editingBadgeSlot] = "";
    } else {
      // Find if badge is already equipped in a DIFFERENT slot
      const existingIndex = current.findIndex(
        (id, idx) => id === badgeId && idx !== editingBadgeSlot,
      );

      // If equipped elsewhere, swap them or clear the other slot
      // Let's just clear the other slot and assign to new slot
      if (existingIndex !== -1) {
        current[existingIndex] = "";
      }

      // Assign to target slot
      current[editingBadgeSlot] = badgeId;
    }

    setSelectedBadgeIds(current);
    saveSelectedBadges(user.userId, current);
    setEditingBadgeSlot(null);
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
            {/* Points Display & Actions - Right on mobile, next to Profile on desktop */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-semibold text-black dark:text-white">
                  {(user.points || 0).toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  points
                </span>
              </div>
              <Link
                href="/shop"
                className="flex sm:hidden items-center justify-center p-1.5 bg-black dark:bg-white text-white dark:text-black transition-colors"
                title="Shop"
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              </Link>
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
              className="hidden sm:flex flex-none items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap min-w-0"
            >
              <ShoppingBag className="w-3 h-3 flex-shrink-0" />
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
            <Link
              href="/settings"
              className="flex items-center justify-center px-2 sm:px-3 py-1.5 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600 dark:text-gray-300 flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* Top Sections: 60% / 40% Split */}
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4">
          {/* Left Section (60%) */}
          <div className="w-full lg:w-[60%] border border-gray-200 dark:border-gray-800 p-3 md:p-5 bg-white dark:bg-gray-800 relative flex flex-col justify-center">
            {/* Share Share Icon - Top Right Displayed on all Screens */}
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
                      user.equippedBorder || "",
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
                  <button
                    onClick={handleImageClick}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 w-6 h-6 md:w-7 md:h-7 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 shadow-md"
                    title="Edit profile picture"
                  >
                    {uploading ? (
                      <svg
                        className="animate-spin h-3 w-3 md:h-3 md:w-3"
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
                        className="h-3 w-3 md:h-3 md:w-3"
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
                <div className="flex-1 min-w-0 text-left flex flex-col justify-center h-full">
                  <div className="flex flex-col gap-1 md:gap-1.5 mb-1 md:mb-1.5 py-1 items-start">
                    <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </h2>
                    {badgeData &&
                      (() => {
                        const highest = getHighestBadge(badgeData.badges);
                        if (!highest) return null;
                        const v = BADGE_VISUALS[highest.id];
                        return (
                          <div className="flex">
                            <Link
                              href="/badges"
                              className={`inline-flex flex-shrink-0 items-center gap-1.5 px-2 py-0.5 bg-gradient-to-r ${v.bgLight} ${v.bgDark} rounded whitespace-nowrap`}
                              title={
                                highest.description ||
                                `Highest Badge: ${highest.name}`
                              }
                            >
                              <span
                                className={`text-[11px] font-bold bg-gradient-to-r ${v.gradient} bg-clip-text text-transparent`}
                              >
                                {v.icon}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${v.textColor}`}
                              >
                                {highest.name}
                              </span>
                            </Link>
                          </div>
                        );
                      })()}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>

                  {/* Task counts below username (hidden on mobile) */}
                  <div className="hidden sm:flex items-center justify-start gap-4 md:gap-8 mt-3 md:mt-5">
                    <div className="flex flex-col items-start gap-0.5 md:gap-1 p-1.5 md:p-2 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-md min-w-[100px] md:min-w-[120px]">
                      <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Active Tasks
                      </span>
                      {streakLoading ? (
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-lg md:text-2xl font-bold text-black dark:text-white leading-none">
                          {streakInfo?.totalActiveTasks ?? 0}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-0.5 md:gap-1 p-1.5 md:p-2 border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-md min-w-[100px] md:min-w-[120px]">
                      <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Completed
                      </span>
                      {streakLoading ? (
                        <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-lg md:text-2xl font-bold text-black dark:text-white leading-none">
                          {streakInfo?.completedToday ?? 0}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section (40%) */}
          <div className="w-full lg:w-[40%] flex flex-col gap-3 md:gap-4 justify-between">
            {/* Badges Strip (matching badges page visual style) */}
            <div className="flex-1 relative border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-800/60 overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-all group flex flex-col justify-center">
              <div className="flex items-center justify-between mb-2 w-full">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Badges
                </div>
                <Link
                  href="/badges"
                  className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors z-20"
                >
                  View all →
                </Link>
              </div>
              {badgeData ? (
                <div className="flex items-stretch gap-2 h-full">
                  {[0, 1, 2].map((slot) => {
                    const badgeId = selectedBadgeIds[slot];
                    const badge = badgeId
                      ? badgeData.badges.find((b) => b.id === badgeId)
                      : null;
                    const visual = badge ? BADGE_VISUALS[badge.id] : null;
                    return (
                      <div
                        key={slot}
                        onClick={() => setEditingBadgeSlot(slot)}
                        className={`group/badge flex-1 min-w-0 flex flex-col items-center justify-center gap-1.5 sm:gap-2 p-2 sm:p-3 md:p-4 border transition-all bg-white dark:bg-[#050710] shadow-sm rounded-xl relative cursor-pointer min-h-[90px] sm:min-h-[110px] md:min-h-[120px]
                          ${badge ? "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#0a0e17]" : "border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#0a0e17]"}`}
                        title={
                          badge
                            ? `${badge.name}\n${badge.description}`
                            : "Empty slot"
                        }
                      >
                        {badge ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingBadgeSlot(slot);
                              }}
                              className="absolute -top-px -right-px w-6 h-6 sm:w-7 sm:h-7 rounded-bl-xl rounded-tr-xl transition-all z-20 flex items-center justify-center bg-black/40 dark:bg-white/10 text-white opacity-40 group-hover/badge:opacity-100 hover:bg-black/70 dark:hover:bg-white/20 backdrop-blur-sm"
                              aria-label="Edit badge"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>

                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 transition-opacity rounded-lg overflow-hidden bg-[#050b14] border border-gray-800/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]">
                              <RandomStars />
                              <div
                                className={
                                  (visual?.dropShadow || "") + " relative z-10"
                                }
                              >
                                <span
                                  className={`bg-gradient-to-br ${visual?.gradient} bg-clip-text text-transparent`}
                                  style={
                                    badge?.id === "the-perfectionist" ||
                                    badge?.id === "full-house"
                                      ? { fontSize: "1.15em" }
                                      : badge?.id === "the-keeper" ||
                                          badge?.id === "goal-crusher"
                                        ? {
                                            WebkitTextStroke: "1px transparent",
                                          }
                                        : {}
                                  }
                                >
                                  {visual?.icon || "·"}
                                </span>
                              </div>
                            </div>
                            <div className="text-center w-full overflow-hidden">
                              <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-900 dark:text-white truncate">
                                {badge.name}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 opacity-60 group-hover/badge:opacity-100 transition-opacity w-full h-full">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-50 dark:bg-[#050b14]/50 group-hover/badge:bg-gray-100 dark:group-hover/badge:bg-[#050b14] flex items-center justify-center border border-gray-200 dark:border-gray-800/80 transition-colors shrink-0">
                              <Plus className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover/badge:text-gray-600 dark:group-hover/badge:text-gray-300 transition-colors" />
                            </div>
                            <div className="text-center w-full overflow-hidden">
                              <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 dark:text-gray-500 group-hover/badge:text-gray-600 dark:group-hover/badge:text-gray-400 uppercase tracking-widest transition-colors">
                                Empty Slot
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-stretch gap-2 h-full">
                  {[0, 1, 2].map((slot) => (
                    <div
                      key={slot}
                      className="flex-1 min-h-[64px] border-dashed border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 rounded-sm animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Streak Grid 2 Columns */}
            <div className="grid grid-cols-2 gap-3 h-auto">
              {/* Current Streak */}
              <div className="relative border border-orange-200 dark:border-orange-900/50 p-2.5 md:p-3 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 overflow-hidden group hover:shadow-lg transition-shadow flex flex-col justify-center">
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                  <div className="absolute top-0 left-1/4 w-12 h-12 bg-orange-400 rounded-full blur-2xl animate-pulse"></div>
                  <div
                    className="absolute bottom-0 right-1/4 w-16 h-16 bg-red-400 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-400">
                    Current Streak
                  </div>
                  {streakLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                        {streakInfo?.currentStreak ?? 0}
                      </div>
                      <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>

              {/* Highest Streak */}
              <div className="relative border border-purple-200 dark:border-purple-900/50 p-2.5 md:p-3 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 overflow-hidden group hover:shadow-lg transition-shadow flex flex-col justify-center">
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                  <div className="absolute top-0 right-1/4 w-12 h-12 bg-purple-400 rounded-full blur-2xl animate-pulse"></div>
                  <div
                    className="absolute bottom-0 left-1/4 w-16 h-16 bg-pink-400 rounded-full blur-3xl animate-pulse"
                    style={{ animationDelay: "0.5s" }}
                  ></div>
                </div>
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-400">
                    Highest Streak
                  </div>
                  {streakLoading ? (
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-black dark:border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        {streakInfo?.longestStreak ?? 0}
                      </div>
                      <Flame className="w-4 h-4 text-purple-500 dark:text-purple-400 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Graph */}
        <ActivityGraph joinedDate={user.createdAt} />

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

      {/* Badge Picker Modal */}
      {editingBadgeSlot !== null && badgeData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[90dvh] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm">
              <h2 className="text-xl font-bold text-black dark:text-white">
                Choose Badge for Slot {editingBadgeSlot + 1}
              </h2>
              <button
                onClick={() => setEditingBadgeSlot(null)}
                className="p-2 text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-lg"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Select a Badge
              </h3>

              {badgeData.badges.filter((b) => b.unlocked).length === 0 ? (
                <div className="text-center p-8 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <p className="text-gray-500 dark:text-gray-400">
                    You haven&apos;t unlocked any badges yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  <button
                    onClick={() => handleBadgeSelect(null)}
                    className="relative p-3 flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden border border-dashed border-gray-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-300 dark:hover:border-red-700 bg-white dark:bg-[#050710] shadow-sm rounded-lg text-center min-w-0"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg bg-gray-100 dark:bg-gray-800/80 flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:border-red-200 dark:group-hover:border-red-800 transition-colors">
                      <X className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-500 dark:group-hover:text-red-400" />
                    </div>
                    <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 uppercase tracking-widest mt-1 truncate">
                      Clear Slot
                    </div>
                  </button>

                  {badgeData.badges
                    .filter((b) => b.unlocked)
                    .map((badge) => {
                      const visual = BADGE_VISUALS[badge.id];
                      // Check if already equipped anywhere
                      const isEquippedElsewhere =
                        selectedBadgeIds.findIndex(
                          (id) =>
                            id === badge.id &&
                            id !== selectedBadgeIds[editingBadgeSlot],
                        ) !== -1;
                      const isCurrentSlot =
                        selectedBadgeIds[editingBadgeSlot] === badge.id;

                      return (
                        <button
                          key={badge.id}
                          onClick={() => handleBadgeSelect(badge.id)}
                          className={`relative p-3 flex flex-col items-center justify-between gap-1 sm:gap-2 transition-all group overflow-hidden border bg-white dark:bg-[#050710] shadow-sm rounded-lg text-center min-w-0
                            ${isCurrentSlot ? "border-green-500/50 ring-1 ring-green-500/50 dark:bg-green-900/10" : "border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"}
                          `}
                          title={badge.description}
                        >
                          <div
                            className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 relative flex items-center justify-center text-2xl sm:text-3xl font-bold shrink-0 transition-opacity rounded-lg overflow-hidden mt-1
                              ${visual ? `bg-[#050b14] border border-gray-800/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]` : "bg-gray-100 dark:bg-gray-800"}`}
                          >
                            {visual && <RandomStars />}
                            <div
                              className={
                                (visual?.dropShadow || "") + " relative z-10"
                              }
                            >
                              <span
                                className={`bg-gradient-to-br ${visual?.gradient} bg-clip-text text-transparent`}
                              >
                                {visual?.icon || "·"}
                              </span>
                            </div>
                          </div>

                          <div className="w-full mt-auto">
                            <div className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-900 dark:text-white truncate">
                              {badge.name}
                            </div>
                            {isCurrentSlot ? (
                              <div className="text-[7.5px] sm:text-[8px] text-green-600 dark:text-green-400 font-bold tracking-wide mt-1 truncate">
                                EQUIPPED
                              </div>
                            ) : isEquippedElsewhere ? (
                              <div className="text-[7.5px] sm:text-[8px] text-orange-500 dark:text-orange-400 font-bold tracking-wide mt-1 truncate">
                                IN SLOT {selectedBadgeIds.indexOf(badge.id) + 1}
                              </div>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
              <Link
                href="/badges"
                onClick={() => setEditingBadgeSlot(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Go to Badges Page
              </Link>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
