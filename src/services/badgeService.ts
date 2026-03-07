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
  "the-immortal": {
    id: "the-immortal",
    icon: "✦",
    gradient: "from-emerald-400 via-cyan-400 to-purple-500",
    border: "border-emerald-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(52,211,153,0.45)]",
    textColor: "text-emerald-300",
    bgDark:
      "dark:from-emerald-950/40 dark:via-cyan-950/30 dark:to-purple-950/40",
    bgLight: "from-emerald-50 via-cyan-50 to-purple-50",
    prestigeRank: 1,
  },
  "the-guardian": {
    id: "the-guardian",
    icon: "◈",
    gradient: "from-purple-500 via-violet-400 to-fuchsia-500",
    border: "border-purple-500/60",
    glow: "shadow-[0_0_18px_2px_rgba(168,85,247,0.45)]",
    textColor: "text-purple-300",
    bgDark:
      "dark:from-purple-950/40 dark:via-violet-950/30 dark:to-fuchsia-950/40",
    bgLight: "from-purple-50 via-violet-50 to-fuchsia-50",
    prestigeRank: 2,
  },
  "the-perfectionist": {
    id: "the-perfectionist",
    icon: "⬡",
    gradient: "from-amber-400 via-yellow-300 to-orange-400",
    border: "border-amber-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(251,191,36,0.45)]",
    textColor: "text-amber-300",
    bgDark:
      "dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/40",
    bgLight: "from-amber-50 via-yellow-50 to-orange-50",
    prestigeRank: 3,
  },
  "the-keeper": {
    id: "the-keeper",
    icon: "◇",
    gradient: "from-teal-400 via-cyan-300 to-sky-400",
    border: "border-teal-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(45,212,191,0.4)]",
    textColor: "text-teal-300",
    bgDark: "dark:from-teal-950/40 dark:via-cyan-950/30 dark:to-sky-950/40",
    bgLight: "from-teal-50 via-cyan-50 to-sky-50",
    prestigeRank: 4,
  },
  millennial: {
    id: "millennial",
    icon: "⬟",
    gradient: "from-yellow-400 via-amber-300 to-yellow-500",
    border: "border-yellow-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(234,179,8,0.4)]",
    textColor: "text-yellow-300",
    bgDark:
      "dark:from-yellow-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-yellow-50 via-amber-50 to-yellow-50",
    prestigeRank: 5,
  },
  "goal-crusher": {
    id: "goal-crusher",
    icon: "◎",
    gradient: "from-rose-500 via-red-400 to-orange-500",
    border: "border-rose-500/60",
    glow: "shadow-[0_0_18px_2px_rgba(244,63,94,0.4)]",
    textColor: "text-rose-300",
    bgDark: "dark:from-rose-950/40 dark:via-red-950/30 dark:to-orange-950/40",
    bgLight: "from-rose-50 via-red-50 to-orange-50",
    prestigeRank: 6,
  },
  "full-house": {
    id: "full-house",
    icon: "⬡",
    gradient: "from-green-400 via-emerald-300 to-teal-400",
    border: "border-green-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(74,222,128,0.4)]",
    textColor: "text-green-300",
    bgDark:
      "dark:from-green-950/40 dark:via-emerald-950/30 dark:to-teal-950/40",
    bgLight: "from-green-50 via-emerald-50 to-teal-50",
    prestigeRank: 7,
  },
  centurion: {
    id: "centurion",
    icon: "◆",
    gradient: "from-slate-400 via-gray-300 to-zinc-400",
    border: "border-slate-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(148,163,184,0.4)]",
    textColor: "text-slate-300",
    bgDark: "dark:from-slate-950/40 dark:via-gray-950/30 dark:to-zinc-950/40",
    bgLight: "from-slate-50 via-gray-50 to-zinc-50",
    prestigeRank: 8,
  },
  "night-owl": {
    id: "night-owl",
    icon: "◑",
    gradient: "from-indigo-500 via-blue-400 to-violet-500",
    border: "border-indigo-500/60",
    glow: "shadow-[0_0_18px_2px_rgba(99,102,241,0.4)]",
    textColor: "text-indigo-300",
    bgDark:
      "dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-violet-950/40",
    bgLight: "from-indigo-50 via-blue-50 to-violet-50",
    prestigeRank: 9,
  },
  "early-bird": {
    id: "early-bird",
    icon: "◐",
    gradient: "from-orange-400 via-amber-300 to-yellow-400",
    border: "border-orange-400/60",
    glow: "shadow-[0_0_18px_2px_rgba(251,146,60,0.4)]",
    textColor: "text-orange-300",
    bgDark:
      "dark:from-orange-950/40 dark:via-amber-950/30 dark:to-yellow-950/40",
    bgLight: "from-orange-50 via-amber-50 to-yellow-50",
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
