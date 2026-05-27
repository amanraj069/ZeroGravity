"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { generatePracticeQuiz, getPracticeQuizQuota, getPracticeAnalytics, QuotaData } from "@/services/practiceQuizService";
import { BackButton } from "@/components/BackButton";
import { Sparkles, AlertCircle, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
  { value: "god", label: "GOD" },
];

const QUESTIONS_OPTIONS = [
  { value: 5, label: "5Q" },
  { value: 10, label: "10Q" },
  { value: 15, label: "15Q" },
  { value: 20, label: "20Q" },
];

export default function GeneratePracticeQuizPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [quizName, setQuizName] = useState("");
  const [topic, setTopic] = useState("");
  const [categories, setCategories] = useState<string[]>(["General"]);
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  
  const [loading, setLoading] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchQuota();
      fetchExistingCategories();
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchQuota = async () => {
    try {
      const response = await getPracticeQuizQuota();
      if (response.success) {
        setQuota(response.quota);
      }
    } catch (error) {
      console.error("Error fetching quota:", error);
    } finally {
      setQuotaLoading(false);
    }
  };

  const fetchExistingCategories = async () => {
    try {
      const response = await getPracticeAnalytics();
      if (response.success && response.data?.categoryStats) {
        const cats = response.data.categoryStats.map((c: { category: string }) => c.category);
        setExistingCategories(cats);
      }
    } catch (error) {
      console.error("Error fetching existing categories:", error);
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setIsAddingCategory(false);
      return;
    }
    if (categories.includes(trimmed)) {
      showToast("Category already added", "error");
      return;
    }
    setCategories([...categories, trimmed]);
    setNewCategory("");
    setIsAddingCategory(false);
  };

  const handleRemoveCategory = (catToRemove: string) => {
    if (categories.length === 1) {
      showToast("A quiz must have at least one category.", "error");
      return;
    }
    setCategories(categories.filter((c) => c !== catToRemove));
  };

  const handleAddExistingCategory = (cat: string) => {
    if (!categories.includes(cat)) {
      setCategories([...categories, cat]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      showToast("Please enter a topic", "error");
      return;
    }
    if (categories.length === 0) {
      showToast("Please add at least one category", "error");
      return;
    }

    if (quota && quota.remaining <= 0) {
      showToast("Daily limit reached. Try again tomorrow.", "error");
      return;
    }

    setLoading(true);
    try {
      const effectiveTime = (difficulty === "hard" || difficulty === "god") ? 0 : timePerQuestion;
      const response = await generatePracticeQuiz(topic, categories, difficulty, effectiveTime, numberOfQuestions, quizName);
      if (response.success) {
        showToast("Practice quiz generated successfully!", "success");
        router.push(`/dashboard/quizzes/practice/${response.quizId}`);
      } else {
        showToast(response.message || "Failed to generate quiz", "error");
      }
    } catch (error) {
      showToast((error as Error).message || "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  // Categories that exist in user's history but aren't currently selected
  const suggestedCategories = existingCategories.filter(cat => !categories.includes(cat));

  if (authLoading || quotaLoading) {
    return <ZeroGravityLoading title="Loading" showNavigation={false} />;
  }

  const isDisabled = loading || (quota ? quota.remaining <= 0 : false);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-4 mb-4 sm:mb-8">
            <BackButton />
            <div>
              <h1 className="text-2xl sm:text-3xl font-light text-black dark:text-white">
                Generate AI Quiz
              </h1>
              <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400 mt-1">
                Enter a topic to generate a personalized practice quiz.
              </p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
          >
            {quota && quota.remaining <= 0 && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-sm">
                  You have reached your daily limit of {quota.limit} AI practice quizzes. Please check back tomorrow!
                </p>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-5 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-8">
                {/* Topic */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    What topic do you want to practice?
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. History of World War II, JavaScript Fundamentals, Machine Learning..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:bg-gray-800 dark:text-white transition-shadow"
                    disabled={isDisabled}
                    required
                  />
                </div>

                {/* Quiz Name and Time Per Question Row */}
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-5 sm:gap-8">
                  {/* Quiz Name (40%) */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Quiz Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CSS Basics..."
                      value={quizName}
                      onChange={(e) => setQuizName(e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:bg-gray-800 dark:text-white transition-shadow"
                      disabled={isDisabled}
                      maxLength={10}
                      required
                    />
                  </div>

                  {/* Time Per Question (60%) — hidden for Hard/GOD since AI controls timing */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                      Time Per Question <span className="text-gray-400 font-normal">({timePerQuestion}s)</span>
                    </label>
                    {(difficulty === "hard" || difficulty === "god") ? (
                      <div className="flex items-center h-[40px] sm:h-[50px]">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700/50 border border-dashed border-gray-300 dark:border-gray-600 text-xs sm:text-sm text-gray-500 dark:text-gray-400 w-full">
                          <span>Timings will be set automatically</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 sm:gap-4 h-[40px] sm:h-[50px]">
                        <div className="relative flex-1 h-2.5 sm:h-3 bg-gray-200 dark:bg-gray-700/50 rounded-full flex items-center shadow-inner">
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-black dark:bg-white rounded-full"
                            style={{ width: `${((timePerQuestion - 10) / 110) * 100}%` }}
                          />
                          <input
                            type="range"
                            min={10}
                            max={120}
                            step={5}
                            value={timePerQuestion}
                            onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            disabled={isDisabled}
                          />
                          <div 
                            className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-white border-[3px] border-black dark:border-white rounded-full shadow-md pointer-events-none transition-transform"
                            style={{ left: `calc(${((timePerQuestion - 10) / 110) * 100}% - 10px)` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs sm:text-sm font-bold bg-gray-100 dark:bg-gray-800 py-1.5 px-2 rounded-lg dark:text-white">
                          {timePerQuestion}s
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Categories <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <AnimatePresence>
                      {categories.map((cat) => (
                        <motion.div
                          key={cat}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          className="group relative flex items-center h-8 sm:h-10 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium"
                        >
                          {cat}
                          <button
                            type="button"
                            onClick={() => handleRemoveCategory(cat)}
                            className="ml-1.5 sm:ml-2 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {/* Inline Existing Category Suggestions */}
                    {suggestedCategories.length > 0 && suggestedCategories.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleAddExistingCategory(cat)}
                        disabled={isDisabled}
                        className="h-8 sm:h-10 flex items-center gap-1 sm:gap-1.5 border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-400 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        {cat}
                      </button>
                    ))}

                    {isAddingCategory ? (
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddCategory();
                            } else if (e.key === "Escape") {
                              setIsAddingCategory(false);
                              setNewCategory("");
                            }
                          }}
                          autoFocus
                          placeholder="New category..."
                          className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:bg-gray-800 dark:text-white"
                          disabled={loading}
                        />
                        <button
                          type="button"
                          onClick={handleAddCategory}
                          className="h-8 sm:h-10 text-xs sm:text-sm bg-black text-white dark:bg-white dark:text-black px-3 sm:px-4 rounded-full font-medium"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(true)}
                        disabled={loading}
                        className="h-8 sm:h-10 flex items-center gap-1 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 hover:text-black dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 px-3 sm:px-4 rounded-full text-xs sm:text-sm font-medium transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden sm:inline">Add Category</span>
                        <span className="sm:hidden">Add</span>
                      </button>
                    )}
                  </div>

                  <p className="hidden sm:block text-xs text-gray-500 mt-2">Group quizzes by category for easier performance tracking. A quiz must have at least one category.</p>
                </div>

                {/* Difficulty Capsule Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-3">
                    Difficulty
                  </label>
                  <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-white/5 relative z-0">
                    {DIFFICULTY_OPTIONS.map((opt) => {
                      const isActive = difficulty === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDifficulty(opt.value)}
                          disabled={isDisabled}
                          className={`flex-1 relative px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl whitespace-nowrap transition-colors z-10 ${
                            isActive
                              ? "text-black dark:text-white"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-difficulty-tab"
                              className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-lg sm:rounded-xl"
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              style={{ zIndex: -1 }}
                            />
                          )}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Number of Questions Capsule Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-3">
                    Number of Questions
                  </label>
                  <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-white/5 relative z-0">
                    {QUESTIONS_OPTIONS.map((opt) => {
                      const isActive = numberOfQuestions === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setNumberOfQuestions(opt.value)}
                          disabled={isDisabled}
                          className={`flex-1 relative px-2 py-1.5 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg sm:rounded-xl whitespace-nowrap transition-colors z-10 ${
                            isActive
                              ? "text-black dark:text-white"
                              : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="active-questions-tab"
                              className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-lg sm:rounded-xl"
                              transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              style={{ zIndex: -1 }}
                            />
                          )}
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800">
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                  {quota && (
                    <span className="flex flex-col sm:flex-row sm:items-center sm:gap-1">
                      <span>Daily Generations:</span>
                      <strong className="text-black dark:text-white text-sm sm:text-base">{quota.used}/{quota.limit}</strong>
                    </span>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading || !topic.trim() || !quizName.trim() || categories.length === 0 || (quota ? quota.remaining <= 0 : false)}
                  className="flex items-center gap-1.5 sm:gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white dark:border-black border-t-transparent animate-spin rounded-full"></div>
                      <span className="hidden sm:inline">Generating...</span>
                      <span className="sm:hidden">Generating</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Generate Quiz</span>
                      <span className="sm:hidden">Generate</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
