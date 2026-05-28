"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import LoginStreakBonus from "@/components/LoginStreakBonus";
import StreakBrokenPopup from "@/components/StreakBrokenPopup";
import { getPowerUpInventory, StreakStatus } from "@/services/shopService";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  Target,
  BookOpen,
  Trophy,
  FileText,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { CurrencyIcon } from "@/components/CurrencyIcon";
import { DashboardLayout } from "@/components/dashboard";
import DashboardSkeleton from "./DashboardSkeleton";

export default function Dashboard() {
  const {
    user,
    isLoggedIn,
    isLoading: authLoading,
    refreshPoints,
    checkSession,
  } = useAuth();
  const router = useRouter();

  const [showStreakBonus, setShowStreakBonus] = useState(false);
  const [showStreakBroken, setShowStreakBroken] = useState(false);
  const [streakStatus, setStreakStatus] = useState<StreakStatus | null>(null);
  const [ticketCount, setTicketCount] = useState(0);
  const [pointsAnimation, setPointsAnimation] = useState<{
    points: number;
  } | null>(null);

  // Generate random stars for background atmosphere
  const stars = useMemo(() => {
    return Array.from({ length: 40 }, () => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1,
      delay: Math.random() * 5,
    }));
  }, []);

  const navigationItems = [
    {
      name: "Daily Tasks & Goals",
      url: "/dashboard/goals",
      description: "Set and track your daily tasks and goals",
      icon: <Target className="w-5 h-5" />,
      accent: "from-indigo-500 to-purple-500",
      id: "goals-card",
    },
    {
      name: "Academia",
      url: "/dashboard/academia",
      description: "Store your academics in encrypted format",
      icon: <BookOpen className="w-5 h-5" />,
      accent: "from-fuchsia-500 to-pink-500",
      id: "academia-card",
    },
    {
      name: "Quizzes",
      url: "/dashboard/quizzes?type=practice",
      description: "Create and take quizzes to test your knowledge",
      icon: <Trophy className="w-5 h-5" />,
      accent: "from-amber-500 to-orange-500",
      id: "quizzes-card",
    },
    {
      name: "Notes",
      url: "/dashboard/notes",
      description: "Write, organize, and manage your notes",
      icon: <FileText className="w-5 h-5" />,
      accent: "from-emerald-500 to-teal-500",
      id: "notes-card",
    },
  ];

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user) {
      // Bug 19 fix: only show the streak bonus once per browser session.
      // Without this guard it re-fires on every hard refresh because the
      // server-side loginStreakClaimed flag only changes after the user claims.
      const streakSeenKey = `streakBonusSeen_${user.userId || ""}`;
      const alreadySeenThisSession = sessionStorage.getItem(streakSeenKey);

      if (
        user.loginStreakDay !== undefined &&
        user.loginStreakDay > 0 &&
        user.loginStreakClaimed === false &&
        !alreadySeenThisSession
      ) {
        setShowStreakBonus(true);
        sessionStorage.setItem(streakSeenKey, "true");
      }

      // Check for broken daily task streak
      const checkStreakRestore = async () => {
        try {
          const data = await getPowerUpInventory();
          if (data?.success && data.data?.streakStatus?.canUse) {
            const { streakStatus } = data.data;
            const lastDismissed = sessionStorage.getItem(
              "streakBrokenDismissed",
            );

            // Only trigger if they had a streak (previousStreak >= 1)
            // and they JUST missed it yesterday (missedDays === 1)
            const shouldTrigger =
              streakStatus.missedDays === 1 && streakStatus.previousStreak >= 1;

            if (!lastDismissed && shouldTrigger) {
              setStreakStatus(streakStatus);
              setTicketCount(data.data.timeTravelTickets.owned);
              setShowStreakBroken(true);
            }
          }
        } catch (err) {
          console.error("Error checking streak restore:", err);
        }
      };
      checkStreakRestore();
    }
  }, [isLoggedIn, authLoading, user, router]);

  const handleClaimSuccess = async (pointsAwarded?: number) => {
    if (pointsAwarded && pointsAwarded > 0) {
      setPointsAnimation({ points: pointsAwarded });
      setTimeout(() => setPointsAnimation(null), 2000);
    }
    await refreshPoints();
    await checkSession(true);
  };

  if (authLoading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
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
      {/* Points Animation Popup */}
      {pointsAnimation && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] pointer-events-none">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black shadow-2xl flex items-center justify-center rounded-xl"
          >
            <span className="text-xl font-bold flex items-center gap-1.5">
              +{pointsAnimation.points}
              <CurrencyIcon size={16} className="shrink-0 !ml-1.5" />
            </span>
          </motion.div>
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

      {/* Streak Broken Popup */}
      {showStreakBroken && streakStatus && !showStreakBonus && (
        <StreakBrokenPopup
          streakStatus={streakStatus}
          ticketCount={ticketCount}
          onClose={() => {
            setShowStreakBroken(false);
            sessionStorage.setItem("streakBrokenDismissed", "true");
          }}
          onRestoreSuccess={async () => {
            await refreshPoints();
            await checkSession(true);
          }}
        />
      )}

      <div className="relative mt-2 mb-24">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-[120px]" />
          <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-blue-500/[0.02] dark:bg-blue-900/[0.03] rounded-full blur-[100px]" />

          {/* Subtle Stars in Dark Mode */}
          <div className="hidden dark:block absolute inset-0">
            {stars.map((star, i) => (
              <div
                key={i}
                className="absolute bg-white rounded-full animate-pulse"
                style={{
                  left: star.left,
                  top: star.top,
                  width: star.size,
                  height: star.size,
                  opacity: star.opacity,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Header Section */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-white/5 mb-5 space-x-2">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-black dark:text-white leading-none tracking-tight shrink-0">
              Dash<span className="font-normal italic">board</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Points Branding */}
            <div className="hidden sm:flex items-baseline px-3 py-1 border-r border-black/10 dark:border-white/10">
              <span className="text-lg md:text-2xl font-bold text-black dark:text-white mr-2">
                {(user?.points || 0).toLocaleString()}
              </span>
              <CurrencyIcon
                size={14}
                className="text-gray-500 dark:text-gray-400 mb-1 md:mb-1.5"
              />
            </div>

            {/* Shop Button */}
            <Link
              href="/shop"
              className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 font-medium tracking-wide text-white dark:text-black transition-all duration-300 rounded-lg overflow-hidden"
            >
              <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:opacity-90" />
              <ShoppingBag className="w-3.5 h-3.5 relative" />
              <span className="relative text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                Shop
              </span>
            </Link>
          </div>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-5 lg:mb-8">
          {navigationItems.map((item, idx) => (
            <motion.div
              key={item.url}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              whileHover={{ y: -2, scale: 1.005 }}
            >
              <Link
                href={item.url}
                id={item.id}
                className="group block overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] shadow-sm dark:shadow-[0_12px_25px_rgba(0,0,0,0.45)] transition-all duration-200 hover:border-purple-300/30 dark:hover:border-purple-200/50 hover:shadow-md dark:hover:shadow-[0_18px_45px_rgba(230,220,255,0.25)] rounded-xl"
              >
                <div className="relative flex flex-row items-center justify-between gap-5 px-4 py-4 md:px-6 md:py-5">
                  <div className="flex items-center gap-4 lg:gap-4">
                    <span
                      className="block h-12 w-1 rounded-full"
                      style={{
                        background: "linear-gradient(180deg, #f5f1ff, #a47efe)",
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white tracking-wide leading-tight">
                        {item.name}
                      </p>
                      <p className="text-[10px] sm:text-sm text-gray-500 dark:text-white/60 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-gray-200 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white transition duration-200 group-hover:bg-gray-100 dark:group-hover:bg-white/10 group-hover:text-gray-900 dark:group-hover:text-white">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Global Interaction Point - Leaderboard (Prominent) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="mb-4 md:mb-5"
        >
          <Link
            href="/leaderboard"
            className="group relative block w-full overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#050710] shadow-sm dark:shadow-[0_12px_25px_rgba(0,0,0,0.45)] py-6 sm:py-10 px-6 sm:px-8 transition-all duration-500 hover:border-amber-300/30 dark:hover:border-amber-200/20 hover:shadow-md dark:hover:shadow-[0_18px_45px_rgba(251,191,36,0.15)] rounded-2xl"
          >
            {/* Immersive Star Layer - Golden */}
            <div className="absolute inset-0 opacity-20 dark:opacity-40 pointer-events-none group-hover:opacity-40 dark:group-hover:opacity-70 transition-opacity">
              {stars.slice(20, 40).map((star, i) => (
                <div
                  key={`leaderboard-${i}`}
                  className="absolute bg-amber-400 dark:bg-amber-200 rounded-full"
                  style={{
                    left: star.left,
                    top: star.top,
                    width: (star.size || 1) + 1,
                    height: (star.size || 1) + 1,
                    opacity: 0.4,
                  }}
                />
              ))}
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[80px]" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-10">
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-3xl md:text-5xl font-light text-black dark:text-white mb-4 tracking-tight leading-none">
                  Global <span className="font-normal italic text-amber-600 dark:text-amber-400">Rankings</span>
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-gray-500 dark:text-gray-400 font-light max-w-xl mx-auto md:mx-0 leading-relaxed">
                  Compete on the leaderboard, rise through the ranks & earn rewards.
                </p>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-4 sm:gap-6 shrink-0">
                <div className="text-4xl sm:text-5xl md:text-7xl group-hover:scale-110 transition-transform duration-500 group-hover:-rotate-12">
                  🏆
                </div>
                <div className="flex items-center gap-2 text-[9px] sm:text-sm uppercase tracking-[0.3em] font-bold text-gray-600 dark:text-gray-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  <span>View Top</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Global Interaction Point - Students Hub (Prominent) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/studentsHub"
            className="group relative block w-full overflow-hidden border border-gray-200 dark:border-white/5 bg-white dark:bg-[#050710] shadow-sm dark:shadow-[0_12px_25px_rgba(0,0,0,0.45)] py-6 sm:py-10 px-6 sm:px-8 group transition-all duration-500 hover:border-gray-300 dark:hover:border-white/20 hover:shadow-md dark:hover:shadow-[0_18px_45px_rgba(230,220,255,0.25)] rounded-2xl"
          >
            {/* Immersive Star Layer */}
            <div className="absolute inset-0 opacity-20 dark:opacity-40 pointer-events-none group-hover:opacity-40 dark:group-hover:opacity-70 transition-opacity">
              {stars.slice(0, 20).map((star, i) => (
                <div
                  key={`hub-${i}`}
                  className="absolute bg-blue-400 dark:bg-white rounded-full"
                  style={{
                    left: star.left,
                    top: star.top,
                    width: (star.size || 1) + 1,
                    height: (star.size || 1) + 1,
                    opacity: 0.3,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-10">
              <div className="text-center md:text-left">
                <h2 className="text-xl sm:text-3xl md:text-5xl font-light text-black dark:text-white mb-4 tracking-tight leading-none">
                  Students <span className="font-normal italic">Hub</span>
                </h2>
                <p className="text-xs sm:text-base md:text-lg text-gray-500 dark:text-gray-400 font-light max-w-xl mx-auto md:mx-0 leading-relaxed">
                  Access premium tools & exclusive resources using your student mail.
                </p>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-4 sm:gap-6 shrink-0">
                <div className="text-3xl sm:text-5xl md:text-7xl group-hover:scale-110 transition-transform duration-500 rotate-12 group-hover:rotate-0">
                  🚀
                </div>
                <div className="flex items-center gap-2 text-[9px] sm:text-sm uppercase tracking-[0.3em] font-bold text-gray-600 dark:text-gray-600 group-hover:text-black dark:group-hover:text-white transition-colors">
                  <span>Enter Orbit</span>
                  <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Floating Background Glow (Corner) */}
        <div className="fixed -bottom-40 -right-40 w-96 h-96 bg-purple-500/[0.03] dark:bg-indigo-500/[0.05] rounded-full blur-[120px] pointer-events-none" />
      </div>
    </DashboardLayout>
  );
}
