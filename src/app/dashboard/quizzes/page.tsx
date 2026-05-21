"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { listUserQuizzes, deleteQuiz } from "@/services/quizzesService";
import { Quiz } from "@/types/quiz";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import Image from "next/image";
import { Plus, Trash2, Users, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import QuizzesSkeleton, {
  QuizCardsSkeleton,
} from "@/components/quizzes/QuizzesSkeleton";

export default function QuizzesPage() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const { showToast, showDialog } = useToast();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user?.subscription === "pro") {
      fetchQuizzes();
    }
  }, [isLoggedIn, authLoading, user, router]);

  useEffect(() => {
    // Debounced search functionality
    if (!searchTerm.trim()) {
      setFilteredQuizzes(quizzes);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      const filtered = quizzes.filter(
        (quiz) =>
          quiz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          quiz.description?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredQuizzes(filtered);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, quizzes]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("Fetching user quizzes...");
      }
      const response = await listUserQuizzes();
      if (process.env.NODE_ENV === "development") {
        console.log("API Response:", response);
      }
      if (response.success) {
        if (process.env.NODE_ENV === "development") {
          console.log("Quizzes data:", response.data);
        }
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
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
      case "published":
        return "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300";
      case "ended":
        return "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300";
      case "active":
        return "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
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
      case "active":
        return "Active";
      default:
        return "Unknown";
    }
  };

  const handleQuizClick = (quiz: Quiz) => {
    if (quiz.status === "active") {
      router.push(`/hosted/${quiz.quizId}`);
    } else if (quiz.status === "published") {
      router.push(
        `/dashboard/quizzes/host/${quiz.quizId}${quiz.joinCode ? `?code=${quiz.joinCode}` : ""}`,
      );
    } else {
      router.push(`/dashboard/quizzes/create?quizId=${quiz.quizId}&edit=true`);
    }
  };

  const handleDeleteQuiz = async (
    quizId: string,
    event: React.MouseEvent,
    status: string,
  ) => {
    event.stopPropagation(); // Prevent triggering the quiz click

    if (status === "active") {
      showToast("Cannot delete an active quiz. Please end the quiz first.", "error");
      return;
    }

    const confirmMessage =
      user?.subscription === "pro"
        ? "Are you sure you want to delete this quiz? You can restore it later from the 'View Deleted' section."
        : "Are you sure you want to delete this quiz? This will soft delete the quiz (it won't be permanently removed).";

    const confirmed = await showDialog({
      title: "Delete Quiz",
      message: confirmMessage,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (!confirmed) {
      return;
    }

    setDeletingQuizId(quizId);
    try {
      const response = await deleteQuiz(quizId);
      if (response.success) {
        // Remove the quiz from the local state
        setQuizzes((prevQuizzes) =>
          prevQuizzes.filter((quiz) => quiz.quizId !== quizId),
        );
        setFilteredQuizzes((prevFiltered) =>
          prevFiltered.filter((quiz) => quiz.quizId !== quizId),
        );

        // Show success message based on subscription
        const successMessage =
          user?.subscription === "pro"
            ? "Quiz moved to deleted items. You can restore it anytime from 'View Deleted'."
            : "Quiz has been deleted. Upgrade to Pro to access restore functionality.";
        showToast(successMessage, "success");
      } else {
        showToast(`Failed to delete quiz: ${response.message || "Unknown error"}`, "error");
      }
    } catch (error) {
      console.error("Error deleting quiz:", error);
      showToast("Failed to delete quiz. Please try again.", "error");
    } finally {
      setDeletingQuizId(null);
    }
  };

  if (authLoading) {
    return <QuizzesSkeleton />;
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
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <main className="flex-1 py-10 max-w-6xl mx-auto">
          <div className="max-w-4xl px-4 mx-auto">
            <div className="text-center py-16">
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto flex items-center justify-center mb-8">
                    <svg
                      className="w-16 h-16 sm:w-24 sm:h-24 text-black dark:text-white"
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
                  <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
                    Pro Subscription Required
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                    Quiz creation and management features are available with a
                    Pro subscription. Upgrade your account to start creating
                    engaging quizzes for your audience.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-sm p-8 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Pro Features Include:
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Create unlimited quizzes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Real-time participant tracking
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Detailed analytics and insights
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Custom join codes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Live leaderboards
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Quiz hosting controls
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        // TODO: Add upgrade functionality
                        showToast("Upgrade functionality coming soon!", "info");
                      }}
                      className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-base font-medium rounded-lg"
                    >
                      Upgrade to Pro
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                      Contact support to upgrade your account
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="flex-1 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-3 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <BackButton />
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-0">
                      My Quizzes
                    </h1>
                  </div>
                </div>

                {/* Mobile icon actions */}
                <div className="flex items-center gap-2 sm:hidden">
                  {user?.subscription === "pro" && (
                    <button
                      onClick={() => router.push("/dashboard/quizzes/deleted")}
                      className="h-9 w-9 flex items-center justify-center border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                      aria-label="View Deleted"
                      title="View Deleted"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-end sm:shrink-0">
                <button
                  onClick={() => router.push("/joinQuiz")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer rounded-xl"
                >
                  <Users className="w-4 h-4" />
                  Join Quiz
                </button>
                {user?.subscription === "pro" && (
                  <button
                    onClick={() => router.push("/dashboard/quizzes/deleted")}
                    className="hidden sm:flex w-full sm:w-auto items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                    Trash
                  </button>
                )}

              </div>
            </div>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-3 sm:mb-6 relative"
          >
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-all rounded-xl"
            />
            {searchLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white  animate-spin"></div>
              </div>
            )}
          </motion.div>

          {/* Loading State */}
          {loading && <QuizCardsSkeleton />}

          {/* Empty State */}
          <AnimatePresence>
            {!loading &&
              filteredQuizzes.length === 0 &&
              quizzes.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="py-8 sm:py-16 px-4"
                >
                  <div className="max-w-5xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-2 sm:gap-12 lg:gap-16">
                      {/* Image Container - Left Side */}
                      <div className="flex-shrink-0 lg:w-1/2">
                        <div className="relative w-72 h-72 sm:w-80 sm:h-80 lg:w-[400px] lg:h-[400px] mx-auto">
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
                        <div className="flex flex-col gap-4 sm:gap-5">
                          <h2 className="hidden lg:block text-xl sm:text-2xl lg:text-3xl font-light text-gray-900 dark:text-white leading-tight">
                            Ready to create your first quiz?
                          </h2>
                          <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-md leading-relaxed ">
                            Build engaging quizzes that captivate your audience
                            and make learning interactive.
                          </p>

                          {/* Feature List - Desktop Only */}
                          <div className="hidden lg:block space-y-3 max-w-md mx-auto lg:mx-0 pt-2">
                            {[
                              "Real-time results and analytics",
                              "Support for multiple participants",
                              "Easy sharing with join codes",
                              "Detailed performance insights",
                            ].map((feature, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + i * 0.1 }}
                                className="flex items-center space-x-3"
                              >
                                <div className="w-1.5 h-1.5 bg-black dark:bg-white rounded-full"></div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {feature}
                                </span>
                              </motion.div>
                            ))}
                          </div>

                          {/* Action Button */}
                          <div className="pt-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push("/createQuiz")}
                              className="inline-flex items-center justify-center px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-xl"
                            >
                              Create Your First Quiz
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
          </AnimatePresence>

          {/* No Search Results */}
          {!loading &&
            !searchLoading &&
            filteredQuizzes.length === 0 &&
            quizzes.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="max-w-md mx-auto text-center">
                  {/* Search Icon */}
                  <div className="mb-6">
                    <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto flex items-center justify-center mb-6">
                      <svg
                        className="w-16 h-16 sm:w-24 sm:h-24 text-black dark:text-white opacity-20 dark:opacity-40"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h2 className="text-xl font-light text-gray-900 dark:text-white">
                      No quizzes found
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                      Try adjusting your search terms to find what you&apos;re
                      looking for
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="mt-6">
                    <button
                      onClick={() => setSearchTerm("")}
                      className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-xl"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Quizzes Grid */}
          {!loading && filteredQuizzes.length > 0 && (
            <motion.div
              layout
              className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
            >
              <motion.button
                layout
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  layout: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
                  opacity: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: 0 },
                  y: { type: "spring", stiffness: 350, damping: 25, delay: 0 },
                  scale: { type: "spring", stiffness: 350, damping: 25, delay: 0 }
                }}
                onClick={() => router.push("/createQuiz")}
                whileHover={{
                  y: -4,
                  scale: 1.005,
                  transition: { type: "spring", stiffness: 300, damping: 20 }
                }}
                className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/40 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors duration-300 p-3 sm:p-5 rounded-xl group/add overflow-hidden"
              >
                {/* Invisible dummy structure to match exact quiz card height */}
                <div className="invisible w-full flex flex-col pointer-events-none" aria-hidden="true">
                  <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                    <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-1">
                      <span className="shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full opacity-0">Draft</span>
                      <h3 className="text-base sm:text-lg font-semibold line-clamp-1 sm:line-clamp-2 min-w-0">Title</h3>
                    </div>
                  </div>
                  <div className="hidden sm:flex mb-3 items-center justify-between gap-2 text-xs">
                    <span className="truncate">Created Date</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2 sm:mt-3 pt-2.5 sm:pt-3 border-t border-transparent">
                    <div>
                      <div className="text-sm sm:text-base font-semibold">0</div>
                      <div className="text-[11px] sm:text-xs">Questions</div>
                    </div>
                  </div>
                </div>

                {/* Actual button content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-50 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover/add:border-gray-400 transition-colors">
                    <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 group-hover/add:text-black dark:group-hover/add:text-white transition-colors" />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 group-hover/add:text-black dark:group-hover/add:text-white transition-colors">
                    ADD QUIZ
                  </span>
                </div>
              </motion.button>
              <AnimatePresence>
                {filteredQuizzes.map((quiz, index) => (
                  <motion.div
                    key={quiz.quizId}
                    layout
                    initial={{ opacity: 0, y: 15, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    transition={{
                      layout: { type: "spring", stiffness: 350, damping: 25, mass: 0.8 },
                      opacity: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: (index + 1) * 0.06 },
                      y: { type: "spring", stiffness: 350, damping: 25, delay: (index + 1) * 0.06 },
                      scale: { type: "spring", stiffness: 350, damping: 25, delay: (index + 1) * 0.06 }
                    }}
                    onClick={() => handleQuizClick(quiz)}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      transition: { type: "spring", stiffness: 300, damping: 20 }
                    }}
                    className="flex flex-col h-full bg-white dark:bg-gray-800 shadow-sm p-3 sm:p-5 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 group rounded-xl"
                  >
                    {/* Header with Status + Title and Actions */}
                    <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                      <div className="min-w-0 flex items-center gap-2 sm:gap-3 flex-1">
                        <span
                          className={`shrink-0 px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full ${getStatusColor(
                            quiz.status,
                          )}`}
                        >
                          {getStatusText(quiz.status)}
                        </span>
                        <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-1 sm:line-clamp-2 min-w-0">
                          {quiz.title}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                        <button
                          onClick={(e) =>
                            handleDeleteQuiz(quiz.quizId, e, quiz.status)
                          }
                          disabled={
                            deletingQuizId === quiz.quizId ||
                            quiz.status === "active"
                          }
                          className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors rounded-xl"
                          title={
                            quiz.status === "active"
                              ? "Cannot delete an active quiz"
                              : "Delete quiz"
                          }
                        >
                          {deletingQuizId === quiz.quizId ? (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-red-500 dark:border-red-400 border-t-transparent animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="hidden sm:flex mb-3 items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="truncate">
                        Created {new Date(quiz.createdAt).toLocaleDateString()}
                      </span>
                      <span className="shrink-0">
                        Updated {new Date(quiz.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Quiz Description */}
                    {quiz.description && (
                      <p className="hidden sm:block text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                        {quiz.description}
                      </p>
                    )}

                    {/* Quiz Stats */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2 sm:mt-3 pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-gray-700">
                      <div className="text-center">
                        <div className="text-sm sm:text-base font-semibold text-black dark:text-white">
                          {quiz.questions.length}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Questions
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm sm:text-base font-semibold text-black dark:text-white">
                          {quiz.participants || 0}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                          Participants
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
