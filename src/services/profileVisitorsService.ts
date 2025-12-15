import { apiCallWithAuth, API_ENDPOINTS } from "@/config/api";

export interface ProfileVisitor {
  visitor: {
    userId: string;
    firstName: string;
    lastName: string;
    username: string;
    profilePicture?: string | null;
    equippedBorder?: string;
  };
  lastVisited: string;
  visitCount: number;
}

export interface ProfileVisitorsResponse {
  visitors: ProfileVisitor[];
}

class ProfileVisitorsService {
  async getProfileVisitors(): Promise<ProfileVisitorsResponse> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.AUTH.GET_PROFILE_VISITORS
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

export const profileVisitorsService = new ProfileVisitorsService();
