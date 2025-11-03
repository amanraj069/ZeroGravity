"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCall, apiCallWithAuth } from "@/config/api";
import LandingNavbar from "@/components/landing/LandingNavbar";
import {
  DashboardLayout,
  SignupToggleSection,
  WaitlistUsersSection,
  type WaitlistUser,
} from "@/components/dashboard";

export default function Dashboard() {
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [waitlistUsers, setWaitlistUsers] = useState<WaitlistUser[]>([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [signupEnabled, setSignupEnabled] = useState(false);
  const [signupToggleLoading, setSignupToggleLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user) {
      // Only fetch admin-specific data if user is admin
      if (user.role === "admin") {
        fetchWaitlistUsers();
        fetchSignupStatus();
      }
    }
  }, [isLoggedIn, authLoading, user, router]);

  const fetchWaitlistUsers = async () => {
    setWaitlistLoading(true);
    try {
      const response = await apiCallWithAuth(API_ENDPOINTS.WAITLIST.LIST);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWaitlistUsers(data.data.entries);
        }
      }
    } catch (err) {
      console.error("Failed to fetch waitlist users:", err);
    } finally {
      setWaitlistLoading(false);
    }
  };

  const fetchSignupStatus = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.AUTH.SIGNUP_STATUS);

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSignupEnabled(data.enabled);
        }
      }
    } catch (err) {
      console.error("Failed to fetch signup status:", err);
    }
  };


  const toggleSignup = async () => {
    setSignupToggleLoading(true);
    try {
      const response = await apiCallWithAuth(API_ENDPOINTS.AUTH.TOGGLE_SIGNUP, {
        method: "POST",
        body: JSON.stringify({ enabled: !signupEnabled }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSignupEnabled(!signupEnabled);
        }
      } else {
        console.error(
          "Toggle signup failed:",
          response.status,
          response.statusText
        );
      }
    } catch (err) {
      console.error("Failed to toggle signup:", err);
    } finally {
      setSignupToggleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-black dark:text-white">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-black dark:text-white">Redirecting to login...</div>
      </div>
    );
  }

  return (
    <>
      <LandingNavbar />
      <DashboardLayout>
        {user?.role === "admin" ? (
          <>
            <SignupToggleSection
              signupEnabled={signupEnabled}
              signupToggleLoading={signupToggleLoading}
              onToggleSignup={toggleSignup}
            />

            <WaitlistUsersSection
              waitlistUsers={waitlistUsers}
              waitlistLoading={waitlistLoading}
              onRefresh={fetchWaitlistUsers}
            />
          </>
        ) : (
          <div className="mt-4 text-center">
            <div className="border border-gray-200 dark:border-gray-800 p-8 bg-white dark:bg-gray-800 rounded">
              <h1 className="text-3xl font-light text-black dark:text-white mb-4">
                Welcome to Dashboard
              </h1>
            </div>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}
