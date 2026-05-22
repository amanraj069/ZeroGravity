import { apiCallWithAuth, API_ENDPOINTS } from "@/config/api";

export interface PublicUser {
  userId: string;
  firstName: string;
  lastName: string;
  username: string;
  profilePicture?: string;
  equippedBorder?: string;
  points: number;
  role: string;
  subscription: string;
  createdAt: string;
  isActive: boolean;
  selectedBadges?: string[];
  highestBadgeId?: string | null;
  displayBadge?: string | null;
  isProfilePublic: boolean;
}

export interface PublicProfileStreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveTasks: number;
  completedToday: number;
}

export interface PublicProfileResponse {
  user: PublicUser;
  streakInfo: PublicProfileStreakInfo;
}

export class PrivateProfileError extends Error {
  isPrivate = true;
  constructor(message = "This profile is private") {
    super(message);
    this.name = "PrivateProfileError";
  }
}

class ProfileService {
  async getPublicProfile(userId: string): Promise<PublicProfileResponse> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.AUTH.GET_PUBLIC_PROFILE(userId)
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

export const profileService = new ProfileService();
