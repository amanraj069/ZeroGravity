"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, X } from "lucide-react";
import {
  notificationService,
  Notification,
} from "@/services/notificationService";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencyIcon } from "@/components/CurrencyIcon";

interface PointsAnimation {
  points: number;
}

export default function NotificationBell() {
  const { refreshPoints } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pointsAnimation, setPointsAnimation] =
    useState<PointsAnimation | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotificationCount();
      setHasNewNotifications(data.unreadCount > 0);

      if (isOpen) {
        const fullData = await notificationService.getNotifications();
        setNotifications(fullData.notifications);
        setHasNewNotifications(fullData.unreadCount > 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = async () => {
    if (!isOpen) {
      setLoading(true);
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data.notifications);
        setHasNewNotifications(data.unreadCount > 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) => {
        const next = prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n));
        setHasNewNotifications(next.some(n => !n.isRead));
        return next;
      });
      fetchNotifications(); // Fetch in background to sync state without blocking
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleClaimPoints = async (notificationId: string) => {
    try {
      const notification = notifications.find((n) => n._id === notificationId);
      const pointsToClaim = notification?.points || 0;

      await notificationService.claimPoints(notificationId);

      // Mark as read when claiming
      if (!notification?.isRead) {
        await notificationService.markAsRead(notificationId);
      }

      setNotifications((prev) => {
        const next = prev.map((n) =>
          n._id === notificationId ? { ...n, isClaimed: true, isRead: true } : n
        );
        setHasNewNotifications(next.some(n => !n.isRead));
        return next;
      });

      // Show points animation
      if (pointsToClaim > 0) {
        setPointsAnimation({ points: pointsToClaim });
        setTimeout(() => setPointsAnimation(null), 2000);
      }

      await refreshPoints();
      await fetchNotifications();
      setIsOpen(false);
    } catch (error) {
      console.error("Error claiming points:", error);
      alert("Failed to claim points. Please try again.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setHasNewNotifications(false);
      fetchNotifications(); // Fetch in background
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  return (
    <>
      {/* Points Animation - Top Center Popup */}
      {pointsAnimation && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-fade-in-down">
          <div className="px-6 py-3 shadow-lg bg-black dark:bg-white text-white dark:text-black rounded-xl">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold">
                +{pointsAnimation.points}
              </span>
              <CurrencyIcon size={16} className="shrink-0 !ml-1.5" />
            </div>
          </div>
        </div>
      )}

      <div className="relative" ref={dropdownRef}>
        {/* Bell Icon */}
        <button
          onClick={handleToggle}
          className="relative p-2 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {hasNewNotifications && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-[-50px] lg:right-[-100px] mt-2 w-[21rem] md:w-96 bg-white dark:bg-[#121216] border border-gray-200 dark:border-gray-800 shadow-lg z-50 max-h-96 overflow-hidden flex flex-col rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-lg font-semibold text-black dark:text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {notifications.some((n) => !n.isRead) && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      !notification.isRead
                        ? "bg-blue-50 dark:bg-blue-950/20"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-medium text-black dark:text-white">
                            {notification.title}
                          </h4>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-3">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {notification.points > 0 &&
                              !notification.isClaimed && (
                                <button
                                  onClick={() =>
                                    handleClaimPoints(notification._id)
                                  }
                                  className="px-3 py-1 text-xs bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
                                >
                                  <span className="flex items-center gap-1">
                                    Claim {notification.points}
                                    <CurrencyIcon size={12} className="shrink-0" />
                                  </span>
                                </button>
                              )}
                            {notification.points > 0 &&
                              notification.isClaimed && (
                                <span className="text-xs text-green-600 dark:text-green-400">
                                  ✓ Claimed
                                </span>
                              )}
                          </div>
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification._id)}
                              className="text-xs text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {new Date(notification.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
