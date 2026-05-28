"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { listDeletedQuizzes, restoreQuiz } from "@/services/quizzesService";
import { listDeletedPracticeQuizzes, restorePracticeQuiz } from "@/services/practiceQuizService";
import { Quiz } from "@/types/quiz";
import { PracticeQuiz } from "@/services/practiceQuizService";
import { motion } from "framer-motion";
import DeletedQuizzesSkeleton, {
  DeletedQuizCardsSkeleton,
} from "@/components/quizzes/DeletedQuizzesSkeleton";

function DeletedQuizzesContent() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const { showToast, showDialog } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [activeTab, setActiveTab] = useState<"hosted" | "practice">(
    typeParam === "host" ? "hosted" : "practice"
  );
  
  const [quizzes, setQuizzes] = useState<(Quiz | PracticeQuiz)[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<(Quiz | PracticeQuiz)[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [processingQuizId, setProcessingQuizId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<"restore" | null>(
    null,
  );

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && user?.subscription === "pro") {
      fetchDeletedQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authLoading, user, router, activeTab]);

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
        (quiz) => {
          const title = 'title' in quiz ? quiz.title : quiz.topic;
          const desc = 'description' in quiz ? quiz.description : "";
          return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (desc && desc.toLowerCase().includes(searchTerm.toLowerCase()));
        }
      );
      setFilteredQuizzes(filtered);
      setSearchLoading(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, quizzes]);

  const fetchDeletedQuizzes = async () => {
    setLoading(true);
    try {
      if (process.env.NODE_ENV === "development") {
        console.log("Fetching deleted quizzes...");
      }
      const response = activeTab === "hosted" ? await listDeletedQuizzes() : await listDeletedPracticeQuizzes();
      if (process.env.NODE_ENV === "development") {
        console.log("API Response:", response);
      }
      if (response.success) {
        setQuizzes(response.data || []);
      } else {
        console.error("Failed to fetch deleted quizzes:", response.message);
        if (response.message?.includes("Pro subscription required")) {
          showToast("Pro subscription required to access deleted quizzes.", "error");
          router.push("/dashboard/quizzes");
        }
      }
    } catch (error) {
      console.error("Error fetching deleted quizzes:", error);
      showToast("Failed to load deleted quizzes. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreQuiz = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    const confirmed = await showDialog({
      title: "Restore Quiz",
      message: "Are you sure you want to restore this quiz?",
      confirmLabel: "Restore",
    });
    if (!confirmed) {
      return;
    }

    setProcessingQuizId(quizId);
    setProcessingAction("restore");
    try {
      const response = activeTab === "hosted" ? await restoreQuiz(quizId) : await restorePracticeQuiz(quizId);
      if (response.success) {
        // Remove from deleted list
        setQuizzes((prevQuizzes) =>
          prevQuizzes.filter((quiz) => quiz.quizId !== quizId),
        );
        setFilteredQuizzes((prevFiltered) =>
          prevFiltered.filter((quiz) => quiz.quizId !== quizId),
        );
        showToast("Quiz restored successfully!", "success");
      } else {
        if (response.message?.includes("Pro subscription required")) {
          showToast("Pro subscription required to restore quizzes.", "error");
          router.push("/dashboard/quizzes");
        } else {
          showToast(
            `Failed to restore quiz: ${response.message || "Unknown error"}`,
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error restoring quiz:", error);
      showToast("Failed to restore quiz. Please try again.", "error");
    } finally {
      setProcessingQuizId(null);
      setProcessingAction(null);
    }
  };

  if (authLoading) {
    return <DeletedQuizzesSkeleton />;
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
      <div className="min-h-screen flex flex-col bg-transparent">
        <main className="flex-1 px-6 py-10">
          <div className="max-w-4xl mx-auto">
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
                        strokeWidth={1}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-3xl font-light text-gray-900 dark:text-white mb-4">
                    Pro Subscription Required
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
                    Access to deleted quizzes and restore functionality requires
                    a Pro subscription. Upgrade your account to manage your
                    deleted quizzes.
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-sm p-8 border border-gray-100 dark:border-gray-700 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                    Pro Features for Quiz Management:
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        View deleted quizzes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Restore deleted quizzes
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Permanent delete option
                      </span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500"></div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Advanced quiz management
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={() => router.push("/dashboard/quizzes")}
                      className="bg-black dark:bg-white text-white dark:text-black px-8 py-3 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-base font-medium mr-4 rounded-lg"
                    >
                      Back to Quizzes
                    </button>
                    <button
                      onClick={() => {
                        showToast("Upgrade functionality coming soon!", "info");
                      }}
                      className="border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-8 py-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-base font-medium rounded-lg"
                    >
                      Upgrade to Pro
                    </button>
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
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="py-6 sm:py-10 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() => router.push(`/dashboard/quizzes?type=${activeTab === "hosted" ? "host" : "practice"}`)}
                className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
              >
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8"
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
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-0.5 sm:mb-1">
                  Trash
                </h1>
              </div>
            </div>
          </div>
          
          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
            {/* Tabs */}
            <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 w-full sm:w-[60%] shrink-0 overflow-hidden relative z-0">
              {(["practice", "hosted"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSearchTerm("");
                      router.push(`/dashboard/quizzes/deleted?type=${tab === "hosted" ? "host" : "practice"}`);
                    }}
                    className={`flex-1 relative px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-colors z-10 ${
                      isActive 
                        ? "text-black dark:text-white" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-deleted-quiz-type-tab"
                        className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-xl"
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {tab === "hosted" ? "Hosted Quizzes" : "Practice Quizzes"}
                  </button>
                );
              })}
            </div>

            {/* Global Search Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative w-full sm:w-[40%] flex shrink-0"
            >
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder={`Search deleted ${activeTab === "hosted" ? "hosted" : "practice"} quizzes...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15151a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-3 sm:py-0 text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 rounded-2xl shadow-sm min-h-[48px] sm:min-h-0"
              />
            </motion.div>
          </div>

          {/* Loading State */}
          {loading && <DeletedQuizCardsSkeleton />}

          {/* Empty State */}
          {!loading && filteredQuizzes.length === 0 && quizzes.length === 0 && (
            <div className="py-16 px-4 text-center min-h-[550px] flex items-center justify-center">
              <div className="max-w-md mx-auto">
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-light text-gray-900 dark:text-white mb-3">
                  No deleted quizzes
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                  Quizzes you delete will appear here.
                </p>
                <button
                  onClick={() => router.push(`/dashboard/quizzes?type=${activeTab === "hosted" ? "host" : "practice"}`)}
                  className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-lg"
                >
                  Back to Quizzes
                </button>
              </div>
            </div>
          )}

          {/* No Search Results */}
          {!loading &&
            !searchLoading &&
            filteredQuizzes.length === 0 &&
            quizzes.length > 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="max-w-md mx-auto text-center">
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
                  <h2 className="text-xl font-light text-gray-900 dark:text-white mb-3">
                    No deleted quizzes found
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    Try adjusting your search terms
                  </p>
                  <button
                    onClick={() => setSearchTerm("")}
                    className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-lg"
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
                  className="bg-white dark:bg-gray-800 shadow-sm p-4 sm:p-6 border border-gray-100 dark:border-gray-700 rounded-xl"
                >
                  {/* Header with Deleted Date and Actions */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg">
                        Deleted
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Deleted{" "}
                        {(quiz as { deletedAt?: string | Date }).deletedAt
                          ? new Date((quiz as { deletedAt?: string | Date }).deletedAt!).toLocaleDateString()
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleRestoreQuiz(quiz.quizId, e)}
                        disabled={processingQuizId === quiz.quizId}
                        className="border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 text-xs font-medium hover:border-green-400 dark:hover:border-green-600 hover:bg-green-100 dark:hover:bg-green-900/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1 rounded-lg"
                        title="Restore quiz"
                      >
                        {processingQuizId === quiz.quizId &&
                        processingAction === "restore" ? (
                          <>
                            <div className="w-3 h-3 border-2 border-green-700 dark:border-green-400 border-t-transparent  animate-spin"></div>
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

                  <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-2 sm:mb-3 line-clamp-2">
                    {'title' in quiz ? quiz.title : quiz.topic}
                  </h3>

                  {/* Quiz Description */}
                  {'description' in quiz && quiz.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Quiz Stats */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold text-black dark:text-white">
                        {'questions' in quiz ? quiz.questions?.length : quiz.numberOfQuestions}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Questions
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold text-black dark:text-white truncate px-1">
                        {'status' in quiz ? quiz.status : "Practice"}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold text-black dark:text-white">
                        {new Date(quiz.createdAt).toLocaleDateString(
                          undefined,
                          { month: "2-digit", day: "2-digit", year: "2-digit" },
                        )}
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Created
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DeletedQuizzesPage() {
  return (
    <Suspense fallback={<DeletedQuizzesSkeleton />}>
      <DeletedQuizzesContent />
    </Suspense>
  );
}
