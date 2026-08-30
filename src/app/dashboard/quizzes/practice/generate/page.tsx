"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { generatePracticeQuiz, getPracticeQuizQuota, getPracticeAnalytics, QuotaData } from "@/services/practiceQuizService";
import { BackButton } from "@/components/BackButton";
import { Sparkles, AlertCircle, Plus, X, Zap, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PracticeGenerateSkeleton } from "@/components/quizzes/PracticeGenerateSkeleton";

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
];

export default function GeneratePracticeQuizPage() {
  return (
    <Suspense fallback={<PracticeGenerateSkeleton />}>
      <GeneratePracticeQuizContent />
    </Suspense>
  );
}

function GeneratePracticeQuizContent() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const searchParams = useSearchParams();
  const [quizName, setQuizName] = useState(searchParams.get("quizName") || "");
  const [topic, setTopic] = useState(searchParams.get("topic") || "");
  const topicRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const resizeTextarea = () => {
      if (topicRef.current) {
        topicRef.current.style.height = "auto";
        topicRef.current.style.height = `${topicRef.current.scrollHeight + 2}px`;
      }
    };
    
    resizeTextarea();
    // Ensure layout is fully computed after render and framer-motion animations
    const t1 = setTimeout(resizeTextarea, 100);
    const t2 = setTimeout(resizeTextarea, 300);
    const t3 = setTimeout(resizeTextarea, 500);
    
    window.addEventListener("resize", resizeTextarea);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("resize", resizeTextarea);
    };
  }, [topic]);
  const urlCategories = searchParams.getAll("category");
  const [categories, setCategories] = useState<string[]>(
    urlCategories.length > 0 ? Array.from(new Set(urlCategories)) : ["General"]
  );
  const [newCategory, setNewCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [difficulty, setDifficulty] = useState("medium");
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const urlNumQuestions = searchParams.get("numQuestions");
  const [numberOfQuestions, setNumberOfQuestions] = useState(
    urlNumQuestions ? parseInt(urlNumQuestions, 10) : 5
  );
  
  const [loading, setLoading] = useState(false);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [existingCategories, setExistingCategories] = useState<string[]>([]);
  const [useAgent, setUseAgent] = useState(false);
  const [showAgentInfo, setShowAgentInfo] = useState(false);

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

    // Agent mode costs 2 credits
    const creditCost = useAgent ? 2 : 1;
    if (quota && quota.remaining < creditCost) {
      showToast(
        useAgent
          ? "Not enough credits for Agent mode (requires 2). Switch to normal mode or try again tomorrow."
          : "Daily limit reached. Try again tomorrow.",
        "error",
      );
      return;
    }

    setLoading(true);
    try {
      const effectiveTime = (difficulty === "hard" || difficulty === "god") ? 0 : timePerQuestion;
      const response = await generatePracticeQuiz(topic, categories, difficulty, effectiveTime, numberOfQuestions, quizName, useAgent);
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
    return <PracticeGenerateSkeleton />;
  }

  const isDisabled = loading || (quota ? quota.remaining <= 0 : false);

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex items-center gap-4">
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

            {/* Agent Mode Toggle — inline in title bar */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className={`text-xs sm:text-sm font-medium transition-colors duration-300 ${
                  useAgent ? "text-red-500 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                }`}>
                  Agent Mode
                </span>
                <button
                  type="button"
                  onClick={() => setShowAgentInfo(true)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  aria-label="What is Agent Mode?"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setUseAgent(!useAgent)}
                disabled={isDisabled}
                className="relative inline-flex items-center group cursor-pointer focus:outline-none"
                aria-label="Toggle Agent Mode"
              >
                {useAgent && (
                  <div className="absolute -inset-1.5 rounded-full bg-red-500/25 dark:bg-red-500/30 blur-sm animate-pulse pointer-events-none" />
                )}
                <div className={`relative w-11 h-6 rounded-full p-[3px] transition-all duration-300 ease-in-out ${
                  useAgent
                    ? "bg-gradient-to-r from-red-600 via-red-500 to-rose-500 shadow-[0_0_16px_rgba(239,68,68,0.5)]"
                    : "bg-gray-300 dark:bg-gray-600"
                }`}>
                  <div className={`w-[18px] h-[18px] rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${
                    useAgent
                      ? "translate-x-5 shadow-[0_0_8px_rgba(239,68,68,0.4)]"
                      : "translate-x-0"
                  }`} />
                </div>
              </button>
            </div>
          </div>

          {/* Agent Info Modal */}
          <AnimatePresence>
            {showAgentInfo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
                onClick={() => setShowAgentInfo(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-500/10 dark:bg-red-500/20">
                        <Zap className="w-4 h-4 text-red-500 dark:text-red-400 fill-red-500 dark:fill-red-400" />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white">Agent Mode</h3>
                    </div>
                    <button
                      onClick={() => setShowAgentInfo(false)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="px-5 sm:px-6 pb-5 sm:pb-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      Agent Mode uses a <strong>self-correcting AI pipeline</strong> powered by LangGraph to generate higher-quality quiz questions.
                    </p>

                    <div className="space-y-3">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">How it works</h4>
                      <div className="space-y-2">
                        {[
                          { step: "1", title: "Plans", desc: "Breaks your topic into diverse sub-concepts" },
                          { step: "2", title: "Generates", desc: "Drafts questions covering each concept" },
                          { step: "3", title: "Validates", desc: "Independently fact-checks every answer" },
                          { step: "4", title: "Self-Corrects", desc: "Rewrites any flawed questions automatically" },
                        ].map((item) => (
                          <div key={item.step} className="flex items-start gap-3">
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-500 dark:text-red-400 text-[10px] font-bold shrink-0 mt-0.5">
                              {item.step}
                            </div>
                            <div>
                              <span className="text-sm font-medium text-black dark:text-white">{item.title}</span>
                              <span className="text-sm text-gray-500 dark:text-gray-400"> — {item.desc}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Differences from standard</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5">
                          <p className="text-gray-500 dark:text-gray-400 mb-0.5">Standard Mode</p>
                          <p className="font-semibold text-black dark:text-white">1 credit · ~3s</p>
                          <p className="text-gray-500 dark:text-gray-400 mt-1">Single AI call</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-2.5 border border-red-100 dark:border-red-900/30">
                          <p className="text-red-500/80 dark:text-red-400/80 mb-0.5">Agent Mode</p>
                          <p className="font-semibold text-red-600 dark:text-red-400">2 credits · ~8s</p>
                          <p className="text-red-500/70 dark:text-red-400/70 mt-1">Multi-step verified</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  <textarea
                    ref={topicRef}
                    placeholder="e.g. History of World War II, JavaScript Fundamentals, Machine Learning..."
                    value={topic}
                    onChange={(e) => {
                      setTopic(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight + 2}px`;
                    }}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:bg-gray-800 dark:text-white transition-shadow resize-none overflow-hidden min-h-[46px] sm:min-h-[50px]"
                    rows={1}
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
                      placeholder="e.g. DSA-Q1..."
                      value={quizName}
                      onChange={(e) => setQuizName(e.target.value)}
                      className="w-full px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:bg-gray-800 dark:text-white transition-shadow"
                      disabled={isDisabled}
                      maxLength={30}
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
                          className="h-8 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:bg-gray-800 dark:text-white"
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
                    <span className="flex items-center gap-1.5 flex-wrap">
                      <span>Daily Generations:</span>
                      <strong className="text-black dark:text-white text-sm sm:text-base">{quota.used}/{quota.limit}</strong>
                      {useAgent && (
                        <span className="text-red-500 dark:text-red-400 text-sm sm:text-base font-semibold ml-0.5">
                          (2 Credits / quiz)
                        </span>
                      )}
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
                      <span className="hidden sm:inline">{useAgent ? "Agent Generating..." : "Generating..."}</span>
                      <span className="sm:hidden">{useAgent ? "Agent..." : "Generating"}</span>
                    </>
                  ) : (
                    <>
                      {useAgent ? (
                        <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white dark:fill-black" />
                      ) : (
                        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                      )}
                      <span className="hidden sm:inline">{useAgent ? "Generate with Agent" : "Generate Quiz"}</span>
                      <span className="sm:hidden">{useAgent ? "Agent" : "Generate"}</span>
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
