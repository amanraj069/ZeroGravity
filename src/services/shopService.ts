import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import { CSSProperties } from "react";

export interface Border {
  id: string;
  name: string;
  price: number;
  color: string;
  description: string;
  tier: "free" | "common" | "rare" | "epic" | "legendary" | "mythic";
  animated?: boolean;
  owned?: boolean;
  equipped?: boolean;
}

// Border style configuration - defines how each border should be rendered
export interface BorderStyleConfig {
  width: number; // Border width in pixels
  color: string; // Border color
  glowIntensity?: number; // Box shadow blur radius (0 = no glow)
  glowColor?: string; // Custom glow color (defaults to border color)
  customStyle?: CSSProperties; // Override for special cases
}

// Border configuration map - centralized definition of all border styles
const BORDER_STYLES: Record<string, BorderStyleConfig> = {
  default: {
    width: 0,
    color: "transparent",
  },
  bronze: {
    width: 3,
    color: "#CD7F32",
  },
  silver: {
    width: 3,
    color: "#C0C0C0",
  },
  gold: {
    width: 4,
    color: "#FFD700",
    glowIntensity: 8,
  },
  crimson: {
    width: 4,
    color: "#DC143C",
    glowIntensity: 6,
  },
  purple: {
    width: 4,
    color: "#9B59B6",
    glowIntensity: 8,
  },
  emerald: {
    width: 4,
    color: "#50C878",
    glowIntensity: 8,
  },
  sakura: {
    width: 4,
    color: "#FFB7C5",
    glowIntensity: 10,
  },
  diamond: {
    width: 4,
    color: "#B9F2FF",
    glowIntensity: 12,
  },
  aurora: {
    width: 3,
    color: "#00ff88",
    // Aurora uses CSS animation, so minimal inline style
    customStyle: {
      border: "3px solid #00ff88",
    },
  },
  quantum: {
    width: 4,
    color: "#001f3f",
    // Quantum uses CSS animation with pseudo-elements
    customStyle: {
      border: "4px solid #001f3f",
    },
  },
  titan: {
    width: 4,
    color: "#c4b5fd",
    // Galaxy border uses CSS animation
    customStyle: {
      border: "4px solid #c4b5fd",
    },
  },
};

export interface ShopItemsResponse {
  success: boolean;
  data: {
    borders: Border[];
    userPoints: number;
  };
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  data?: {
    newPoints: number;
    unlockedBorders: string[];
  };
}

export interface EquipResponse {
  success: boolean;
  message: string;
  data?: {
    equippedBorder: string;
  };
}

export interface UserBordersResponse {
  success: boolean;
  data: {
    borders: Border[];
    equippedBorder: string;
  };
}

export interface PointsResponse {
  success: boolean;
  data: {
    points: number;
    totalPointsEarned: number;
    equippedBorder: string;
  };
}

// Get all shop items
export const getShopItems = async (): Promise<ShopItemsResponse | null> => {
  try {
    const response = await apiCallWithAuth(API_ENDPOINTS.SHOP.ITEMS);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching shop items:", error);
    return null;
  }
};

// Purchase a border
export const purchaseBorder = async (
  borderId: string
): Promise<PurchaseResponse | null> => {
  try {
    const response = await apiCallWithAuth(API_ENDPOINTS.SHOP.PURCHASE, {
      method: "POST",
      body: JSON.stringify({ borderId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error purchasing border:", error);
    return null;
  }
};

// Equip a border
export const equipBorder = async (
  borderId: string
): Promise<EquipResponse | null> => {
  try {
    const response = await apiCallWithAuth(API_ENDPOINTS.SHOP.EQUIP, {
      method: "POST",
      body: JSON.stringify({ borderId }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error equipping border:", error);
    return null;
  }
};

// Get user's unlocked borders
export const getUserBorders = async (): Promise<UserBordersResponse | null> => {
  try {
    const response = await apiCallWithAuth(API_ENDPOINTS.SHOP.MY_BORDERS);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user borders:", error);
    return null;
  }
};

// Get user points
export const getUserPoints = async (): Promise<PointsResponse | null> => {
  try {
    const response = await apiCallWithAuth(API_ENDPOINTS.SHOP.POINTS);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching user points:", error);
    return null;
  }
};

/**
 * Get border style configuration for a given border ID
 * Uses a configuration-driven approach for maintainability
 */
export const getBorderStyleConfig = (
  borderId: string
): BorderStyleConfig | null => {
  return BORDER_STYLES[borderId] || null;
};

/**
 * Generate CSS properties for a border based on its configuration
 * This replaces the old getBorderStyle function with a cleaner, data-driven approach
 * @param borderId - The border ID
 * @param size - Optional size in pixels (default: 128px for standard profile pictures)
 */
export const getBorderStyle = (
  borderId: string,
  size: number = 128
): CSSProperties => {
  const config = getBorderStyleConfig(borderId);

  if (!config) {
    // Fallback for unknown borders
    return {
      border: "3px solid transparent",
    };
  }

  // Calculate star scale for galaxy border based on size
  // Reference size is 128px (standard profile picture size)
  const starScale = size / 128;

  // If custom style is provided, use it (for animated borders)
  if (config.customStyle) {
    // For titan (galaxy) border, add star scale variable
    if (borderId === "titan") {
      return {
        ...config.customStyle,
        ["--star-scale" as string]: starScale,
      };
    }
    return config.customStyle;
  }

  // Build style from configuration
  const style: CSSProperties = {
    border: `${config.width}px solid ${config.color}`,
  };

  // Add glow effect if specified
  if (config.glowIntensity && config.glowIntensity > 0) {
    const glowColor = config.glowColor || config.color;
    style.boxShadow = `0 0 ${config.glowIntensity}px ${glowColor}`;
  }

  return style;
};

// Animation class mapping for animated borders
const ANIMATION_CLASSES: Record<string, string> = {
  titan: "animate-titan-glow",
  aurora: "animate-aurora-glow",
  quantum: "animate-quantum-glow",
};

/**
 * Get animation class for animated borders
 * Returns empty string if border doesn't have animation
 */
export const getAnimationClass = (borderId: string): string => {
  return ANIMATION_CLASSES[borderId] || "";
};

// Tier colors for badges
export const getTierColor = (tier: string): string => {
  const tierColors: Record<string, string> = {
    free: "gray",
    common: "green",
    rare: "blue",
    epic: "purple",
    legendary: "yellow",
    mythic: "red",
  };
  return tierColors[tier] || "gray";
};
