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

// Border color mapping for CSS (square borders)
export const getBorderStyle = (borderId: string): CSSProperties => {
  const borderColors: Record<string, string> = {
    default: "transparent",
    bronze: "#CD7F32",
    silver: "#C0C0C0",
    gold: "#FFD700",
    purple: "#9B59B6",
    diamond: "#B9F2FF",
    titan: "#FF4500",
  };

  const color = borderColors[borderId] || "transparent";

  if (borderId === "default") {
    return {};
  }

  if (borderId === "titan") {
    return {
      boxShadow: `0 0 9px ${color}, 0 0 15px ${color}`,
      border: `4px solid ${color}`,
    };
  }

  if (borderId === "diamond") {
    return {
      boxShadow: `0 0 12px ${color}`,
      border: `4px solid ${color}`,
    };
  }

  if (borderId === "purple" || borderId === "gold") {
    return {
      border: `4px solid ${color}`,
      boxShadow: `0 0 8px ${color}`,
    };
  }

  return {
    border: `3px solid ${color}`,
  };
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
