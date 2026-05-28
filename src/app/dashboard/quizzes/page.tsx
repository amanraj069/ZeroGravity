"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { listUserQuizzes, deleteQuiz } from "@/services/quizzesService";
import { Quiz } from "@/types/quiz";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import Image from "next/image";
import { Plus, Trash2, Search, BarChart2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import QuizzesSkeleton, {
  QuizCardsSkeleton,
} from "@/components/quizzes/QuizzesSkeleton";
import PracticeQuizzesTab from "./PracticeQuizzesTab";

function QuizzesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const [activeTab, setActiveTab] = useState<"hosted" | "practice">(
    typeParam === "host" ? "hosted" : "practice"
  );

  useEffect(() => {
    if (!typeParam) {
      router.replace("/dashboard/quizzes?type=practice");
    } else {
      setActiveTab(typeParam === "host" ? "hosted" : "practice");
    }
  }, [typeParam, router]);

  const { isLoggedIn, isLoading: authLoading, user } = useAuth();
  const { showToast, showDialog } = useToast();
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
    } else if (isLoggedIn) {
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

    const confirmed = await showDialog({
      title: "Delete Quiz",
      message: "Are you sure you want to delete this quiz?",
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
        showToast("Quiz deleted.", "success");
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


  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 py-4 sm:py-10 pb-16 sm:pb-24">
        <div className="max-w-6xl mx-auto px-3 sm:px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-3 sm:mb-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center justify-between">
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
                  <button
                    onClick={() => router.push("/joinQuiz")}
                    className="h-8 flex items-center justify-center border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 text-black dark:text-white px-3.5 hover:bg-black/10 dark:hover:bg-white/10 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out text-[13px] font-medium cursor-pointer rounded-xl box-border"
                  >
                    Join
                  </button>
                  {activeTab === "practice" && (
                    <div className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 animate-pulse transition duration-500 rounded-xl"></div>
                      <button
                        onClick={() => router.push("/dashboard/quizzes/practice/progress")}
                        className="relative h-8 flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black px-3.5 hover:bg-gray-900 dark:hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-[13px] font-medium rounded-xl box-border shadow-sm"
                      >
                        <BarChart2 className="w-3.5 h-3.5" />
                        Progress
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="hidden sm:flex flex-row gap-3 items-center justify-end shrink-0">
                <button
                  onClick={() => router.push("/joinQuiz")}
                  className="flex items-center justify-center border border-black dark:border-white bg-white dark:bg-[#1C1C22] text-black dark:text-white px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out text-sm font-medium cursor-pointer rounded-xl"
                >
                  Join Quiz
                </button>
                {activeTab === "practice" && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 animate-pulse transition duration-500 rounded-xl"></div>
                    <button
                      onClick={() => router.push("/dashboard/quizzes/practice/progress")}
                      className="relative flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-2.5 sm:py-3 hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors text-sm font-medium cursor-pointer rounded-xl"
                    >
                      <BarChart2 className="w-4 h-4" />
                      AI Progress
                    </button>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/dashboard/quizzes/deleted?type=${activeTab === "hosted" ? "host" : "practice"}`)}
                  className="flex items-center justify-center gap-2 bg-white dark:bg-[#1C1C22] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer rounded-xl"
                >
                  <Trash2 className="w-4 h-4" />
                  Trash
                </button>
              </div>
            </div>
          </motion.div>

          {/* Tabs and Search */}
          <div className="flex flex-col sm:flex-row sm:items-stretch justify-between gap-2 sm:gap-4 mb-3 sm:mb-6">
            {/* Tabs and Mobile Trash */}
            <div className="flex items-stretch gap-2 w-full sm:flex-[3]">
              <div className="flex flex-1 bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl p-1.5 rounded-xl border border-gray-200/50 dark:border-white/5 overflow-hidden relative z-0">
              {(["practice", "hosted"] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSearchTerm("");
                      router.push(`/dashboard/quizzes?type=${tab === "hosted" ? "host" : "practice"}`);
                    }}
                    className={`flex-1 relative px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-colors z-10 ${
                      isActive 
                        ? "text-black dark:text-white" 
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-quiz-type-tab"
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
              
              {/* Mobile Trash Button */}
              <button
                onClick={() => router.push(`/dashboard/quizzes/deleted?type=${activeTab === "hosted" ? "host" : "practice"}`)}
                className="sm:hidden px-4 shrink-0 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/5 hover:border-red-200 dark:hover:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all rounded-xl box-border"
                aria-label="View Deleted"
                title="View Deleted"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Global Search Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative w-full sm:flex-[2] flex items-center sm:items-stretch gap-2"
            >
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={`Search ${activeTab === "hosted" ? "hosted" : "practice"} quizzes...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#15151a] text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-4 py-3 sm:py-0 text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 rounded-xl sm:rounded-xl shadow-sm min-h-[48px] sm:min-h-0"
                />
                {searchLoading && activeTab === "hosted" && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-10">
                    <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-700 border-t-black dark:border-t-white animate-spin rounded-full"></div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {activeTab === "practice" ? (
            <PracticeQuizzesTab searchTerm={searchTerm} />
          ) : (
            <>

          {/* Loading State */}
          {loading && <QuizCardsSkeleton type="hosted" />}

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
                  transition: { duration: 0.2, ease: "easeOut" }
                }}
                className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-[#15151a]/40 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors duration-300 p-8 rounded-xl group/add"
                style={{ minHeight: "180px" }}
              >
                {/* Actual button content */}
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover/add:border-gray-400 transition-colors mb-3">
                  <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 group-hover/add:text-black dark:group-hover/add:text-white transition-colors" />
                </div>
                <span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 group-hover/add:text-black dark:group-hover/add:text-white transition-colors">
                  ADD QUIZ
                </span>
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
                      layout: { duration: 0.3, ease: "easeInOut" },
                      opacity: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: (index + 1) * 0.06 },
                      y: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: (index + 1) * 0.06 },
                      scale: { duration: 0.4, ease: [0.23, 1, 0.32, 1], delay: (index + 1) * 0.06 }
                    }}
                    onClick={() => handleQuizClick(quiz)}
                    whileHover={{
                      y: -4,
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      transition: { duration: 0.2, ease: "easeOut" }
                    }}
                    className="flex flex-col h-full bg-white dark:bg-[#15151a] shadow-sm p-5 sm:p-6 transition-all cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 group rounded-xl"
                    style={{ minHeight: "180px" }}
                  >
                    {/* Header with Title and Actions */}
                    <div className="flex items-start justify-between gap-4 mb-auto">
                      <h3 className="text-xl sm:text-2xl font-light text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-2 leading-snug">
                        {quiz.title}
                      </h3>
                      <div className="flex flex-col items-end gap-2 shrink-0 mt-1">
                        <button
                          onClick={(e) =>
                            handleDeleteQuiz(quiz.quizId, e, quiz.status)
                          }
                          disabled={
                            deletingQuizId === quiz.quizId ||
                            quiz.status === "active"
                          }
                          className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/50"
                          title={
                            quiz.status === "active"
                              ? "Cannot delete an active quiz"
                              : "Delete quiz"
                          }
                        >
                          {deletingQuizId === quiz.quizId ? (
                            <div className="w-4 h-4 border-2 border-red-500 dark:border-red-400 border-t-transparent animate-spin"></div>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex mb-4 mt-2 items-center justify-between gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
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
                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-black dark:text-white">
                            {quiz.questions.length}
                          </span>
                          <span className="text-xs sm:text-sm">
                            Qs
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center shrink-0">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl ${getStatusColor(
                            quiz.status,
                          )}`}
                        >
                          {getStatusText(quiz.status)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={<QuizzesSkeleton />}>
      <QuizzesContent />
    </Suspense>
  );
}
