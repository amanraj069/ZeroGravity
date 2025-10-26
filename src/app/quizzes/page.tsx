"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SimpleFooter from "@/components/landing/SimpleFooter";
import LoadingSpinner from "@/components/LoadingSpinner";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { listUserQuizzes, deleteQuiz } from "@/services/quizzesService";
import { Quiz } from "@/types/quiz";
import Image from "next/image";

export default function QuizzesPage() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user?.subscription === "pro") {
      fetchQuizzes();
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

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      console.log("Fetching user quizzes...");
      const response = await listUserQuizzes();
      console.log("API Response:", response);
      if (response.success) {
        console.log("Quizzes data:", response.data);
        setQuizzes(response.data || []);
      } else {
        console.error("Failed to fetch quizzes:", response.message);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "published":
        return "bg-green-100 text-green-700";
      case "ended":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "draft":
        return "Draft";
      case "published":
        return "Published";
      case "ended":
        return "Ended";
      default:
        return "Unknown";
    }
  };

  const handleQuizClick = (quiz: Quiz) => {
    if (quiz.status === "draft") {
      router.push(`/quizzes/create?quizId=${quiz.quizId}`);
    } else if (quiz.status === "published") {
      router.push(`/quizzes/host/${quiz.quizId}`);
    } else {
      // For ended quizzes, maybe show results/analytics in the future
      router.push(`/quizzes/host/${quiz.quizId}`);
    }
  };

  const handleDeleteQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the quiz click

    const confirmMessage =
      user?.subscription === "pro"
        ? "Are you sure you want to delete this quiz? You can restore it later from the 'View Deleted' section."
        : "Are you sure you want to delete this quiz? This will soft delete the quiz (it won't be permanently removed).";

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingQuizId(quizId);
    try {
      const response = await deleteQuiz(quizId);
      if (response.success) {
        // Remove the quiz from the local state
        setQuizzes((prevQuizzes) =>
          prevQuizzes.filter((quiz) => quiz.quizId !== quizId)
        );
        setFilteredQuizzes((prevFiltered) =>
          prevFiltered.filter((quiz) => quiz.quizId !== quizId)
        );

        // Show success message based on subscription
        const successMessage =
          user?.subscription === "pro"
            ? "Quiz moved to deleted items. You can restore it anytime from 'View Deleted'."
            : "Quiz has been deleted. Upgrade to Pro to access restore functionality.";
        alert(successMessage);
      } else {
        alert(`Failed to delete quiz: ${response.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    } finally {
      setDeletingQuizId(null);
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
                    Quiz creation and management features are available with a
                    Pro subscription. Upgrade your account to start creating
                    engaging quizzes for your audience.
                  </p>
                </div>

                <div className="bg-white shadow-sm p-8 border border-gray-100">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Pro Features Include:
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Create unlimited quizzes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Real-time participant tracking
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Detailed analytics and insights
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">Custom join codes</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">Live leaderboards</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700">
                        Quiz hosting controls
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        // TODO: Add upgrade functionality
                        alert("Upgrade functionality coming soon!");
                      }}
                      className="bg-black text-white px-8 py-3 hover:bg-gray-800 transition-colors text-base font-medium"
                    >
                      Upgrade to Pro
                    </button>
                    <p className="text-sm text-gray-500 mt-3">
                      Contact support to upgrade your account
                    </p>
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
                <h1 className="text-3xl font-light text-black mb-2">
                  My Quizzes
                </h1>
                <p className="text-gray-600">
                  Manage and view all your created quizzes
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => router.push("/joinQuiz")}
                  className="border border-gray-300 text-gray-700 px-6 py-3 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                >
                  Join Quiz
                </button>
                {user?.subscription === "pro" && (
                  <button
                    onClick={() => router.push("/quizzes/deleted")}
                    className="border border-gray-300 text-gray-700 px-6 py-3 hover:border-gray-400 hover:bg-gray-50 transition-colors text-sm font-medium cursor-pointer"
                  >
                    View Deleted
                  </button>
                )}
                <button
                  onClick={() => router.push("/createQuiz")}
                  className="bg-black text-white px-6 py-3 hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
                >
                  Create New Quiz
                </button>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-6 relative">
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-all"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-black  animate-spin"></div>
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="Loading quizzes..." />
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredQuizzes.length === 0 && quizzes.length === 0 && (
            <div className="py-16 px-4">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
                  {/* Image Container - Left Side */}
                  <div className="flex-shrink-0 lg:w-1/2">
                    <div className="relative w-80 h-80 lg:w-96 lg:h-96 mx-auto">
                      <Image
                        src="/quiz/noQuizzes.png"
                        alt="No quizzes illustration"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>

                  {/* Content - Right Side */}
                  <div className="flex-1 lg:w-1/2 text-center lg:text-left">
                    <div className="space-y-6">
                      <h2 className="text-3xl lg:text-4xl font-light text-gray-900 leading-tight">
                        Ready to create your first quiz?
                      </h2>
                      <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto lg:mx-0">
                        Build engaging quizzes that captivate your audience and
                        make learning interactive and fun
                      </p>

                      {/* Feature List - Simple and Clean */}
                      <div className="space-y-3 max-w-md mx-auto lg:mx-0">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-black"></div>
                          <span className="text-sm text-gray-700">
                            Real-time results and analytics
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-black"></div>
                          <span className="text-sm text-gray-700">
                            Support for multiple participants
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-black"></div>
                          <span className="text-sm text-gray-700">
                            Easy sharing with join codes
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-black"></div>
                          <span className="text-sm text-gray-700">
                            Detailed performance insights
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="pt-4">
                        <button
                          onClick={() => router.push("/createQuiz")}
                          className="w-full flex items-center justify-center px-8 py-3 bg-black text-white text-base font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                        >
                          Create Your First Quiz
                          <svg
                            className="ml-2 w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 4v16m8-8H4"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* No Search Results */}
          {!loading && filteredQuizzes.length === 0 && quizzes.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="max-w-md mx-auto text-center">
                {/* Search Icon */}
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

                {/* Content */}
                <div className="space-y-3">
                  <h2 className="text-xl font-light text-gray-900">
                    No quizzes found
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    Try adjusting your search terms to find what you&apos;re
                    looking for
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-6">
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-gray-700 text-sm font-medium hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Clear Search
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quizzes Grid */}
          {!loading && filteredQuizzes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredQuizzes.map((quiz) => (
                <div
                  key={quiz.quizId}
                  onClick={() => handleQuizClick(quiz)}
                  className="bg-white shadow-sm p-6 hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-gray-200 group"
                >
                  {/* Header with Status, Date and Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-medium ${getStatusColor(
                          quiz.status
                        )}`}
                      >
                        {getStatusText(quiz.status)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {quiz.joinCode && quiz.status === "published" && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500 mb-1">
                            Join Code
                          </div>
                          <span className="text-sm font-mono text-gray-700 bg-gray-100 px-3 py-1">
                            {quiz.joinCode}
                          </span>
                        </div>
                      )}
                      {quiz.status === "ended" && (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1">
                          Code Expired
                        </span>
                      )}
                      <button
                        onClick={(e) => handleDeleteQuiz(quiz.quizId, e)}
                        disabled={deletingQuizId === quiz.quizId}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        title="Delete quiz"
                      >
                        {deletingQuizId === quiz.quizId ? (
                          <div className="w-4 h-4 border-2 border-red-500 border-t-transparent  animate-spin"></div>
                        ) : (
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Quiz Title */}
                  <h3 className="text-xl font-semibold text-black mb-3 group-hover:text-gray-700 transition-colors line-clamp-2">
                    {quiz.title}
                  </h3>

                  {/* Quiz Description */}
                  {quiz.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Stats */}
                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                    <div className="text-center">
                      <div className="text-lg font-semibold text-black">
                        {quiz.questions.length}
                      </div>
                      <div className="text-xs text-gray-500">Questions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-black">
                        {quiz.participants || 0}
                      </div>
                      <div className="text-xs text-gray-500">Participants</div>
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
