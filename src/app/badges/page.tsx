"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// Removed unused Link import
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  fetchBadgeProgress,
  BADGE_VISUALS,
  BadgeProgress,
  BadgeData,
} from "@/services/badgeService";
import { ChevronLeft, Lock, Unlock, ChevronDown, ChevronUp } from "lucide-react";
import { RandomStars } from "@/components/RandomStars";

// --- Stat card ---
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-800 flex flex-col gap-1">
      <div className="text-2xl font-light text-black dark:text-white">
        {value}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {sub && (
        <div className="text-[10px] text-gray-400 dark:text-gray-500">
          {sub}
        </div>
      )}
    </div>
  );
}

// --- Badge card ---
function BadgeCard({ badge }: { badge: BadgeProgress }) {
  const visual = BADGE_VISUALS[badge.id];
  const pct = Math.round(badge.progress * 100);

  return (
    <div
      className={`relative p-4 sm:p-5 flex flex-col gap-2.5 sm:gap-3 transition-all group overflow-hidden border bg-white dark:bg-[#050710] shadow-sm dark:shadow-[0_6px_20px_rgba(0,0,0,0.4)]
        ${
          badge.unlocked
            ? "border-gray-200 dark:border-gray-800 hover:border-blue-400/40 dark:hover:border-blue-500/50 hover:shadow-md dark:hover:shadow-[0_8px_25px_rgba(30,120,255,0.15)]"
            : "border-gray-200 dark:border-gray-800 opacity-80"
        }
      `}
    >
      {/* Top Right State Icon */}
      <div className="absolute top-4 right-4 flex items-center justify-center z-10">
        {badge.unlocked ? (
          <Unlock className="w-4 h-4 text-gray-900 dark:text-white" />
        ) : (
          <Lock className="w-4 h-4 text-gray-500 dark:text-gray-500" />
        )}
      </div>

      {/* Icon + name */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        {/* Filled shape icon */}
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 relative flex items-center justify-center text-3xl sm:text-4xl font-bold shrink-0 rounded-xl transition-all duration-300 overflow-hidden
            ${badge.unlocked ? "bg-[#050b14] border border-gray-800/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.05)]" : "bg-gray-100 dark:bg-gray-800 opacity-40 border border-transparent"}`}
        >
          {badge.unlocked && <RandomStars />}
          <div
            className={
              (badge.unlocked && visual.dropShadow ? visual.dropShadow : "") +
              " relative z-10"
            }
          >
            <span
              className={`bg-gradient-to-br ${visual.gradient} bg-clip-text text-transparent`}
              style={
                badge.id === "the-perfectionist" || badge.id === "full-house"
                  ? { fontSize: "1.15em" }
                  : badge.id === "the-keeper" || badge.id === "goal-crusher"
                    ? { WebkitTextStroke: "1px transparent" }
                    : {}
              }
            >
              {visual.icon}
            </span>
          </div>
        </div>
        <div className="pr-2 sm:pr-6">
          <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white leading-tight">
            {badge.name}
          </div>
          <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 capitalize font-medium mt-0.5">
            {badge.category}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5 sm:mt-1 line-clamp-2">
        {badge.description}
      </p>

      {/* Progress bar */}
      <div className="space-y-1.5 mt-auto pt-1 sm:pt-2">
        <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
          <span>
            {badge.current.toLocaleString()} /{" "}
            {badge.requirement.toLocaleString()}
          </span>
          <span className="text-gray-900 dark:text-white">{pct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${visual.gradient} transition-all duration-700 ${badge.unlocked ? "" : "opacity-40"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default function BadgesPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showStats, setShowStats] = useState(false);
  const [sortBy, setSortBy] = useState<"prestige" | "progress" | "name">(
    "prestige",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    setLoading(true);
    fetchBadgeProgress().then((data) => {
      if (data) {
        setBadgeData(data);
      }
      setLoading(false);
    });
  }, [isLoggedIn, user]);

  if (authLoading || (!badgeData && loading)) {
    return (
      <ZeroGravityLoading
        title="Loading Badges"
        subtitle="Fetching your achievements..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn || !user || !badgeData) return null;

  const { badges, metrics } = badgeData;

  const categories = [
    { id: "all", label: "All" },
    { id: "streak", label: "Streak" },
    { id: "tasks", label: "Tasks" },
    { id: "time", label: "Time" },
    { id: "goals", label: "Goals" },
  ];

  const filteredBadges = [
    ...(activeCategory === "all"
      ? badges
      : badges.filter((b) => b.category === activeCategory)),
  ].sort((a, b) => {
    // Top-level sort: unlocked mostly come first (or progress-based)
    // Wait, let's sort strictly by unlocked status first, so users can see what they have
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;

    let result = 0;
    // Secondary sort based on user selection
    if (sortBy === "prestige") {
      const rankA = BADGE_VISUALS[a.id]?.prestigeRank ?? 999;
      const rankB = BADGE_VISUALS[b.id]?.prestigeRank ?? 999;
      // ascending prestige means lower rank number (so better prestige) at bottom
      // wait, lower rank number = rarer.
      // So if asc, we want rarer at bottom -> larger rank number at top
      result = rankB - rankA;
    } else if (sortBy === "progress") {
      const progA = a.progress ?? 0;
      const progB = b.progress ?? 0;
      if (progB !== progA) {
        result = progA - progB; // ascending progress = 0% to 100%
      } else {
        // fallback to prestige if progress is tied
        const rankA = BADGE_VISUALS[a.id]?.prestigeRank ?? 999;
        const rankB = BADGE_VISUALS[b.id]?.prestigeRank ?? 999;
        result = rankB - rankA;
      }
    } else if (sortBy === "name") {
      result = a.name.localeCompare(b.name);
    }

    return sortOrder === "asc" ? result : -result;
  });

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-12 pt-2 lg:pt-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2 lg:mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
                Badges
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                title="Sort Badges"
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  const [newSortBy, newSortOrder] = e.target.value.split(
                    "-",
                  ) as ["prestige" | "progress" | "name", "asc" | "desc"];
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="w-20 flex items-center gap-1.5 pl-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors appearance-none pr-8 bg-transparent cursor-pointer outline-none"
              >
                <option value="" disabled hidden>
                  Sort
                </option>
                <option
                  className="bg-white dark:bg-gray-900"
                  value="prestige-asc"
                >
                  {sortBy === "prestige" && sortOrder === "asc" ? "✓ " : ""}Prestige (Asc)
                </option>
                <option
                  className="bg-white dark:bg-gray-900"
                  value="prestige-desc"
                >
                  {sortBy === "prestige" && sortOrder === "desc" ? "✓ " : ""}Prestige (Desc)
                </option>
                <option
                  className="bg-white dark:bg-gray-900"
                  value="progress-desc"
                >
                  {sortBy === "progress" && sortOrder === "desc" ? "✓ " : ""}Progress (High to Low)
                </option>
                <option
                  className="bg-white dark:bg-gray-900"
                  value="progress-asc"
                >
                  {sortBy === "progress" && sortOrder === "asc" ? "✓ " : ""}Progress (Low to High)
                </option>
                <option className="bg-white dark:bg-gray-900" value="name-asc">
                  {sortBy === "name" && sortOrder === "asc" ? "✓ " : ""}Name (A-Z)
                </option>
                <option className="bg-white dark:bg-gray-900" value="name-desc">
                  {sortBy === "name" && sortOrder === "desc" ? "✓ " : ""}Name (Z-A)
                </option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
            </div>

            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Stats
              {showStats ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <StatCard
              label="Longest Streak"
              value={metrics.maxStreak}
              sub="days"
            />
            <StatCard
              label="Tasks Completed"
              value={metrics.totalTasksCompleted.toLocaleString()}
            />
            <StatCard
              label="Before 8 AM"
              value={metrics.earlyBirdCount}
              sub="early tasks"
            />
            <StatCard
              label="After 10 PM"
              value={metrics.nightOwlCount}
              sub="night tasks"
            />
            <StatCard
              label="Perfect Days"
              value={metrics.perfectDaysCount}
              sub="all tasks done"
            />
            <StatCard
              label="Goals Finished"
              value={metrics.completedGoalsCount}
            />
          </div>
        )}

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-6">
          <div className="flex w-full gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 px-3 py-1.5 text-xs whitespace-nowrap border transition-colors text-center justify-center ${
                  activeCategory === cat.id
                    ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                    : "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
          {filteredBadges.map((badge) => (
            <BadgeCard key={badge.id} badge={badge} />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
