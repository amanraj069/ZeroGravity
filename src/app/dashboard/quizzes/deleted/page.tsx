"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  listDeletedQuizzes,
  restoreQuiz,
  permanentlyDeleteQuiz,
} from "@/services/quizzesService";
import {
  listDeletedPracticeQuizzes,
  restorePracticeQuiz,
  permanentlyDeletePracticeQuiz,
} from "@/services/practiceQuizService";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Clock, Folder, Trash2, RotateCcw } from "lucide-react";
import DeletedQuizzesSkeleton, {
  DeletedQuizCardsSkeleton,
} from "@/components/quizzes/DeletedQuizzesSkeleton";

type DeletedQuizCard = {
  quizId: string;
  title?: string;
  name?: string;
  topic?: string;
  description?: string;
  categories?: string[];
  questions?: unknown[];
  numberOfQuestions?: number;
  status?: string;
  createdAt?: string | Date;
  deletedAt?: string | Date;
  difficulty?: string;
  timePerQuestion?: number;
  isGivenUp?: boolean;
};

function DeletedQuizzesContent() {
  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const { showToast, showDialog } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");

  const [activeTab, setActiveTab] = useState<"hosted" | "practice">(
    typeParam === "host" ? "hosted" : "practice",
  );
  const [quizzes, setQuizzes] = useState<DeletedQuizCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<DeletedQuizCard[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [processingQuizId, setProcessingQuizId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<
    "restore" | "permanent" | null
  >(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  useEffect(() => {
    if (!typeParam) {
      router.replace("/dashboard/quizzes/deleted?type=practice");
    } else {
      setActiveTab(typeParam === "host" ? "hosted" : "practice");
    }
  }, [typeParam, router]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchDeletedQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authLoading, user, activeTab, router]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredQuizzes(quizzes);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const timeoutId = setTimeout(() => {
      const term = searchTerm.toLowerCase();
      const filtered = quizzes.filter((quiz) => {
        const title = getQuizTitle(quiz).toLowerCase();
        const desc = (quiz.description || "").toLowerCase();
        const categories = (quiz.categories || []).join(" ").toLowerCase();
        return (
          title.includes(term) ||
          desc.includes(term) ||
          categories.includes(term)
        );
      });
      setFilteredQuizzes(filtered);
      setSearchLoading(false);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, quizzes]);

  const displayedQuizzes = useMemo(() => filteredQuizzes, [filteredQuizzes]);

  const fetchDeletedQuizzes = async () => {
    setLoading(true);
    try {
      const response =
        activeTab === "hosted"
          ? await listDeletedQuizzes()
          : await listDeletedPracticeQuizzes();

      if (response.success) {
        setQuizzes((response.data || []) as DeletedQuizCard[]);
      } else {
        if (response.message?.includes("Pro subscription required")) {
          showToast(
            "Pro subscription required to access deleted quizzes.",
            "error",
          );
          router.push("/dashboard/quizzes");
        } else {
          showToast(
            response.message || "Failed to fetch deleted quizzes",
            "error",
          );
        }
      }
    } catch (error) {
      console.error("Error fetching deleted quizzes:", error);
      showToast(
        "Failed to load deleted quizzes. Please try again later.",
        "error",
      );
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
    if (!confirmed) return;

    setProcessingQuizId(quizId);
    setProcessingAction("restore");
    try {
      const response =
        activeTab === "hosted"
          ? await restoreQuiz(quizId)
          : await restorePracticeQuiz(quizId);

      if (response.success) {
        setQuizzes((prev) => prev.filter((quiz) => quiz.quizId !== quizId));
        setFilteredQuizzes((prev) =>
          prev.filter((quiz) => quiz.quizId !== quizId),
        );
        showToast("Quiz restored successfully!", "success");
      } else if (response.message?.includes("Pro subscription required")) {
        showToast("Pro subscription required to restore quizzes.", "error");
        router.push("/dashboard/quizzes");
      } else {
        showToast(
          `Failed to restore quiz: ${response.message || "Unknown error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error restoring quiz:", error);
      showToast("Failed to restore quiz. Please try again.", "error");
    } finally {
      setProcessingQuizId(null);
      setProcessingAction(null);
    }
  };

  const handlePermanentDelete = async (
    quizId: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    const confirmed = await showDialog({
      title: "Permanently delete quiz",
      message: "Permanently delete this quiz? This action cannot be undone.",
      confirmLabel: "Delete permanently",
      variant: "danger",
    });
    if (!confirmed) return;

    setProcessingQuizId(quizId);
    setProcessingAction("permanent");
    try {
      const response =
        activeTab === "hosted"
          ? await permanentlyDeleteQuiz(quizId)
          : await permanentlyDeletePracticeQuiz(quizId);

      if (response.success) {
        setQuizzes((prev) => prev.filter((quiz) => quiz.quizId !== quizId));
        setFilteredQuizzes((prev) =>
          prev.filter((quiz) => quiz.quizId !== quizId),
        );
        showToast("Quiz permanently deleted", "success");
      } else if (response.message?.includes("Pro subscription required")) {
        showToast(
          "Pro subscription required to permanently delete quizzes.",
          "error",
        );
        router.push("/dashboard/quizzes");
      } else {
        showToast(
          `Failed to permanently delete quiz: ${response.message || "Unknown error"}`,
          "error",
        );
      }
    } catch (error) {
      console.error("Error permanently deleting quiz:", error);
      showToast(
        "Failed to permanently delete quiz. Please try again.",
        "error",
      );
    } finally {
      setProcessingQuizId(null);
      setProcessingAction(null);
    }
  };

  const getQuizTitle = (quiz: DeletedQuizCard) =>
    quiz.title || quiz.name || quiz.topic || "Untitled Quiz";
  const getQuestionsCount = (quiz: DeletedQuizCard) =>
    quiz.questions?.length ?? quiz.numberOfQuestions ?? 0;
  const getStatus = (quiz: DeletedQuizCard) =>
    quiz.status || (quiz.isGivenUp ? "Given Up" : "Practice");

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


  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="py-6 sm:py-10 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <button
                onClick={() =>
                  handleNavigate(
                    `/dashboard/quizzes?type=${activeTab === "hosted" ? "host" : "practice"}`,
                  )
                }
                onMouseEnter={() =>
                  router.prefetch(
                    `/dashboard/quizzes?type=${activeTab === "hosted" ? "host" : "practice"}`,
                  )
                }
                disabled={navigatingTo !== null}
                className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0 disabled:opacity-70"
              >
                {navigatingTo?.startsWith("/dashboard/quizzes?") ? (
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-gray-500 dark:border-gray-400 border-t-transparent rounded-full animate-spin" />
                ) : (
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
                )}
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
            <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/5 w-full sm:flex-[3] overflow-hidden relative z-0">
              {(["practice", "hosted"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSearchTerm("");
                      router.push(
                        `/dashboard/quizzes/deleted?type=${tab === "hosted" ? "host" : "practice"}`,
                      );
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
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                        style={{ zIndex: -1 }}
                      />
                    )}
                    {tab === "hosted" ? "Hosted Quizzes" : "Practice Quizzes"}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full sm:flex-[2] flex">
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
            </div>
          </div>

          {loading && <DeletedQuizCardsSkeleton />}

          {!loading &&
            displayedQuizzes.length === 0 &&
            quizzes.length === 0 && (
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
                    Quizzes you delete will appear here. You can restore them or
                    permanently delete them.
                  </p>
                  <button
                    onClick={() =>
                      handleNavigate(
                        `/dashboard/quizzes?type=${activeTab === "hosted" ? "host" : "practice"}`,
                      )
                    }
                    onMouseEnter={() =>
                      router.prefetch(
                        `/dashboard/quizzes?type=${activeTab === "hosted" ? "host" : "practice"}`,
                      )
                    }
                    disabled={navigatingTo !== null}
                    className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all rounded-lg disabled:opacity-70"
                  >
                    {navigatingTo?.startsWith("/dashboard/quizzes?") ? (
                      <div className="w-5 h-5 border-2 border-gray-500 dark:border-gray-300 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Back to Quizzes"
                    )}
                  </button>
                </div>
              </div>
            )}

          {!loading &&
            searchLoading &&
            displayedQuizzes.length === 0 &&
            quizzes.length > 0 && <DeletedQuizCardsSkeleton />}

          {!loading &&
            !searchLoading &&
            displayedQuizzes.length === 0 &&
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

          {!loading && displayedQuizzes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <AnimatePresence mode="popLayout">
                {displayedQuizzes.map((quiz) => (
                  <motion.div
                    key={quiz.quizId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex flex-col h-full bg-white dark:bg-[#15151a] shadow-sm p-5 sm:p-6 transition-all duration-200 border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md rounded-xl"
                    style={{ minHeight: "180px" }}
                  >
                    {/* Header: Title and Actions */}
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-xl sm:text-2xl font-light text-black dark:text-white line-clamp-2 leading-snug">
                        {getQuizTitle(quiz)}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0 mt-1">
                        <button
                          onClick={(e) => handleRestoreQuiz(quiz.quizId, e)}
                          disabled={processingQuizId === quiz.quizId}
                          className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors rounded-xl border border-transparent hover:border-green-100 dark:hover:border-green-900/50 relative z-20"
                          title="Restore quiz"
                          aria-label="Restore quiz"
                        >
                          {processingQuizId === quiz.quizId &&
                          processingAction === "restore" ? (
                            <div className="w-4 h-4 border-2 border-green-600 dark:border-green-400 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <RotateCcw className="w-4 h-4" />
                          )}
                        </button>

                        <button
                          onClick={(e) => handlePermanentDelete(quiz.quizId, e)}
                          disabled={processingQuizId === quiz.quizId}
                          className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/50 relative z-20"
                          title="Permanently delete quiz"
                          aria-label="Permanently delete quiz"
                        >
                          {processingQuizId === quiz.quizId &&
                          processingAction === "permanent" ? (
                            <div className="w-4 h-4 border-2 border-red-600 dark:border-red-400 border-t-transparent animate-spin rounded-full" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Categories */}
                    {quiz.categories && quiz.categories.length > 0 ? (
                      <div className="flex flex-row flex-wrap items-center gap-1.5 mt-3 mb-auto">
                        {quiz.categories.slice(0, 3).map((cat, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80"
                          >
                            <Folder className="w-3 h-3" />
                            {cat}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-row flex-wrap items-center gap-1.5 mt-3 mb-auto">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80">
                          <Folder className="w-3 h-3" />
                          {quiz.topic || "General"}
                        </div>
                      </div>
                    )}

                    {/* Bottom: Stats and Badges */}
                    <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-xs sm:text-sm">
                            {getQuestionsCount(quiz)} Qs
                          </span>
                        </div>
                        {quiz.timePerQuestion != null && quiz.timePerQuestion > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-xs sm:text-sm">
                              {quiz.timePerQuestion}s / Q
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                          {getStatus(quiz)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
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
