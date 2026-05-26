"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { getPracticeQuizById, submitPracticeAttempt, PracticeQuiz } from "@/services/practiceQuizService";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, X, ChevronRight, Check, AlertTriangle, Play } from "lucide-react";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

export default function TakePracticeQuizPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { showToast, showDialog } = useToast();
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId as string;

  const [quiz, setQuiz] = useState<PracticeQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // Tab switch & Fullscreen state
  const [hasStarted, setHasStarted] = useState(false);
  const [tabSwitchWarnings, setTabSwitchWarnings] = useState(0);

  // Stats after submission
  const [score, setScore] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);

  const fetchQuiz = useCallback(async () => {
    try {
      const response = await getPracticeQuizById(quizId);
      if (response.success && response.data) {
        if (response.data.isGivenUp) {
          showToast("You have already given up on this quiz.", "error");
          router.push(`/dashboard/quizzes/practice/${quizId}`);
          return;
        }
        setQuiz(response.data);
        setTimeLeft(response.data.timePerQuestion);
      } else {
        router.push("/dashboard/quizzes");
      }
    } catch {
      router.push("/dashboard/quizzes");
    } finally {
      setLoading(false);
    }
  }, [quizId, router, showToast]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchQuiz();
    }
  }, [isLoggedIn, authLoading, fetchQuiz, router]);

  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Exit fullscreen on unmount
  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!quiz || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await submitPracticeAttempt(quizId, userAnswers);
      if (response.success) {
        setIsFinished(true);
        exitFullscreen();
        setScore(response.data.score);
        setPointsEarned(response.data.pointsEarned);
        if (response.data.pointsEarned > 0) {
          showToast(`+${response.data.pointsEarned} Points!`, "success");
        }
      } else {
        showToast(response.message || "Failed to submit", "error");
      }
    } catch (error) {
      showToast((error as Error).message || "Error submitting", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, isSubmitting, quizId, userAnswers, showToast]);

  // Tab switch detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && hasStarted && !isFinished && !isSubmitting) {
        setTabSwitchWarnings(prev => {
          const newWarnings = prev + 1;
          if (newWarnings >= 3) {
            showToast("Quiz terminated due to multiple tab switches.", "error");
            handleSubmit();
          } else {
            showToast(`Warning: Do not switch tabs. Warning ${newWarnings} of 3.`, "error");
          }
          return newWarnings;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasStarted, isFinished, isSubmitting, handleSubmit, showToast]);

  const handleNext = useCallback(() => {
    if (!quiz || !quiz.questions) return;
    
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(quiz.timePerQuestion);
    } else {
      handleSubmit();
    }
  }, [quiz, currentQuestionIndex, handleSubmit]);

  // Timer logic
  useEffect(() => {
    if (loading || isSubmitting || isFinished || !quiz || !hasStarted) return;

    if (timeLeft <= 0) {
      handleNext();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, loading, isSubmitting, isFinished, quiz, hasStarted, handleNext]);

  const handleSelectOption = (questionId: string, optionKey: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleExit = async () => {
    if (!isFinished && Object.keys(userAnswers).length > 0) {
      exitFullscreen();
      const confirmed = await showDialog({
        title: "Exit Quiz?",
        message: "Your progress will be lost and this will NOT count as a trial. Are you sure you want to exit?",
        confirmLabel: "Exit",
        variant: "danger"
      });
      if (!confirmed) {
        if (hasStarted) enterFullscreen();
        return;
      }
    } else {
      exitFullscreen();
    }
    router.push(`/dashboard/quizzes/practice/${quizId}`);
  };

  const handleStartQuiz = () => {
    enterFullscreen();
    setHasStarted(true);
  };

  if (authLoading || loading) return <ZeroGravityLoading title="Loading Quiz" showNavigation={false} />;
  if (!quiz || !quiz.questions) return null;

  if (!hasStarted && !isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-gray-800 p-5 sm:p-10 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-w-md w-[90%] sm:w-full text-center"
        >
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
          </div>
          <h1 className="text-lg sm:text-2xl font-medium text-black dark:text-white mb-2">Ready to begin?</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-6 sm:mb-8 leading-relaxed px-2">
            This quiz will be conducted in full screen. Do not switch tabs or windows during the test. <strong className="text-black dark:text-white font-medium">3 warnings will result in automatic termination.</strong>
          </p>
          
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <button 
              onClick={handleStartQuiz}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors flex justify-center items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Start Quiz
            </button>
            <button 
              onClick={handleExit}
              className="w-full bg-transparent border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
          className="bg-white dark:bg-[#15151a] p-8 sm:p-10 rounded-3xl shadow-2xl max-w-md w-[92%] sm:w-full text-center border border-gray-100 dark:border-gray-800"
        >
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-green-400 dark:bg-green-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
            <div className="relative w-full h-full bg-green-50 dark:bg-green-500/10 rounded-full flex items-center justify-center border border-green-100 dark:border-green-500/20">
              <Check className="w-8 h-8 sm:w-10 sm:h-10 text-green-500 dark:text-green-400" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-semibold text-black dark:text-white mb-2 tracking-tight">Quiz Completed!</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Your attempt has been recorded and scored.</p>
          
          <div className="bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center divide-x divide-gray-200 dark:divide-gray-800 mb-8 overflow-hidden">
            <div className="flex-1 flex flex-col items-center p-4 sm:p-5 hover:bg-gray-100/50 dark:hover:bg-gray-800/60 transition-colors">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase mb-1.5">Score</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-4xl font-bold text-black dark:text-white">{score}</span>
                <span className="text-sm sm:text-lg font-medium text-gray-400">/ {quiz.questions.length}</span>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center p-4 sm:p-5 bg-gradient-to-b from-transparent to-emerald-50/30 dark:to-emerald-900/10 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-colors">
              <p className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-medium tracking-widest uppercase mb-1.5">Points</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl sm:text-4xl font-bold text-emerald-500 dark:text-emerald-400">+{pointsEarned}</span>
                <span className="text-xs font-medium text-emerald-600/50 dark:text-emerald-400/50 uppercase tracking-wider">xp</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => router.push(`/dashboard/quizzes/practice/${quizId}/insights`)}
              className="w-full bg-black dark:bg-white text-white dark:text-black py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all hover:-translate-y-0.5 shadow-lg shadow-black/10 dark:shadow-white/10"
            >
              View Full Insights
            </button>
            <button 
              onClick={() => router.push(`/dashboard/quizzes/practice/${quizId}`)}
              className="w-full bg-transparent border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 py-3 sm:py-3.5 rounded-xl text-sm sm:text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Back to Quiz Details
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const currentAnswer = userAnswers[currentQuestion.questionId];

  return (
    <div className="min-h-screen bg-transparent flex flex-col">
      {/* Top Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={handleExit} className="p-1.5 sm:p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500">
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <div className="hidden sm:block">
              <h1 className="font-medium text-black dark:text-white line-clamp-1">{quiz.name || quiz.topic}</h1>
              <p className="text-[10px] sm:text-xs text-gray-500">Question {currentQuestionIndex + 1} of {quiz.questions.length}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {tabSwitchWarnings > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] sm:text-xs font-medium">
                <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {tabSwitchWarnings}/3 Warnings
              </div>
            )}
            <div className={`flex items-center gap-1.5 sm:gap-2 font-mono text-lg sm:text-xl font-medium ${timeLeft <= 5 ? "text-red-500 animate-pulse" : "text-black dark:text-white"}`}>
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              {timeLeft}s
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1">
        <div className="bg-black dark:bg-white h-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.questionId}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col"
          >
            <div className="mb-8">
              <span className="text-[10px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-2 sm:mb-3 block">
                Question {currentQuestionIndex + 1}
              </span>
              <h2 className="text-xl sm:text-2xl font-medium text-black dark:text-white leading-snug">
                {currentQuestion.text}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto sm:mt-0">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleSelectOption(currentQuestion.questionId, option.key)}
                  className={`relative p-4 sm:p-5 rounded-xl border text-left transition-all duration-200 group ${
                    currentAnswer === option.key 
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-sm" 
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-md text-[10px] sm:text-xs font-semibold shrink-0 ${
                      currentAnswer === option.key
                      ? "bg-white/20 dark:bg-black/20 text-white dark:text-black"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-600"
                    }`}>
                      {option.key}
                    </span>
                    <span className="text-sm sm:text-base font-medium leading-tight pt-0.5">{option.text}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-3 sm:p-4">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <button 
            onClick={handleSkip}
            className="px-4 sm:px-6 py-2 sm:py-2.5 font-medium text-xs sm:text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
          >
            Skip
          </button>
          <button
            onClick={handleNext}
            disabled={!currentAnswer || isSubmitting}
            className="flex items-center gap-1.5 sm:gap-2 bg-black dark:bg-white text-white dark:text-black px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            {isSubmitting ? "Submitting..." : isLastQuestion ? "Finish Quiz" : "Next Question"}
            {!isSubmitting && !isLastQuestion && <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </footer>
    </div>
  );
}
