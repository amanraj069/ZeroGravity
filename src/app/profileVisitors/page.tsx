"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import Image from "next/image";
import {
  profileVisitorsService,
  ProfileVisitor,
} from "@/services/profileVisitorsService";
import { BackButton } from "@/components/BackButton";
import { getBorderStyle, getAnimationClass } from "@/services/shopService";

export default function ProfileVisitors() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [visitors, setVisitors] = useState<ProfileVisitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user?.subscription === "pro") {
      fetchVisitors();
    } else if (isLoggedIn && user?.subscription !== "pro") {
      setError("Pro subscription required");
      setLoading(false);
    }
  }, [isLoggedIn, authLoading, user, router]);

  const fetchVisitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await profileVisitorsService.getProfileVisitors();
      setVisitors(data.visitors);
    } catch (err) {
      console.error("Failed to fetch profile visitors:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load profile visitors",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? "minute" : "minutes"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  if (authLoading || loading) {
    return (
      <ZeroGravityLoading
        title="Loading Profile Visitors"
        subtitle="Fetching profile visitors..."
        showNavigation={false}
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  if (user?.subscription !== "pro") {
    return (
      <DashboardLayout>
        <div className="mt-2 space-y-3 md:space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
            <h1 className="text-xl md:text-2xl font-semibold text-black dark:text-white mb-2">
              Pro Subscription Required
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {error ||
                "Profile visitors feature is available with a Pro subscription. Upgrade your account to see who viewed your profile."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && visitors.length === 0) {
    return (
      <DashboardLayout>
        <div className="mt-2 space-y-3 md:space-y-4">
          <div className="border border-gray-200 dark:border-gray-800 p-4 md:p-6 bg-white dark:bg-gray-800">
            <h1 className="text-xl md:text-2xl font-semibold text-black dark:text-white mb-2">
              Error Loading Visitors
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={fetchVisitors}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mt-4 space-y-3 md:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-base sm:text-xl md:text-3xl font-light text-black dark:text-white flex items-center gap-2 leading-none mb-1">
                Profile Visitors
              </h1>
              <p className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">
                People who viewed your profile
              </p>
            </div>
          </div>
        </div>

        {/* Visitors Table */}
        <div className="mt-12 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-2 sm:px-16 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Visits
                  </th>
                  <th className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Visited
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {visitors.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400"
                    >
                      No visitors yet
                    </td>
                  </tr>
                ) : (
                  visitors.map((item, index) => {
                    const visitor = item.visitor;
                    return (
                      <tr
                        key={visitor.userId}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors cursor-pointer"
                        onClick={() => {
                          router.push(`/profile/${visitor.userId}`);
                        }}
                      >
                        <td className="pl-4 sm:pl-10 pr-2 sm:pr-6 py-3 sm:py-6 whitespace-nowrap text-center">
                          <div className="text-xs sm:text-sm font-semibold text-black dark:text-white">
                            #{index + 1}
                          </div>
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 text-left">
                          {visitor ? (
                            <div className="flex items-center gap-6 sm:gap-8">
                              <div
                                className={`w-10 h-10 sm:w-14 sm:h-14 overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 ${getAnimationClass(
                                  visitor.equippedBorder || "",
                                )}`}
                                style={getBorderStyle(
                                  visitor.equippedBorder || "default",
                                  56,
                                )}
                              >
                                {visitor.profilePicture ? (
                                  <Image
                                    src={visitor.profilePicture}
                                    alt={`${visitor.firstName} ${visitor.lastName}`}
                                    width={56}
                                    height={56}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="text-xs sm:text-base font-light text-gray-400 dark:text-gray-500">
                                    {visitor.firstName.charAt(0).toUpperCase()}
                                    {visitor.lastName.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs sm:text-sm font-medium text-black dark:text-white truncate">
                                  {visitor.firstName} {visitor.lastName}
                                </div>
                                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{visitor.username}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                              Visitor not found
                            </div>
                          )}
                        </td>
                        <td className="px-2 sm:px-6 py-3 sm:py-6 whitespace-nowrap text-center">
                          <div className="text-xs sm:text-sm text-black dark:text-white">
                            {item.visitCount}
                          </div>
                        </td>
                        <td className="pl-2 sm:pl-6 pr-4 sm:pr-10 py-3 sm:py-6 whitespace-nowrap text-center">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(item.lastVisited)}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
