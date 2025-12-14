import { apiCallWithAuth, API_ENDPOINTS } from "@/config/api";

export interface LeaderboardEntry {
  userId: string;
  points: number;
  rank: number | null; // null for not eligible users
  user: {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    profilePicture?: string;
    equippedBorder?: string;
    currentStreak: number;
  } | null;
}

export interface LeaderboardResponse {
  weekStart: string;
  weekEnd: string;
  entries: LeaderboardEntry[];
  notEligibleEntries: LeaderboardEntry[];
}

class LeaderboardService {
  async getWeeklyLeaderboard(): Promise<LeaderboardResponse> {
    const response = await apiCallWithAuth(API_ENDPOINTS.LEADERBOARD.GET);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  async calculateWeeklyLeaderboard(): Promise<LeaderboardResponse> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.LEADERBOARD.CALCULATE,
      {
        method: "POST",
      }
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }
}

export const leaderboardService = new LeaderboardService();
