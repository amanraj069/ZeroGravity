"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getPracticeQuizById, giveUpPracticeQuiz, PracticeQuiz, PracticeAttempt } from "@/services/practiceQuizService";
import { BackButton } from "@/components/BackButton";
import { Brain, Clock, Play, BarChart2, AlertTriangle, Folder, Calendar } from "lucide-react";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { PracticeQuizDetailsSkeleton } from "@/components/quizzes/PracticeQuizDetailsSkeleton";

export default function PracticeQuizDetailsPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<PracticeQuiz | null>(null);
  const [attempts, setAttempts] = useState<PracticeAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  const fetchQuizDetails = useCallback(async () => {
    try {
      const response = await getPracticeQuizById(quizId);
      if (response.success) {
        setQuiz(response.data);
        setAttempts(response.attempts || []);
      } else {
        showToast(response.message || "Failed to load quiz details", "error");
        router.push("/dashboard/quizzes");
      }
    } catch (error) {
      showToast((error as Error).message || "Failed to load quiz details", "error");
      router.push("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  }, [quizId, router, showToast]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchQuizDetails();
    }
  }, [isLoggedIn, authLoading, router, fetchQuizDetails]);

  const handleTakeQuiz = () => {
    if (quiz?.isGivenUp) {
      showToast("You have already given up on this quiz.", "error");
      return;
    }
    if (attempts.length >= (quiz?.maxTrials || 3)) {
      showToast("You have reached the maximum number of trials.", "error");
      return;
    }
    handleNavigate(`/dashboard/quizzes/practice/${quizId}/take`);
  };


  const handleViewInsights = async () => {
    if (attempts.length === 0) {
      showToast("You need to attempt the quiz at least once to view insights.", "error");
      return;
    }

    // If out of trials and not yet given up, auto-give-up silently before navigating
    const trialsRemaining = quiz ? quiz.maxTrials - attempts.length : 0;
    if (!quiz?.isGivenUp && trialsRemaining <= 0) {
      setLoading(true);
      try {
        const response = await giveUpPracticeQuiz(quizId);
        if (!response.success) {
          showToast(response.message || "Failed to view insights", "error");
          return;
        }
      } catch (error) {
        showToast((error as Error).message || "Error", "error");
        return;
      } finally {
        setLoading(false);
      }
    }

    // Navigate — insights page will handle the lock if still has trials
    handleNavigate(`/dashboard/quizzes/practice/${quizId}/insights`);
  };


  if (authLoading || loading) return <PracticeQuizDetailsSkeleton />;
  if (!quiz) return null;

  const trialsRemaining = quiz.maxTrials - attempts.length;
  const isOutOfTrials = trialsRemaining <= 0;
  
  // If out of trials but not marked as given up, they technically should just view insights
  // Although max trials means they can't take it anymore, so they're forced to give up to see insights
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-1 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-3 sm:mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
            <div className="w-full">
              <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                <div className="mt-1 sm:mt-0">
                  <BackButton href="/dashboard/quizzes" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0">
                        Quiz Details
                      </h1>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 mb-2 sm:mb-3">
                        {quiz.name || quiz.topic}
                      </p>
                    </div>
                    
                    <div className="md:hidden flex flex-col items-end gap-1.5 mt-1">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md w-fit whitespace-nowrap border border-transparent ${
                        quiz.difficulty === "god" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40" :
                        quiz.difficulty === "hard" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                        quiz.difficulty === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}>
                        {quiz.difficulty}
                      </span>
                      
                      {quiz.categories && quiz.categories.length > 0 && (
                        <div className="flex items-center gap-1 mt-1 flex-wrap">
                          {quiz.categories.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded-md border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#15151a] whitespace-nowrap">
                              <Folder className="w-2 h-2 text-gray-400" />
                              {cat}
                            </span>
                          ))}
                          {quiz.categories.length > 2 && (
                            <span className="px-1.5 py-0.5 text-[9px] font-medium rounded-md border border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 bg-white dark:bg-[#15151a]">
                              +{quiz.categories.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Buttons: mobile = single row (Insights left, Take Quiz right), desktop = row */}
            <div className="flex flex-row sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full md:w-auto md:pt-2 sm:ml-[3.25rem] md:ml-0 mt-2 sm:mt-0">
              <div className="hidden md:flex items-center">
                <span className={`flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-lg border border-transparent ${
                  quiz.difficulty === "god" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40" :
                  quiz.difficulty === "hard" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  quiz.difficulty === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                  "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                }`}>
                  {quiz.difficulty}
                </span>
              </div>

              {/* View Insights — left on mobile */}
              {(attempts.length > 0 || quiz.isGivenUp) && (
                <button
                  onClick={handleViewInsights}
                  onMouseEnter={() => router.prefetch(`/dashboard/quizzes/practice/${quizId}/insights`)}
                  disabled={navigatingTo !== null}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 border border-black dark:border-white bg-transparent text-black dark:text-white px-4 sm:px-6 py-2.5 rounded-lg hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out font-medium text-sm whitespace-nowrap disabled:opacity-70"
                >
                  {navigatingTo === `/dashboard/quizzes/practice/${quizId}/insights` ? (
                    <div className="w-4 h-4 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <BarChart2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">View Insights</span><span className="sm:hidden">Insights</span>
                </button>
              )}

              {/* Take Quiz — right on mobile */}
              {!quiz.isGivenUp && !isOutOfTrials && (
                <button
                  onClick={handleTakeQuiz}
                  onMouseEnter={() => router.prefetch(`/dashboard/quizzes/practice/${quizId}/take`)}
                  disabled={navigatingTo !== null}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium text-sm whitespace-nowrap disabled:opacity-70"
                >
                  {navigatingTo === `/dashboard/quizzes/practice/${quizId}/take` ? (
                    <div className="w-4 h-4 border-2 border-white dark:border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Take Quiz
                </button>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[#15151a] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col mb-8 sm:mb-12">
            <div className="p-5 sm:p-8 grid grid-cols-2 sm:grid-cols-4 gap-y-6 gap-x-4 sm:gap-8 sm:divide-x divide-gray-100 dark:divide-gray-800">
              <div className="flex flex-col gap-1 sm:pr-8">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                  <Brain className="w-4 h-4 text-gray-400" />
                  <span className="text-xs sm:text-sm font-medium">Questions</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white">{quiz.numberOfQuestions}</p>
              </div>
              <div className="flex flex-col gap-1 sm:px-8">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-xs sm:text-sm font-medium">Time / Q</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white">{quiz.timePerQuestion}s</p>
              </div>
              <div className="flex flex-col gap-1 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 sm:px-8">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                  <AlertTriangle className="w-4 h-4 text-gray-400" />
                  <span className="text-xs sm:text-sm font-medium">Trials Left</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white">
                  {quiz.isGivenUp ? 0 : trialsRemaining} <span className="text-xs sm:text-sm text-gray-400 font-normal">/ {quiz.maxTrials}</span>
                </p>
              </div>
              <div className="flex flex-col gap-1 pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 sm:pl-8">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-xs sm:text-sm font-medium">Generated</span>
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-black dark:text-white truncate">
                  {new Date(quiz.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Bottom Details Footer Strip (Desktop Only) */}
            <div className="hidden md:flex px-5 sm:px-8 py-4 sm:py-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#121216]/50 rounded-b-lg flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6">
              {/* Categories */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider">Categories:</span>
                <div className="flex items-center gap-2">
                  {quiz.categories && quiz.categories.length > 0 ? (
                    quiz.categories.map((cat, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-lg border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 bg-white dark:bg-[#15151a]">
                        <Folder className="w-3 h-3 text-gray-400" />
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">None</span>
                  )}
                </div>
              </div>
            </div>
          </div>


          {attempts.length > 0 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white tracking-tight leading-none mb-6">
                Attempt <span className="font-normal italic">History</span>
              </h2>
              <div className="bg-white dark:bg-[#15151a] rounded-lg shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {attempts.map((attempt) => (
                    <div key={attempt.attemptId} className="p-4 sm:p-6 flex flex-row items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-[#1c1c21] transition-colors">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5 sm:mb-2">
                          <span className="text-[10px] sm:text-sm font-medium text-gray-500 dark:text-gray-400">Attempt #{attempt.trialNumber}</span>
                          <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">•</span>
                          <span className="text-[10px] sm:text-sm text-gray-500 dark:text-gray-400">{new Date(attempt.completedAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xl sm:text-3xl font-bold text-black dark:text-white leading-none">
                          {attempt.score} <span className="text-sm sm:text-xl font-medium text-gray-400 dark:text-gray-500 font-normal">/ {attempt.totalQuestions}</span>
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end sm:items-start text-right sm:text-left">
                        <p className="text-[9px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5 sm:mb-1">Accuracy</p>
                        <p className="text-lg sm:text-2xl font-bold text-black dark:text-white leading-none">
                          {Math.round((attempt.score / attempt.totalQuestions) * 100)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
