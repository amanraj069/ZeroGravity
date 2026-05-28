"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  getPracticeQuizById,
  giveUpPracticeQuiz,
  PracticeQuiz,
  PracticeAttempt,
} from "@/services/practiceQuizService";
import { BackButton } from "@/components/BackButton";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Target as TargetIcon,
  TrendingUp,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { PracticeQuizInsightsSkeleton } from "@/components/quizzes/PracticeQuizInsightsSkeleton";

export default function PracticeQuizInsightsPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { showToast, showDialog } = useToast();
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<PracticeQuiz | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  const [selectedAttemptId, setSelectedAttemptId] = useState<string>("");
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  const fetchQuizDetails = useCallback(async () => {
    try {
      const response = await getPracticeQuizById(quizId);
      if (response.success && response.data) {
        setQuiz(response.data);
        setAttempts(response.attempts || []);
        if (response.attempts && response.attempts.length > 0) {
          setSelectedAttemptId(
            response.attempts[response.attempts.length - 1].attemptId,
          );
        }
      } else {
        router.push("/dashboard/quizzes");
      }
    } catch {
      router.push("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  }, [quizId, router]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchQuizDetails();
    }
  }, [isLoggedIn, authLoading, fetchQuizDetails, router]);

  const handleUnlockAnswers = async () => {
    const confirmed = await showDialog({
      title: "Give Up and Unlock Answers?",
      message:
        "You still have trials remaining. Unlocking answers will give up this quiz and you won't be able to attempt it again. Are you sure?",
      confirmLabel: "Give Up & Unlock",
      variant: "danger",
    });

    if (!confirmed) return;

    setIsUnlocking(true);
    try {
      const response = await giveUpPracticeQuiz(quizId);
      if (response.success) {
        setLoading(true);
        await fetchQuizDetails();
        showToast("Answers unlocked!", "success");
      } else {
        showToast(response.message || "Failed to unlock answers", "error");
      }
    } catch (error) {
      showToast((error as Error).message || "Error", "error");
    } finally {
      setIsUnlocking(false);
    }
  };

  if (authLoading || loading) return <PracticeQuizInsightsSkeleton />;
  if (!quiz) return null;

  // When not given up, API omits questions entirely
  const answersLocked = !quiz.isGivenUp;
  const totalQuestions = quiz.numberOfQuestions;
  const selectedAttempt = attempts.find(
    (a) => a.attemptId === selectedAttemptId,
  );

  const pieData = selectedAttempt
    ? [
        { name: "Correct", value: selectedAttempt.score, color: "#10b981" },
        {
          name: "Incorrect",
          value: selectedAttempt.totalQuestions - selectedAttempt.score,
          color: "#ef4444",
        },
      ]
    : [];

  const lineData = attempts.map((a) => ({
    name: `Trial ${a.trialNumber}`,
    score: a.score,
    accuracy: Math.round((a.score / a.totalQuestions) * 100),
  }));

  const estimatedAvgTime = selectedAttempt
    ? Math.max(
        5,
        Math.round(
          quiz.timePerQuestion *
            (0.3 +
              (selectedAttempt.score / selectedAttempt.totalQuestions) * 0.4),
        ),
      )
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-2 sm:mb-8 flex flex-wrap items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-[200px] order-1">
              <BackButton href={`/dashboard/quizzes/practice/${quizId}`} />
              <div>
                <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0.5 sm:mb-1">
                  Quiz Insights
                </h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                  {quiz.name || quiz.topic}
                </p>
              </div>
            </div>

            <div className="relative group shrink-0 order-2 sm:order-3 self-start sm:self-auto mt-0.5 sm:mt-0">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 animate-pulse transition duration-500"></div>
              <button
                onClick={() =>
                  handleNavigate(
                    `/dashboard/quizzes/practice/progress?category=${encodeURIComponent(quiz.categories?.[0] || "General")}`,
                  )
                }
                onMouseEnter={() =>
                  router.prefetch(
                    `/dashboard/quizzes/practice/progress?category=${encodeURIComponent(quiz.categories?.[0] || "General")}`,
                  )
                }
                disabled={navigatingTo !== null}
                className="relative flex items-center justify-center gap-1.5 bg-black text-white dark:bg-white dark:text-black px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors whitespace-nowrap disabled:opacity-70"
              >
                {navigatingTo !== null ? (
                  <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">Category AI insights</span>
                <span className="sm:hidden">AI Insights</span>
              </button>
            </div>

            {attempts.length > 1 && (
              <div className="order-3 sm:order-2 flex bg-gray-200/50 dark:bg-[#15151a] p-1.5 rounded-xl shadow-inner border border-gray-200/50 dark:border-gray-800/50 flex-1 sm:flex-none overflow-x-auto hide-scrollbar w-full sm:w-auto mt-1 sm:mt-0">
                {attempts.map((a) => {
                  const isActive = selectedAttemptId === a.attemptId;
                  return (
                    <button
                      key={a.attemptId}
                      onClick={() => setSelectedAttemptId(a.attemptId)}
                      className={`flex-1 sm:flex-none relative px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-colors z-10 ${
                        isActive
                          ? "text-black dark:text-white"
                          : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-attempt-tab"
                          className="absolute inset-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                          style={{ zIndex: -1 }}
                        />
                      )}
                      Trial #{a.trialNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* No attempts state */}
          {!selectedAttempt ? (
            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl text-center border border-gray-100 dark:border-gray-700">
              <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-black dark:text-white">
                No Attempts Found
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                You gave up without making any attempts.
              </p>
              {quiz.questions && (
                <div className="mt-8 space-y-4 text-left">
                  {quiz.questions.map((q, i) => (
                    <div
                      key={q.questionId}
                      className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700"
                    >
                      <p className="font-medium text-black dark:text-white mb-2">
                        {i + 1}. {q.text}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                        Correct Answer:{" "}
                        {q.options.find((o) => o.key === q.correctKey)?.text}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 bg-white dark:bg-gray-800 p-3 rounded-lg">
                        {q.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-8">
              {/* Analytics Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-6">
                <div className="md:col-span-2 grid grid-cols-[40%_60%] md:grid-cols-2 gap-0 md:gap-6 bg-white dark:bg-[#15151a] md:bg-transparent md:dark:bg-transparent rounded-xl border border-gray-100 dark:border-gray-800 md:border-none shadow-sm md:shadow-none p-4 sm:p-5 md:p-0">
                  {/* Main Stats Card */}
                  <div className="flex flex-col justify-center pr-3 sm:pr-4 border-r border-gray-100 dark:border-gray-800 md:border-none md:bg-white md:dark:bg-[#15151a] md:rounded-xl md:p-6 md:px-6 md:border md:dark:border-gray-800 md:shadow-sm md:h-full md:justify-between">
                    <div className="hidden md:block">
                      <h2 className="text-xl font-medium text-black dark:text-white mb-1">
                        Attempt Summary
                      </h2>
                      <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mb-0 sm:mb-8">
                        {new Date(
                          selectedAttempt.completedAt,
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-4 mt-0 md:mt-8 h-full md:h-auto justify-center">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase mb-1 md:mb-0 flex items-center gap-1.5">
                          <TargetIcon className="w-3.5 h-3.5" /> Accuracy
                        </p>
                        <div className="flex items-baseline gap-1 mt-auto md:mt-0">
                          <span className="text-xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white leading-none">
                            {selectedAttempt.score}
                          </span>
                          <span className="text-xs sm:text-lg font-medium text-gray-400 dark:text-gray-500">
                            / {selectedAttempt.totalQuestions}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col pt-4 border-t border-gray-100 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
                        <p className="text-[9px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase mb-1 md:mb-0 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" /> Avg Time / Q
                        </p>
                        <div className="flex items-baseline gap-1 mt-auto md:mt-0">
                          <span className="text-xl sm:text-3xl md:text-4xl font-bold text-black dark:text-white leading-none">
                            {estimatedAvgTime}
                          </span>
                          <span className="text-xs sm:text-lg font-medium text-gray-400 dark:text-gray-500 ml-1">
                            secs
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accuracy Chart */}
                  <div className="flex flex-col items-center justify-center pl-2 sm:pl-4 md:bg-white md:dark:bg-[#15151a] md:rounded-xl md:p-6 md:px-6 md:border md:dark:border-gray-800 md:shadow-sm md:min-h-[280px]">
                    <h3 className="hidden md:block text-base font-medium text-black dark:text-white w-full text-left mb-4">
                      Accuracy Ratio
                    </h3>
                    <div className="w-full min-h-[140px] md:h-full md:min-h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius="55%"
                            outerRadius="85%"
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              background: "#1c1c21",
                              color: "#fff",
                              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                            }}
                            itemStyle={{ color: "#fff" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex gap-2 sm:gap-4 justify-between md:justify-center w-full md:w-auto text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 mt-2 px-1 md:px-0">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-500"></div>
                        Correct
                      </div>
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <div className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500"></div>
                        Incorrect
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progression Chart */}
                <div className="bg-white dark:bg-[#15151a] rounded-xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center min-h-[240px] sm:min-h-[280px]">
                  <h3 className="text-base font-medium text-black dark:text-white w-full text-left mb-4">
                    Attempt Progression
                  </h3>
                  <div className="w-full h-full min-h-[160px] sm:min-h-[180px]">
                    {attempts.length > 1 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={lineData}
                          margin={{ top: 5, right: 5, bottom: 5, left: -20 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            vertical={false}
                            opacity={0.3}
                          />
                          <XAxis
                            dataKey="name"
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            padding={{ left: 30, right: 30 }}
                          />
                          <YAxis
                            stroke="#6b7280"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, totalQuestions]}
                            allowDecimals={false}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              borderRadius: "12px",
                              border: "none",
                              background: "#1c1c21",
                              color: "#fff",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#6366f1"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: "#15151a" }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs sm:text-sm flex-col gap-2">
                        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 opacity-20" />
                        <span className="text-center">
                          Take another trial to see progression
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown — only rendered when answers are unlocked (questions present) */}
              {!answersLocked && quiz.questions && (
                <div className="space-y-3 sm:space-y-8 pt-4 pb-4 sm:pb-16">
                  <h3 className="text-xl font-medium text-black dark:text-white mb-4 px-2">
                    Detailed Breakdown
                  </h3>
                  {quiz.questions.map((question, index) => {
                    const userAnswerKey =
                      selectedAttempt.userAnswers[question.questionId] || "";
                    // GOD mode: correctKey is a comma-joined sorted string e.g. "A,C"
                    const isGodQuestion =
                      quiz.difficulty === "god" &&
                      question.correctKey?.includes(",");
                    const correctKeys = new Set(
                      question.correctKey
                        ? question.correctKey
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                        : [],
                    );
                    const userKeys = new Set(
                      userAnswerKey
                        ? userAnswerKey
                            .split(",")
                            .map((k) => k.trim())
                            .filter(Boolean)
                        : [],
                    );
                    // Correct only if sets are identical (all-or-nothing for GOD, exact match for others)
                    const isCorrect = question.correctKey
                      ? [...correctKeys].sort().join(",") ===
                          [...userKeys].sort().join(",") && userKeys.size > 0
                      : false;
                    const isUnanswered = userKeys.size === 0;
                    const isExpanded = expandedQuestion === question.questionId;

                    return (
                      <div
                        key={question.questionId}
                        className={`bg-white dark:bg-[#15151a] rounded-xl border transition-colors overflow-hidden ${
                          isCorrect
                            ? "border-green-100 dark:border-green-900/30"
                            : isUnanswered
                              ? "border-gray-100 dark:border-gray-800"
                              : "border-red-100 dark:border-red-900/30"
                        }`}
                      >
                        <button
                          onClick={() =>
                            setExpandedQuestion(
                              isExpanded ? null : question.questionId,
                            )
                          }
                          className="w-full p-4 sm:p-6 flex items-start sm:items-center justify-between gap-4 text-left"
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-1 sm:mt-0 shrink-0">
                              {isCorrect ? (
                                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                              ) : isUnanswered ? (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-gray-300 dark:border-gray-600" />
                              ) : (
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                                  Question {index + 1}
                                </span>
                                {isGodQuestion && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 mb-1">
                                    {" "}
                                    Multi-answer
                                  </span>
                                )}
                              </div>
                              <p className="text-sm sm:text-base font-medium text-black dark:text-white leading-normal sm:leading-snug">
                                {question.text}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
                            ) : (
                              <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                            )}
                          </div>
                        </button>

                        <div
                          className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                        >
                          <div className="overflow-hidden">
                            <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-[#15151a]/50 px-3 sm:px-6 py-3 sm:py-6">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                                {question.options.map((opt) => {
                                  const isSelected = userKeys.has(opt.key);
                                  const isActualCorrect = correctKeys.has(
                                    opt.key,
                                  );
                                  let optionClass =
                                    "border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1c1c21] text-gray-600 dark:text-gray-400";
                                  if (isActualCorrect) {
                                    optionClass =
                                      "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
                                  } else if (isSelected && !isActualCorrect) {
                                    optionClass =
                                      "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
                                  }
                                  return (
                                    <div
                                      key={opt.key}
                                      className={`p-3 sm:p-4 rounded-xl border flex items-start gap-2 sm:gap-4 ${optionClass}`}
                                    >
                                      <span
                                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                                          isActualCorrect
                                            ? "bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                                            : isSelected
                                              ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200"
                                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                                        }`}
                                      >
                                        {opt.key}
                                      </span>
                                      <span className="text-xs sm:text-sm md:text-base font-medium pt-0.5">
                                        {opt.text}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl p-3 sm:p-5">
                                <h4 className="text-xs sm:text-sm font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-2">
                                  Explanation
                                </h4>
                                <p className="text-blue-900 dark:text-blue-100/80 text-sm leading-relaxed">
                                  {question.explanation}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Unlock Answers CTA — shown only when answers are still locked */}
              {answersLocked && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="pb-3 sm:pb-8"
                >
                  <div className="bg-white dark:bg-[#15151a] rounded-xl border border-amber-200 dark:border-amber-800/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5">
                          Answers are locked
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                          You still have trials remaining. Give up to reveal the
                          correct answers and full explanations.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleUnlockAnswers}
                      disabled={isUnlocking}
                      className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto justify-center"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      {isUnlocking ? "Unlocking..." : "Unlock Answers"}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
