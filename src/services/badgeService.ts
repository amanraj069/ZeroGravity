import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";

export interface BadgeProgress {
  id: string;
  name: string;
  description: string;
  category: "streak" | "time" | "tasks" | "goals";
  requirement: number;
  current: number;
  progress: number; // 0–1
  unlocked: boolean;
  metric: string;
}

export interface BadgeMetrics {
  maxStreak: number;
  currentStreak: number;
  totalTasksCompleted: number;
  earlyBirdCount: number;
  nightOwlCount: number;
  completedGoalsCount: number;
  perfectDaysCount: number;
}

export interface BadgeData {
  badges: BadgeProgress[];
  metrics: BadgeMetrics;
  highestBadgeId: string | null;
}

// Badge visual config – must match badge IDs from backend
export interface BadgeVisual {
  id: string;
  icon: string; // emoji
  gradient: string; // tailwind gradient classes
  border: string; // tailwind border color classes
  glow: string; // tailwind shadow/ring classes for unlocked glow
  textColor: string;
  bgDark: string;
  bgLight: string;
  prestigeRank: number; // 1 = most prestigious
}

export const BADGE_VISUALS: Record<string, BadgeVisual> = {
  // DIAMOND OR PLATINUM TIER
  "the-immortal": {
    id: "the-immortal",
    icon: "✦",
    gradient: "from-sky-300 via-indigo-300 to-cyan-300",
    border: "border-sky-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(125,211,252,0.45)]",
    textColor: "text-sky-300",
    bgDark: "dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-cyan-950/40",
    bgLight: "from-sky-50 via-indigo-50 to-cyan-50",
    prestigeRank: 1,
  },
  // DIAMOND OR PLATINUM TIER
  "the-guardian": {
    id: "the-guardian",
    icon: "◈",
    gradient: "from-blue-300 via-indigo-300 to-purple-300",
    border: "border-indigo-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(165,180,252,0.45)]",
    textColor: "text-indigo-300",
    bgDark:
      "dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-purple-950/40",
    bgLight: "from-blue-50 via-indigo-50 to-purple-50",
    prestigeRank: 2,
  },
  // GOLD TIER
  "the-perfectionist": {
    id: "the-perfectionist",
    icon: "⬡",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(250,204,21,0.45)]",
    textColor: "text-yellow-500",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-100",
    prestigeRank: 3,
  },
  // BRONZE TIER
  "the-keeper": {
    id: "the-keeper",
    icon: "◇",
    gradient: "from-orange-700 via-amber-700 to-orange-800",
    border: "border-orange-700/60",
    glow: "shadow-[0_0_18px_2px_rgba(194,65,12,0.4)]",
    textColor: "text-orange-700",
    bgDark:
      "dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/40",
    bgLight: "from-orange-50 via-orange-100 to-amber-50",
    prestigeRank: 4,
  },
  // GOLD TIER
  millennial: {
    id: "millennial",
    icon: "⬟",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(250,204,21,0.45)]",
    textColor: "text-yellow-500",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-100",
    prestigeRank: 5,
  },
  // SILVER TIER
  "goal-crusher": {
    id: "goal-crusher",
    icon: "◎",
    gradient: "from-gray-300 via-slate-300 to-gray-400",
    border: "border-gray-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(209,213,219,0.4)]",
    textColor: "text-gray-400",
    bgDark: "dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-900/40",
    bgLight: "from-gray-50 via-slate-50 to-gray-100",
    prestigeRank: 6,
  },
  // GOLD TIER
  "full-house": {
    id: "full-house",
    icon: "⬡",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(250,204,21,0.45)]",
    textColor: "text-yellow-500",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-100",
    prestigeRank: 7,
  },
  // BRONZE TIER
  centurion: {
    id: "centurion",
    icon: "◆",
    gradient: "from-orange-700 via-amber-700 to-orange-800",
    border: "border-orange-700/60",
    glow: "shadow-[0_0_18px_2px_rgba(194,65,12,0.4)]",
    textColor: "text-orange-700",
    bgDark:
      "dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/40",
    bgLight: "from-orange-50 via-orange-100 to-amber-50",
    prestigeRank: 8,
  },
  // BRONZE TIER
  "night-owl": {
    id: "night-owl",
    icon: "◑",
    gradient: "from-orange-700 via-amber-700 to-orange-800",
    border: "border-orange-700/60",
    glow: "shadow-[0_0_18px_2px_rgba(194,65,12,0.4)]",
    textColor: "text-orange-700",
    bgDark:
      "dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/40",
    bgLight: "from-orange-50 via-orange-100 to-amber-50",
    prestigeRank: 9,
  },
  // BRONZE TIER
  "early-bird": {
    id: "early-bird",
    icon: "◐",
    gradient: "from-orange-700 via-amber-700 to-orange-800",
    border: "border-orange-700/60",
    glow: "shadow-[0_0_18px_2px_rgba(194,65,12,0.4)]",
    textColor: "text-orange-700",
    bgDark:
      "dark:from-orange-950/40 dark:via-orange-900/30 dark:to-amber-950/40",
    bgLight: "from-orange-50 via-orange-100 to-amber-50",
    prestigeRank: 10,
  },
};

export const PRESTIGE_ORDER = [
  "the-immortal",
  "the-guardian",
  "the-perfectionist",
  "the-keeper",
  "millennial",
  "goal-crusher",
  "full-house",
  "centurion",
  "night-owl",
  "early-bird",
];

/** Fetch badge progress from the API */
export const fetchBadgeProgress = async (): Promise<BadgeData | null> => {
  try {
    const response = await apiCallWithAuth(API_ENDPOINTS.BADGES.PROGRESS);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.success) return data.data as BadgeData;
    return null;
  } catch {
    return null;
  }
};

/** Get the 3 selected badge IDs for a user from localStorage */
export const getSelectedBadges = (userId: string): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`zg_selected_badges_${userId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.slice(0, 3);
    }
  } catch {
    // ignore
  }
  return [];
};

/** Save the 3 selected badge IDs for a user to localStorage */
export const saveSelectedBadges = (
  userId: string,
  badgeIds: string[],
): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `zg_selected_badges_${userId}`,
    JSON.stringify(badgeIds.slice(0, 3)),
  );
};

/** Get the default selection: the 3 highest-prestige unlocked badges */
export const getDefaultSelectedBadges = (badges: BadgeProgress[]): string[] => {
  const unlocked = badges.filter((b) => b.unlocked);
  return PRESTIGE_ORDER.filter((id) => unlocked.some((b) => b.id === id)).slice(
    0,
    3,
  );
};

/** Get the highest (most prestigious) unlocked badge */
export const getHighestBadge = (
  badges: BadgeProgress[],
): BadgeProgress | null => {
  const unlockedIds = badges.filter((b) => b.unlocked).map((b) => b.id);
  const highestId = PRESTIGE_ORDER.find((id) => unlockedIds.includes(id));
  return badges.find((b) => b.id === highestId) ?? null;
};
