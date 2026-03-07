"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  fetchBadgeProgress,
  getDefaultSelectedBadges,
  getSelectedBadges,
  saveSelectedBadges,
  BADGE_VISUALS,
  BadgeProgress,
  BadgeData,
} from "@/services/badgeService";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

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
function BadgeCard({
  badge,
  isSelected,
  onToggleSelect,
  selectionMode,
}: {
  badge: BadgeProgress;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean;
}) {
  const visual = BADGE_VISUALS[badge.id];
  const pct = Math.round(badge.progress * 100);

  return (
    <div
      onClick={() =>
        selectionMode && badge.unlocked && onToggleSelect(badge.id)
      }
      className={`relative border p-4 flex flex-col gap-3 transition-all group
        ${
          badge.unlocked
            ? `${visual.border} bg-gradient-to-br ${visual.bgLight} ${visual.bgDark} ${badge.unlocked ? visual.glow : ""} cursor-default`
            : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 opacity-60"
        }
        ${selectionMode && badge.unlocked ? "cursor-pointer" : ""}
        ${isSelected ? "ring-2 ring-white/60 scale-[1.02]" : ""}
      `}
    >
      {/* Selection indicator */}
      {selectionMode && badge.unlocked && (
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center border-2
            ${isSelected ? "bg-white border-white" : "border-gray-400 dark:border-gray-600"}`}
        >
          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-black" />}
        </div>
      )}

      {/* Lock icon for locked badges */}
      {!badge.unlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
        </div>
      )}

      {/* Icon + name */}
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 flex items-center justify-center text-xl font-bold rounded-sm
            bg-gradient-to-br ${visual.gradient}
            ${badge.unlocked ? "opacity-100" : "opacity-30 grayscale"}`}
        >
          <span className="text-white drop-shadow-sm">{visual.icon}</span>
        </div>
        <div>
          <div
            className={`text-sm font-semibold ${badge.unlocked ? visual.textColor : "text-gray-500 dark:text-gray-400"}`}
          >
            {badge.name}
          </div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 capitalize">
            {badge.category}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
        {badge.description}
      </p>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400">
          <span>
            {badge.current.toLocaleString()} /{" "}
            {badge.requirement.toLocaleString()}
          </span>
          <span className={badge.unlocked ? visual.textColor : ""}>{pct}%</span>
        </div>
        <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${visual.gradient} rounded-full transition-all duration-700`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {badge.unlocked && (
        <div
          className={`text-[10px] font-semibold uppercase tracking-widest ${visual.textColor}`}
        >
          ✓ Unlocked
        </div>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [badgeData, setBadgeData] = useState<BadgeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) router.push("/login");
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (!isLoggedIn || !user) return;
    setLoading(true);
    fetchBadgeProgress().then((data) => {
      if (data) {
        setBadgeData(data);
        const saved = getSelectedBadges(user.userId);
        if (saved.length > 0) {
          setSelectedBadges(saved);
        } else {
          setSelectedBadges(getDefaultSelectedBadges(data.badges));
        }
      }
      setLoading(false);
    });
  }, [isLoggedIn, user]);

  const handleToggleSelect = (id: string) => {
    setSelectedBadges((prev) => {
      if (prev.includes(id)) return prev.filter((b) => b !== id);
      if (prev.length >= 3) return [...prev.slice(1), id]; // rotate
      return [...prev, id];
    });
  };

  const handleSaveSelection = () => {
    if (!user) return;
    saveSelectedBadges(user.userId, selectedBadges);
    setSelectionMode(false);
  };

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
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  const categories = [
    { id: "all", label: "All" },
    { id: "streak", label: "Streak" },
    { id: "tasks", label: "Tasks" },
    { id: "time", label: "Time" },
    { id: "goals", label: "Goals" },
  ];

  const filteredBadges =
    activeCategory === "all"
      ? badges
      : badges.filter((b) => b.category === activeCategory);

  return (
    <DashboardLayout>
      <div className="space-y-4 pb-12 pt-2 lg:pt-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-2 lg:mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="w-8 h-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl md:text-3xl font-light text-black dark:text-white">
                Badges
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {unlockedCount}/{badges.length} unlocked
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectionMode ? (
              <>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
                  {selectedBadges.length}/3 selected
                </span>
                <button
                  onClick={() => setSelectionMode(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSelection}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-black dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Save Display
                </button>
              </>
            ) : (
              <button
                onClick={() => setSelectionMode(true)}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Choose 3 to Display
              </button>
            )}
          </div>
        </div>

        {selectionMode && (
          <div className="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
            Select up to 3 unlocked badges to show on your profile. Tap a badge
            to toggle selection.
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

        {/* Category filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1.5 text-xs whitespace-nowrap border transition-colors ${
                activeCategory === cat.id
                  ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                  : "text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Badge grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredBadges.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              isSelected={selectedBadges.includes(badge.id)}
              onToggleSelect={handleToggleSelect}
              selectionMode={selectionMode}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
