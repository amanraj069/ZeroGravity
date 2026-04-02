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
  dropShadow?: string; // tailored glow behind the icon itself
  textColor: string;
  bgDark: string;
  bgLight: string;
  prestigeRank: number; // 1 = most prestigious
}

export const BADGE_VISUALS: Record<string, BadgeVisual> = {
  // COSMIC TIER
  "zero-gravity": {
    id: "zero-gravity",
    icon: "⌬",
    gradient: "from-purple-400 via-fuchsia-400 to-pink-500",
    border: "border-purple-400/60",
    glow: "shadow-[0_0_22px_4px_rgba(192,132,252,0.5)]",
    dropShadow:
      "drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] drop-shadow-[0_0_15px_rgba(192,132,252,0.8)] drop-shadow-[0_0_25px_rgba(216,180,254,0.6)]",
    textColor: "text-purple-300",
    bgDark:
      "dark:from-fuchsia-950/50 dark:via-purple-950/40 dark:to-pink-950/50",
    bgLight: "from-fuchsia-50 via-purple-50 to-pink-100",
    prestigeRank: -1,
  },
  // COSMIC TIER
  "the-infinite": {
    id: "the-infinite",
    icon: "∞",
    gradient: "from-purple-400 via-fuchsia-400 to-pink-500",
    border: "border-purple-400/60",
    glow: "shadow-[0_0_22px_4px_rgba(192,132,252,0.5)]",
    dropShadow:
      "drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] drop-shadow-[0_0_15px_rgba(192,132,252,0.8)] drop-shadow-[0_0_25px_rgba(216,180,254,0.6)]",
    textColor: "text-purple-300",
    bgDark:
      "dark:from-fuchsia-950/50 dark:via-purple-950/40 dark:to-pink-950/50",
    bgLight: "from-fuchsia-50 via-purple-50 to-pink-100",
    prestigeRank: 0,
  },
  // DIAMOND TIER
  "the-immortal": {
    id: "the-immortal",
    icon: "✦",
    gradient: "from-sky-300 via-indigo-300 to-cyan-300",
    border: "border-sky-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(125,211,252,0.45)]",
    dropShadow:
      "drop-shadow-[0_0_5px_rgba(255,255,255,0.9)] drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    textColor: "text-sky-300",
    bgDark: "dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-cyan-950/40",
    bgLight: "from-sky-50 via-indigo-50 to-cyan-50",
    prestigeRank: 1,
  },
  // DIAMOND TIER
  "the-guardian": {
    id: "the-guardian",
    icon: "◈",
    gradient: "from-sky-300 via-indigo-300 to-cyan-300",
    border: "border-indigo-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(165,180,252,0.45)]",
    dropShadow:
      "drop-shadow-[0_0_5px_rgba(255,255,255,0.9)] drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    textColor: "text-sky-300",
    bgDark: "dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-cyan-950/40",
    bgLight: "from-sky-50 via-indigo-50 to-cyan-50",
    prestigeRank: 2,
  },
  // DIAMOND TIER
  millennial: {
    id: "millennial",
    icon: "⬟",
    gradient: "from-sky-300 via-indigo-300 to-cyan-300",
    border: "border-sky-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(125,211,252,0.45)]",
    dropShadow:
      "drop-shadow-[0_0_5px_rgba(255,255,255,0.9)] drop-shadow-[0_0_12px_rgba(59,130,246,0.7)] drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]",
    textColor: "text-sky-300",
    bgDark: "dark:from-sky-950/40 dark:via-indigo-950/30 dark:to-cyan-950/40",
    bgLight: "from-sky-50 via-indigo-50 to-cyan-50",
    prestigeRank: 3,
  },
  // GOLD TIER
  "the-perfectionist": {
    id: "the-perfectionist",
    icon: "⬡",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(250,204,21,0.45)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(168,85,247,0.75)] drop-shadow-[0_0_18px_rgba(147,51,234,0.5)]",
    textColor: "text-yellow-500",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-100",
    prestigeRank: 4,
  },
  // GOLD TIER
  "full-house": {
    id: "full-house",
    icon: "❖",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(250,204,21,0.45)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(168,85,247,0.75)] drop-shadow-[0_0_18px_rgba(147,51,234,0.5)]",
    textColor: "text-yellow-500",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-100",
    prestigeRank: 5,
  },
  // GOLD TIER
  centurion: {
    id: "centurion",
    icon: "◆",
    gradient: "from-yellow-500 via-amber-400 to-yellow-600",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(250,204,21,0.45)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(168,85,247,0.75)] drop-shadow-[0_0_18px_rgba(147,51,234,0.5)]",
    textColor: "text-yellow-500",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-100",
    prestigeRank: 6,
  },
  // SILVER TIER
  "the-keeper": {
    id: "the-keeper",
    icon: "◇",
    gradient: "from-gray-300 via-slate-300 to-gray-400",
    border: "border-gray-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(209,213,219,0.4)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]",
    textColor: "text-gray-400",
    bgDark: "dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-900/40",
    bgLight: "from-gray-50 via-slate-50 to-gray-100",
    prestigeRank: 7,
  },
  // SILVER TIER
  "goal-crusher": {
    id: "goal-crusher",
    icon: "◎",
    gradient: "from-gray-300 via-slate-300 to-gray-400",
    border: "border-gray-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(209,213,219,0.4)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]",
    textColor: "text-gray-400",
    bgDark: "dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-900/40",
    bgLight: "from-gray-50 via-slate-50 to-gray-100",
    prestigeRank: 8,
  },
  // SILVER TIER
  "night-owl": {
    id: "night-owl",
    icon: "🌙",
    gradient: "from-gray-300 via-slate-300 to-gray-400",
    border: "border-gray-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(209,213,219,0.4)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]",
    textColor: "text-gray-400",
    bgDark: "dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-900/40",
    bgLight: "from-gray-50 via-slate-50 to-gray-100",
    prestigeRank: 9,
  },
  // SILVER TIER
  "early-bird": {
    id: "early-bird",
    icon: "☀️",
    gradient: "from-gray-300 via-slate-300 to-gray-400",
    border: "border-gray-300/60",
    glow: "shadow-[0_0_18px_2px_rgba(209,213,219,0.4)]",
    dropShadow:
      "drop-shadow-[0_0_10px_rgba(255,255,255,0.6)] drop-shadow-[0_0_15px_rgba(203,213,225,0.4)]",
    textColor: "text-gray-400",
    bgDark: "dark:from-gray-800/40 dark:via-slate-800/30 dark:to-gray-900/40",
    bgLight: "from-gray-50 via-slate-50 to-gray-100",
    prestigeRank: 10,
  },
};

export const PRESTIGE_ORDER = [
  "zero-gravity",
  "the-infinite",
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
