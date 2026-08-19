"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import { InteractiveLink } from "@/components/InteractiveLink";
import Image from "next/image";
import ProfileSkeleton from "./ProfileSkeleton";
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
  Loader2,
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
  getDisplayBadge,
  saveDisplayBadge,
  BADGE_VISUALS,
  BadgeData,
} from "@/services/badgeService";
import { CurrencyIcon } from "@/components/CurrencyIcon";

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
  const [isLoadingBorders, setIsLoadingBorders] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<string[]>([]);
  const [editingBadgeSlot, setEditingBadgeSlot] = useState<number | null>(null);
  const [displayBadgeId, setDisplayBadgeId] = useState<string | null>(null);
  const [showDisplayBadgePicker, setShowDisplayBadgePicker] = useState(false);
  const displayBadgePickerRef = useRef<HTMLDivElement>(null);
  const [avatarSize, setAvatarSize] = useState(128);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setAvatarSize(96); // mobile: w-24
      } else if (window.innerWidth < 1024) {
        setAvatarSize(128); // tablet: md:w-32
      } else {
        setAvatarSize(160); // desktop: lg:w-40
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock background scroll when border picker is open
  useEffect(() => {
    if (showBorderPicker) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showBorderPicker]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user) {
      fetchStreakInfo();
      fetchBadgeProgress().then((data) => {
        if (data) {
          setBadgeData(data);
          const saved = getSelectedBadges(user.userId, user.selectedBadges);
          if (saved && saved.length > 0) {
            setSelectedBadgeIds(saved);
          } else {
            setSelectedBadgeIds(getDefaultSelectedBadges(data.badges));
          }
          // Initialize display badge
          const savedDisplay = getDisplayBadge(user.userId, user.displayBadge);
          if (savedDisplay) {
            setDisplayBadgeId(savedDisplay);
          } else {
            // Default to highest badge
            const highest = getHighestBadge(data.badges);
            if (highest) setDisplayBadgeId(highest.id);
          }
        }
      });
    }
  }, [isLoggedIn, authLoading, user, router]);

  // Close display badge picker on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        displayBadgePickerRef.current &&
        !displayBadgePickerRef.current.contains(e.target as Node)
      ) {
        setShowDisplayBadgePicker(false);
      }
    };
    if (showDisplayBadgePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showDisplayBadgePicker]);

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
    setIsLoadingBorders(true);
    try {
      const data = await getUserBorders();
      if (data?.success) {
        setUserBorders(data.data.borders);
      }
    } catch (error) {
      console.error("Error fetching borders:", error);
    } finally {
      setIsLoadingBorders(false);
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
      <DashboardLayout>
        <ProfileSkeleton />
      </DashboardLayout>
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
              <div className="flex items-center gap-1.5 px-3 py-1 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-semibold text-black dark:text-white">
                  {(user.points || 0).toLocaleString()}
                </span>
                <CurrencyIcon size={12} className="ml-0.5" />
              </div>
              <InteractiveLink
                href="/shop"
                className="flex sm:hidden items-center justify-center p-1.5 bg-black dark:bg-white text-white dark:text-black transition-colors rounded-lg"
                title="Shop"
                showSpinner={true}
              >
                <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              </InteractiveLink>
            </div>
          </div>
          {/* History, Shop, Edit Card, Edit Profile - Full width on mobile, original on desktop */}
          <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
            {user?.subscription === "pro" && (
              <InteractiveLink
                href="/profileVisitors"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap min-w-0 rounded-lg"
              >
                <Eye className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                History
              </InteractiveLink>
            )}
            <InteractiveLink
              href="/shop"
              className="hidden sm:flex flex-none items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap min-w-0 rounded-lg"
            >
              <ShoppingBag className="w-3 h-3 flex-shrink-0" />
              Shop
            </InteractiveLink>
            <button
              onClick={handleOpenBorderPicker}
              disabled={isLoadingBorders}
              className={`relative flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95 whitespace-nowrap min-w-0 rounded-lg ${isLoadingBorders ? 'pointer-events-none' : ''}`}
            >
              <div className={`flex items-center justify-center gap-1 sm:gap-1.5 transition-opacity duration-200 ${isLoadingBorders ? 'opacity-0' : 'opacity-100'}`}>
                <Palette className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                Edit Card
              </div>
              {isLoadingBorders && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
              )}
            </button>
            <InteractiveLink
              href="/settings"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors whitespace-nowrap min-w-0 rounded-lg"
            >
              <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              Settings
            </InteractiveLink>
          </div>
        </div>

        {/* Top Sections: 60% / 40% Split */}
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 mb-4">
          {/* Left Section (60%) */}
          <div className="w-full lg:w-[60%] border border-gray-200 dark:border-gray-800 p-3 md:p-5 bg-white dark:bg-gray-800 relative flex flex-col justify-center rounded-xl">
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
              <div className="flex flex-row items-center gap-6 lg:gap-12 w-full sm:w-auto mt-1 sm:mt-0">
                {/* Profile Picture */}
                <div className="relative group flex-shrink-0 ml-1 lg:ml-6">
                  <div
                    className={`w-24 h-24 md:w-32 lg:w-40 md:h-32 lg:h-40 overflow-hidden bg-transparent flex items-center justify-center shrink-0 rounded-xl ${getAnimationClass(
                      user.equippedBorder || "",
                    )}`}
                    style={getBorderStyle(user.equippedBorder || "default", avatarSize)}
                  >
                    <div className="relative z-20 w-full h-full flex items-center justify-center overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700">
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
                      {/* Semicircle Edit Profile Picture Button in Bottom-Right */}
                      <button
                        onClick={handleImageClick}
                        disabled={uploading}
                        className="absolute bottom-0 right-0 w-5 h-5 sm:w-7 sm:h-7 md:w-8 md:h-8 lg:w-9 lg:h-9 bg-black/80 hover:bg-black text-white rounded-tl-full flex items-center justify-center pl-0.5 pt-0.5 sm:pl-1.5 sm:pt-1.5 md:pl-2 md:pt-2 transition-all shadow-md backdrop-blur-sm border-t border-l border-white/20 z-30 cursor-pointer disabled:opacity-50"
                        title="Edit profile picture"
                        aria-label="Edit profile picture"
                      >
                        {uploading ? (
                          <div className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Pencil className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
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
                  <div className="flex flex-col gap-2 md:gap-2.5 mb-2 py-1 items-start">
                    <h2 className="text-lg md:text-2xl font-bold text-black dark:text-white truncate">
                      {user.firstName} {user.lastName}
                    </h2>
                    {badgeData &&
                      (() => {
                        const displayBadge = displayBadgeId
                          ? badgeData.badges.find(
                            (b) => b.id === displayBadgeId && b.unlocked,
                          )
                          : null;
                        const badge =
                          displayBadge || getHighestBadge(badgeData.badges);
                        if (!badge) return null;
                        const v = BADGE_VISUALS[badge.id];
                        return (
                          <div
                            className="flex relative"
                            ref={displayBadgePickerRef}
                          >
                            <button
                              onClick={() =>
                                setShowDisplayBadgePicker(
                                  !showDisplayBadgePicker,
                                )
                              }
                              className={`inline-flex flex-shrink-0 items-center gap-2 px-2.5 py-1 bg-gradient-to-r ${v.bgLight} ${v.bgDark} rounded-full whitespace-nowrap group/title transition-all hover:ring-1 hover:ring-gray-400/30 dark:hover:ring-white/20`}
                              title="Click to change display badge"
                            >
                              <span
                                className={`text-[11px] font-bold bg-gradient-to-r ${v.gradient} bg-clip-text text-transparent`}
                              >
                                {v.icon}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${v.textColor}`}
                              >
                                {badge.name}
                              </span>
                              <svg
                                className={`w-2.5 h-2.5 ${v.textColor} opacity-50 group-hover/title:opacity-100 transition-all ${showDisplayBadgePicker ? "rotate-180" : ""}`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2.5}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </button>

                            {/* Display Badge Picker Dropdown */}
                            {showDisplayBadgePicker && (
                              <div className="absolute top-full left-0 mt-1.5 z-50 bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl min-w-[200px] max-w-[260px] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                    Display Badge
                                  </p>
                                </div>
                                <div className="max-h-[240px] overflow-y-auto py-1">
                                  {badgeData.badges
                                    .filter((b) => b.unlocked)
                                    .sort((a, b) => {
                                      const aV = BADGE_VISUALS[a.id];
                                      const bV = BADGE_VISUALS[b.id];
                                      return (
                                        (aV?.prestigeRank ?? 99) -
                                        (bV?.prestigeRank ?? 99)
                                      );
                                    })
                                    .map((b) => {
                                      const bv = BADGE_VISUALS[b.id];
                                      const isSelected =
                                        (displayBadgeId || badge.id) === b.id;
                                      return (
                                        <button
                                          key={b.id}
                                          onClick={() => {
                                            setDisplayBadgeId(b.id);
                                            saveDisplayBadge(user.userId, b.id);
                                            setShowDisplayBadgePicker(false);
                                          }}
                                          className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isSelected
                                            ? "bg-gray-100 dark:bg-gray-800"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                            }`}
                                        >
                                          <span
                                            className={`text-sm font-bold bg-gradient-to-r ${bv.gradient} bg-clip-text text-transparent flex-shrink-0 w-5 text-center`}
                                          >
                                            {bv.icon}
                                          </span>
                                          <span
                                            className={`text-xs font-medium ${isSelected ? "text-black dark:text-white" : "text-gray-600 dark:text-gray-400"} truncate`}
                                          >
                                            {b.name}
                                          </span>
                                          {isSelected && (
                                            <svg
                                              className="w-3.5 h-3.5 text-green-500 ml-auto flex-shrink-0"
                                              fill="currentColor"
                                              viewBox="0 0 20 20"
                                            >
                                              <path
                                                fillRule="evenodd"
                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                clipRule="evenodd"
                                              />
                                            </svg>
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    @{user.username}
                  </p>

                  {/* Task counts below username (hidden on mobile) */}
                  <div className="hidden sm:flex items-center justify-start gap-4 md:gap-8 mt-2 md:mt-3">
                    <div className="flex flex-col items-start gap-0.5 md:gap-1 p-1.5 md:p-2 border border-transparent dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-md min-w-[100px] md:min-w-[120px]">
                      <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Active Tasks
                      </span>
                      {streakLoading ? (
                        <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ) : (
                        <span className="text-lg md:text-2xl font-bold text-black dark:text-white leading-none">
                          {streakInfo?.totalActiveTasks ?? 0}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col items-start gap-0.5 md:gap-1 p-1.5 md:p-2 border border-transparent dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/20 rounded-md min-w-[100px] md:min-w-[120px]">
                      <span className="text-[9px] md:text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        Completed
                      </span>
                      {streakLoading ? (
                        <div className="h-6 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
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
            <div className="flex-1 relative border border-gray-200 dark:border-gray-800 p-3 bg-white dark:bg-gray-800/60 overflow-hidden hover:border-gray-400 dark:hover:border-gray-600 transition-all group flex flex-col justify-center rounded-xl">
              <div className="flex items-center justify-between mb-2 w-full">
                <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Badges
                </div>
                <InteractiveLink
                  href="/badges"
                  className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors z-20"
                >
                  View all →
                </InteractiveLink>
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
                      className="flex-1 min-h-[90px] sm:min-h-[110px] md:min-h-[120px] border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Streak Grid 2 Columns */}
            <div className="grid grid-cols-2 gap-3 h-auto">
              {/* Current Streak */}
              <div className="relative border border-orange-200 dark:border-orange-900/50 p-2.5 md:p-3 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 dark:from-orange-950/20 dark:via-red-950/20 dark:to-yellow-950/20 overflow-hidden group hover:shadow-lg transition-shadow flex flex-col justify-center rounded-xl">
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                  <div className="absolute top-0 left-1/4 w-12 h-12 bg-orange-400 rounded-full blur-2xl"></div>
                  <div
                    className="absolute bottom-0 right-1/4 w-16 h-16 bg-red-400 rounded-full blur-3xl"
                  ></div>
                </div>
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="text-xs md:text-sm font-medium text-orange-700 dark:text-orange-400">
                    <span className="md:hidden">Current<br />Streak</span>
                    <span className="hidden md:inline">Current Streak</span>
                  </div>
                  {streakLoading ? (
                    <div className="h-6 w-12 bg-orange-200/50 dark:bg-orange-800/20 rounded animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 dark:from-orange-400 dark:to-red-400 bg-clip-text text-transparent">
                        {streakInfo?.currentStreak ?? 0}
                      </div>
                      <div className="relative flex items-center justify-center">
                        <Flame className="w-5 h-5 md:w-6 md:h-6 text-orange-500" fill="url(#orangeFireProfile)" strokeWidth={1.5} />
                        <svg width="0" height="0" className="absolute">
                          <defs>
                            <linearGradient id="orangeFireProfile" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#f97316" />
                              <stop offset="50%" stopColor="#ef4444" />
                              <stop offset="100%" stopColor="#fbbf24" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Highest Streak */}
              <div className="relative border border-purple-200 dark:border-purple-900/50 p-2.5 md:p-3 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-purple-950/20 dark:via-pink-950/20 dark:to-orange-950/20 overflow-hidden group hover:shadow-lg transition-shadow flex flex-col justify-center rounded-xl">
                <div className="absolute inset-0 opacity-10 dark:opacity-5">
                  <div className="absolute top-0 right-1/4 w-12 h-12 bg-purple-400 rounded-full blur-2xl"></div>
                  <div
                    className="absolute bottom-0 left-1/4 w-16 h-16 bg-pink-400 rounded-full blur-3xl"
                  ></div>
                </div>
                <div className="relative z-10 flex items-center justify-between w-full">
                  <div className="text-xs md:text-sm font-medium text-purple-700 dark:text-purple-400">
                    <span className="md:hidden">Highest<br />Streak</span>
                    <span className="hidden md:inline">Highest Streak</span>
                  </div>
                  {streakLoading ? (
                    <div className="h-6 w-12 bg-purple-200/50 dark:bg-purple-800/20 rounded animate-pulse" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                        {streakInfo?.longestStreak ?? 0}
                      </div>
                      <div className="relative flex items-center justify-center">
                        <Flame className="w-5 h-5 md:w-6 md:h-6 text-purple-500" fill="url(#purpleFireProfile)" strokeWidth={1.5} />
                        <svg width="0" height="0" className="absolute">
                          <defs>
                            <linearGradient id="purpleFireProfile" x1="0%" y1="100%" x2="0%" y2="0%">
                              <stop offset="0%" stopColor="#9333ea" />
                              <stop offset="50%" stopColor="#d946ef" />
                              <stop offset="100%" stopColor="#ec4899" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
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
        <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800 rounded-xl">
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
                  className={`inline-block px-2.5 py-0.5 text-xs rounded-full font-semibold capitalize ${user.subscription === "pro"
                    ? "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
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
                  className={`inline-block px-2 py-0.5 text-xs rounded-full ${user.isActive
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

      {/* Border Picker Modal — locks body scroll, closes on backdrop click */}
      {showBorderPicker && (
        <div
          className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          onClick={() => setShowBorderPicker(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[75dvh] overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-medium text-black dark:text-white">
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
            <div className="p-4 overflow-y-auto max-h-[52dvh]">
              {userBorders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No borders yet
                  </p>
                  <InteractiveLink
                    href="/shop"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
                  >
                    Visit Shop
                  </InteractiveLink>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                  {userBorders.map((border) => (
                    <button
                      key={border.id}
                      onClick={() => handleEquipBorder(border.id)}
                      disabled={equipping || border.equipped}
                      className={`p-3 md:p-6 border transition-all rounded-xl ${border.equipped
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
            <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800">
              <InteractiveLink
                href="/shop"
                onClick={() => setShowBorderPicker(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Get More Borders
              </InteractiveLink>
            </div>
          </div>
        </div>
      )}

      {/* Badge Picker Modal */}
      {editingBadgeSlot !== null && badgeData && (
        <div
          className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
          onClick={() => setEditingBadgeSlot(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 w-full max-w-4xl max-h-[75dvh] overflow-hidden rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
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
              <InteractiveLink
                href="/badges"
                onClick={() => setEditingBadgeSlot(null)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                Go to Badges Page
              </InteractiveLink>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
