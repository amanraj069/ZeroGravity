"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SimpleFooter from "@/components/landing/SimpleFooter";
import LoadingSpinner from "@/components/LoadingSpinner";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { listDeletedQuizzes, restoreQuiz } from "@/services/quizzesService";
import { Quiz } from "@/types/quiz";

export default function DeletedQuizzesPage() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [processingQuizId, setProcessingQuizId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"restore" | null>(
    null
  );

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user?.subscription === "pro") {
      fetchDeletedQuizzes();
    }
  }, [isLoggedIn, authLoading, user, router]);

  useEffect(() => {
    // Debounced search functionality
    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        const filtered = quizzes.filter(
          (quiz) =>
            quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            quiz.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredQuizzes(filtered);
      } else {
        setFilteredQuizzes(quizzes);
      }
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, quizzes]);

  const fetchDeletedQuizzes = async () => {
    setLoading(true);
    try {
      console.log("Fetching deleted quizzes...");
      const response = await listDeletedQuizzes();
      console.log("API Response:", response);
      if (response.success) {
        console.log("Deleted quizzes data:", response.data);
        setQuizzes(response.data || []);
      } else {
        console.error("Failed to fetch deleted quizzes:", response.message);
        // If it's a Pro subscription error, redirect back to main quizzes page
        if (response.message?.includes("Pro subscription required")) {
          alert("Pro subscription required to access deleted quizzes.");
          router.push("/quizzes");
        }
      }
    } catch (error) {
      console.error("Error fetching deleted quizzes:", error);
      // Handle network or other errors gracefully
      alert("Failed to load deleted quizzes. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!confirm("Are you sure you want to restore this quiz?")) {
      return;
    }

    setProcessingQuizId(quizId);
    setProcessingAction("restore");
    try {
      const response = await restoreQuiz(quizId);
      if (response.success) {
        // Remove from deleted list
        setQuizzes((prevQuizzes) =>
          prevQuizzes.filter((quiz) => quiz.quizId !== quizId)
        );
        setFilteredQuizzes((prevFiltered) =>
          prevFiltered.filter((quiz) => quiz.quizId !== quizId)
        );
        alert("Quiz restored successfully!");
      } else {
        if (response.message?.includes("Pro subscription required")) {
          alert("Pro subscription required to restore quizzes.");
          router.push("/quizzes");
        } else {
          alert(
            `Failed to restore quiz: ${response.message || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error("Error restoring quiz:", error);
      alert("Failed to restore quiz. Please try again.");
    } finally {
      setProcessingQuizId(null);
      setProcessingAction(null);
    }
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Authenticating"
        subtitle="Verifying your cosmic credentials..."
      />
    );
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Taking you to the login portal..."
        showNavigation={false}
      />
    );
  }

  // Check if user has pro subscription
  if (user?.subscription !== "pro") {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
        <LandingNavbar />
        <main className="flex-1 px-6 py-10">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-16">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="w-20 h-20 mx-auto bg-yellow-100 flex items-center justify-center mb-6">
                    <svg
                      className="w-10 h-10 text-yellow-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-light text-gray-900 mb-4">
                    Pro Subscription Required
                  </h1>
                  <p className="text-gray-600 text-lg leading-relaxed mb-8">
                    Access to deleted quizzes and restore functionality requires
                    a Pro subscription. Upgrade your account to manage your
                    deleted quizzes.
                  </p>
                </div>

                <div className="bg-white shadow-sm p-8 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Pro Features for Quiz Management:
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        View deleted quizzes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Restore deleted quizzes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Permanent delete option
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Advanced quiz management
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => router.push("/quizzes")}
                      className="bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors text-base font-medium mr-4"
                    >
                      Back to Quizzes
                    </button>
                    <button
                      onClick={() => {
                        // TODO: Add upgrade functionality
                        alert("Upgrade functionality coming soon!");
                      }}
                      className="border border-gray-300 text-gray-700 px-8 py-3 hover:border-gray-400 hover:bg-gray-50 transition-colors text-base font-medium"
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100">
      <LandingNavbar />
      <main className="flex-1 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={() => router.push("/quizzes")}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <h1 className="text-3xl font-light text-black">
                    Deleted Quizzes
                  </h1>
                </div>
                <p className="text-gray-600">
                  Restore or permanently delete your deleted quizzes
                </p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Search deleted quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="Loading deleted quizzes..." />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredQuizzes.length === 0 && quizzes.length === 0 && (
            <div className="py-16 px-4 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-light text-gray-900 mb-3">
                  No deleted quizzes
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Quizzes you delete will appear here. You can restore them or
                  permanently delete them.
                </p>
                <button
                  onClick={() => router.push("/quizzes")}
                  className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          )}

          {/* No Search Results */}
          {!loading && filteredQuizzes.length === 0 && quizzes.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="max-w-md mx-auto text-center">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto bg-gray-100 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-light text-gray-900 mb-3">
                  No deleted quizzes found
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-6">
                  Try adjusting your search terms
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:border-gray-400 hover:bg-gray-50 transition-all"
                >
                  Clear Search
                </button>
              </div>
            </div>
          )}

          {/* Quizzes Grid */}
          {!loading && filteredQuizzes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.quizId}
                  className="bg-white shadow-sm p-6 border border-gray-100"
                >
                  {/* Header with Deleted Date and Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-xs font-medium bg-red-100 text-red-700">
                        Deleted
                      </span>
                      <span className="text-xs text-gray-500">
                        Deleted{" "}
                        {quiz.deletedAt
                          ? new Date(quiz.deletedAt).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleRestoreQuiz(quiz.quizId, e)}
                        disabled={processingQuizId === quiz.quizId}
                        className="border border-green-300 text-green-700 bg-green-50 px-3 py-1 text-xs font-medium hover:border-green-400 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                        title="Restore quiz"
                      >
                        {processingQuizId === quiz.quizId &&
                        processingAction === "restore" ? (
                          <>
                            <div className="w-3 h-3 border-2 border-green-700 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs">Restoring...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            <span className="text-xs">Restore</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quiz Title */}
                  <h3 className="text-xl font-semibold text-black mb-3 line-clamp-2">
                    {quiz.title}
                  </h3>

                  {/* Quiz Description */}
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-black">
                        {quiz.questions.length}
                      </div>
                      <div className="text-xs text-gray-500">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-black">
                        {quiz.status}
                      </div>
                      <div className="text-xs text-gray-500">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-black">
                        {new Date(quiz.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">Created</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
}
