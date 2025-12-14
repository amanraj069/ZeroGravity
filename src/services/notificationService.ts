import { apiCallWithAuth, API_ENDPOINTS } from "@/config/api";

export interface Notification {
  _id: string;
  userId: string;
  type: "leaderboard_reward" | "message" | "system";
  title: string;
  message: string;
  points: number;
  isRead: boolean;
  isClaimed: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
  unclaimedCount: number;
  hasNewNotifications: boolean;
}

export interface NotificationCountResponse {
  unreadCount: number;
  unclaimedCount: number;
  hasNewNotifications: boolean;
}

class NotificationService {
  async getNotifications(): Promise<NotificationResponse> {
    const response = await apiCallWithAuth(API_ENDPOINTS.NOTIFICATIONS.GET);
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

  async getNotificationCount(): Promise<NotificationCountResponse> {
    const response = await apiCallWithAuth(API_ENDPOINTS.NOTIFICATIONS.COUNT);
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

  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId),
      {
        method: "PUT",
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

  async markAllAsRead(): Promise<void> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ,
      {
        method: "PUT",
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
  }

  async claimPoints(notificationId: string): Promise<{
    notification: Notification;
    pointsAdded: number;
    newTotalPoints: number;
  }> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.NOTIFICATIONS.CLAIM(notificationId),
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

export const notificationService = new NotificationService();
