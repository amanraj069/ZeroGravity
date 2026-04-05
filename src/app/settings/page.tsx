"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { API_ENDPOINTS, apiCallWithAuth } from "@/config/api";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { DashboardLayout } from "@/components/dashboard";
import { ChevronLeft } from "lucide-react";

export default function SettingsPage() {
  const { user, isLoggedIn, isLoading: authLoading, setUser } = useAuth();
  const router = useRouter();

  // Settings state
  const [autoStopQuizDuration, setAutoStopQuizDuration] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (user) {
      setAutoStopQuizDuration(user.autoStopQuizDuration || 4);
    }
  }, [isLoggedIn, authLoading, user, router]);

  const handleSaveSettings = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await apiCallWithAuth(
        API_ENDPOINTS.AUTH.UPDATE_PROFILE,
        {
          method: "PUT",
          body: JSON.stringify({
            autoStopQuizDuration: Number(autoStopQuizDuration) || 4,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Settings updated successfully");
        if (data.user && setUser) {
          setUser(data.user);
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.message || "Failed to update settings");
      }
    } catch (err) {
      console.error("Save settings error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Settings"
        subtitle="Accessing your configuration..."
      />
    );
  }

  if (!isLoggedIn || !user) return null;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
            title="Go back"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-light text-black dark:text-white">
              Settings
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Manage your application preferences
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-sm border border-green-200 dark:border-green-800">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Quiz Settings */}
          {user.subscription === "pro" && (
            <div className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm font-medium text-black dark:text-white uppercase tracking-wider">
                  Quiz Settings
                </h2>
              </div>

              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-black dark:text-white">
                      Auto Stop Quiz Duration
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Automatically end active quizzes after a certain number of
                      hours (1-72 hours).
                    </p>
                  </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={autoStopQuizDuration}
                    onChange={(e) =>
                      setAutoStopQuizDuration(Number(e.target.value))
                    }
                    className="w-full md:w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none px-4 py-2.5 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-shadow text-sm"
                    placeholder="e.g. 4"
                  />
                  <button
                    onClick={handleSaveSettings}
                    disabled={
                      saving ||
                      autoStopQuizDuration < 1 ||
                      autoStopQuizDuration > 72
                    }
                    className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 flex items-center justify-center min-w-[120px] rounded-none shrink-0"
                  >
                    {saving ? "Saving..." : "Save Duration"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
