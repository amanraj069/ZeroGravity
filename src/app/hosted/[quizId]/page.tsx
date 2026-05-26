"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getQuiz,
  listParticipants,
  pushQuestion,
  endQuestion,
} from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { useAuth } from "@/contexts/AuthContext";
import { Quiz, QuizParticipant } from "@/types/quiz";

export default function HostedQuizPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [isActive, setIsActive] = useState<boolean>(false);
  const [quizStatus, setQuizStatus] = useState<string>("");
  const [currentQuestionTimeLeft, setCurrentQuestionTimeLeft] =
    useState<number>(0);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState<Date | null>(null);
  const [currentQuestionTimeLimit, setCurrentQuestionTimeLimit] =
    useState<number>(0);
  const [isQuestionActive, setIsQuestionActive] = useState<boolean>(false);
  const [showCorrectAnswer, setShowCorrectAnswer] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);

  useEffect(() => {
    if (!quizId) return;
    (async () => {
      const q = await getQuiz(quizId);
      if (q?.success) {
        setQuiz(q.quiz);
        setQuizStatus(q.quiz?.status || "");
        setIsActive(q.quiz?.status === "active");

        // If there's an active question, set it up
        if (q.quiz?.currentQuestionIndex >= 0) {
          setCurrentIndex(q.quiz.currentQuestionIndex);

          // Check if question is still active based on timing
          if (
            q.quiz.currentQuestionStartTime &&
            q.quiz.currentQuestionTimeLimit
          ) {
            const startTime = new Date(q.quiz.currentQuestionStartTime);
            const timeLimit = q.quiz.currentQuestionTimeLimit;
            const elapsed = Math.floor(
              (new Date().getTime() - startTime.getTime()) / 1000,
            );
            const remaining = Math.max(0, timeLimit - elapsed);

            setCurrentQuestionStartTime(startTime);
            setCurrentQuestionTimeLimit(timeLimit);
            setCurrentQuestionTimeLeft(remaining);
            setIsQuestionActive(remaining > 0);
          }
        }
      }
      const p = await listParticipants(quizId);
      if (p?.success) setParticipants(p.participants);
    })();
  }, [quizId]);

  useEffect(() => {
    if (!quizId) return;
    joinQuizRoom(quizId);
    const s = getSocket();

    const onQuestion = (payload: {
      quizId: string;
      index: number;
      startTime?: string;
      timeLimit?: number;
    }) => {
      if (payload?.quizId !== quizId) return;
      setCurrentIndex(payload.index);
      setVoteCounts({});
      setIsQuestionActive(true);
      setShowCorrectAnswer(false);

      if (payload.startTime && payload.timeLimit) {
        setCurrentQuestionStartTime(new Date(payload.startTime));
        setCurrentQuestionTimeLimit(payload.timeLimit);
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(payload.startTime).getTime()) / 1000,
        );
        const remaining = Math.max(0, payload.timeLimit - elapsed);
        setCurrentQuestionTimeLeft(remaining);
      }
    };

    const onVotes = (payload: {
      quizId: string;
      counts: Record<string, number>;
    }) => {
      if (payload?.quizId !== quizId) return;
      setVoteCounts(payload.counts || {});
    };

    const onQuestionTimeUp = async () => {
      setCurrentQuestionTimeLeft(0);
      setIsQuestionActive(false);

      // Fetch final vote counts and participants when question ends
      try {
        const p = await listParticipants(quizId);
        if (p?.success) setParticipants(p.participants);
      } catch (error) {
        console.error("Failed to fetch final results:", error);
      }
    };

    const onEnded = () => {
      setCurrentIndex(-1);
      setIsActive(false);
      setQuizStatus("published");
      router.push(`/dashboard/quizzes/host/${quizId}`);
    };

    s.on("question:pushed", onQuestion);
    s.on("votes:update", onVotes);
    s.on("question:timeup", onQuestionTimeUp);
    s.on("quiz:ended", onEnded);

    return () => {
      s.off("question:pushed", onQuestion);
      s.off("votes:update", onVotes);
      s.off("question:timeup", onQuestionTimeUp);
      s.off("quiz:ended", onEnded);
    };
  }, [quizId, router]);

  // Timer for host display
  useEffect(() => {
    if (
      currentQuestionStartTime &&
      currentQuestionTimeLimit > 0 &&
      isQuestionActive
    ) {
      const timer = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - currentQuestionStartTime.getTime()) / 1000,
        );
        const remaining = Math.max(0, currentQuestionTimeLimit - elapsed);
        setCurrentQuestionTimeLeft(remaining);

        if (remaining === 0) {
          setIsQuestionActive(false);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestionStartTime, currentQuestionTimeLimit, isQuestionActive]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Authenticating"
        subtitle="Verifying your cosmic credentials..."
      />
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  const currentQuestion = currentIndex >= 0 ? questions[currentIndex] : null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(1, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleStopQuestion = async () => {
    const r = await endQuestion(quizId);
    if (!r?.success) {
      alert("Failed to end question");
    } else {
      setCurrentQuestionTimeLeft(0);
      setIsQuestionActive(false);

      // We keep the current index so the host can show the correct answer
      // and see the histogram. The host will have to manually click "End Quiz".

      const p = await listParticipants(quizId);
      if (p?.success) setParticipants(p.participants);
    }
  };

  const handlePushNext = async () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= questions.length) return;

    const r = await pushQuestion(quizId, nextIndex);
    if (!r?.success) {
      alert("Failed to push question");
    }
  };

  // Function handleEndQuiz removed because finishing presentation serves similar logic on hosted presenter screen.

  const handleViewLeaderboard = () => {
    router.push(`/leaderboard/${quizId}`);
  };

  const handleBackToPortal = () => {
    router.push(`/dashboard/quizzes/host/${quizId}`);
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-4">
              Quiz not found
            </h1>
            <button
              onClick={handleBackToPortal}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light"
            >
              Back to Quiz Portal
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-4 sm:py-10 w-full">
        <div className="w-full max-w-6xl space-y-3 sm:space-y-6 flex flex-col flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 lg:gap-6 flex-shrink-0 mb-2 sm:mb-0">
            <div className="flex-1 sm:flex-none w-full sm:w-auto">
              <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto mb-1 sm:mb-0 border-b sm:border-b-0 border-gray-100 dark:border-gray-800 pb-2 sm:pb-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={handleBackToPortal}
                    className="inline-flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm transition-colors flex-shrink-0"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-light text-black dark:text-white tracking-tight truncate pr-0 sm:pr-2">
                    {quiz.title}
                  </h1>
                </div>

                {/* Statistics - Stacked on Mobile, Inline on Desktop */}
                <div className="flex flex-col sm:flex-row items-end sm:items-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter shrink-0 pt-0.5 sm:pt-0 sm:border-l sm:border-gray-200 dark:sm:border-gray-700 sm:pl-4 gap-1 sm:gap-5">
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="text-gray-900 dark:text-white text-xs sm:text-sm">
                      {participants.length}
                    </span>
                    <span className="opacity-60 text-[8px] sm:text-[9px]">
                      participants
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 leading-none px-0 sm:px-0 sm:border-l sm:border-gray-100 dark:sm:border-gray-800 sm:pl-5">
                    <span className="text-gray-900 dark:text-white text-xs sm:text-sm">
                      Q{currentIndex + 1}
                    </span>
                    <span className="opacity-60 text-[8px] sm:text-[9px]">
                      of {questions.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex flex-row items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0">
              <button
                onClick={() => setIsPresentationMode(!isPresentationMode)}
                className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest rounded-lg border transition-all duration-300 select-none flex-1 sm:flex-none ${
                  isPresentationMode
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/30 shadow-sm"
                    : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                }`}
              >
                {/* Inline Toggle Track */}
                <div
                  className={`relative w-6 h-3.5 sm:w-7 sm:h-4 rounded-full transition-colors border flex-shrink-0 duration-300 ${
                    isPresentationMode
                      ? "bg-emerald-500 border-emerald-600 dark:border-emerald-500"
                      : "bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {/* Inline Toggle Thumb */}
                  <div
                    className={`absolute top-[1px] left-[1px] w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white transition-transform duration-300 rounded-full shadow-sm ${
                      isPresentationMode
                        ? "translate-x-2.5 sm:translate-x-3"
                        : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="pt-0.5">Presentation</span>
              </button>
              <button
                onClick={handleBackToPortal}
                className="px-3 sm:px-5 py-2 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400 transition-colors whitespace-nowrap text-center rounded-lg flex-1 sm:flex-none"
              >
                Portal
              </button>
              <button
                onClick={handleViewLeaderboard}
                className="px-3 sm:px-5 py-2 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-500 dark:text-gray-400 transition-colors whitespace-nowrap text-center rounded-lg flex-1 sm:flex-none"
              >
                Leaderboard
              </button>
            </div>
          </div>

          {currentIndex === -1 && isActive && quizStatus !== "ended" ? (
            <div className="text-center py-8 sm:py-12 flex-1 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 min-h-[65dvh] sm:min-h-[75dvh] rounded-xl">
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center rounded-xl">
                <svg
                  className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-light text-gray-900 dark:text-white mb-2 sm:mb-3">
                Quiz Active - Ready to Start
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 sm:mb-8 max-w-md mx-auto px-4">
                {participants.length} participant
                {participants.length !== 1 ? "s" : ""} waiting.
              </p>
              <button
                onClick={handlePushNext}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
              >
                Push First Question
              </button>
            </div>
          ) : currentQuestion ? (
            /* Question Box */
            <div className="border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 overflow-hidden shadow-sm rounded-xl min-h-[65dvh] sm:min-h-[75dvh] flex-1 flex flex-col">
              {/* Question Header with Timer and Actions */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 min-w-0 pr-0 lg:pr-4">
                    <h2 className="text-[14px] sm:text-lg lg:text-2xl font-normal text-gray-900 dark:text-white leading-relaxed">
                      {currentQuestion.text}
                    </h2>
                  </div>
                  <div className="flex items-center justify-between gap-2 sm:gap-3 w-full lg:w-auto pt-1 lg:pt-0">
                    {/* Timer */}
                    <div
                      className={`h-8 sm:h-11 px-2.5 sm:px-5 font-mono text-[13px] sm:text-lg font-bold flex items-center justify-center flex-1 lg:flex-none lg:min-w-[100px] border rounded-lg ${
                        currentQuestionTimeLeft <= 10
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30 font-bold"
                          : currentQuestionTimeLeft <= 30
                            ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/30"
                            : "bg-gray-100 dark:bg-gray-800/80 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      {formatTime(currentQuestionTimeLeft)}
                    </div>
                    {/* Status Badge */}
                    <div
                      className={`h-8 sm:h-11 px-2.5 sm:px-4 text-[10px] sm:text-sm font-semibold flex items-center justify-center flex-1 lg:flex-none border rounded-lg ${
                        isQuestionActive
                          ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/30"
                          : "bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <span
                        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isQuestionActive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                      ></span>
                      <span className="uppercase tracking-widest">
                        {isQuestionActive ? "Live" : "Ended"}
                      </span>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 hidden lg:block mx-0.5"></div>

                    {/* Action Buttons Group - Ensures Next takes full width when Correct is hidden with refined sizing */}
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-[1.8] lg:flex-none lg:w-[220px]">
                      {/* Show Correct Answer Button - Only when question ended */}
                      {!isQuestionActive && !showCorrectAnswer && (
                        <button
                          onClick={() => setShowCorrectAnswer(true)}
                          className="h-8 sm:h-11 px-3 sm:px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center uppercase tracking-widest flex-1 rounded-lg"
                        >
                          Correct
                        </button>
                      )}

                      {/* Question Flow Actions */}
                      {isQuestionActive ? (
                        <button
                          onClick={handleStopQuestion}
                          className="h-8 sm:h-11 px-3 sm:px-6 bg-red-600 hover:bg-red-700 text-white text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center uppercase tracking-widest flex-1 rounded-lg"
                        >
                          Stop
                        </button>
                      ) : currentIndex + 1 < questions.length ? (
                        <button
                          onClick={handlePushNext}
                          className="h-8 sm:h-11 px-3 sm:px-6 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center uppercase tracking-widest flex-1 rounded-lg"
                        >
                          Next
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setCurrentIndex(-1);
                            setQuizStatus("ended");
                          }}
                          className="h-8 sm:h-11 px-3 sm:px-6 bg-black dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-200 text-white dark:text-black text-[10px] sm:text-xs font-bold transition-all shadow-sm flex items-center justify-center uppercase tracking-widest flex-1 rounded-lg"
                        >
                          Finish
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical Histogram Options */}
              <div className="p-3.5 sm:p-6 lg:p-10 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="flex items-end justify-center gap-1.5 sm:gap-6 md:gap-14 w-full flex-1 min-h-0">
                  {currentQuestion.options.map((option) => {
                    const total = Object.values(voteCounts).reduce(
                      (sum, c) => sum + (c as number),
                      0,
                    );
                    const count = voteCounts[option.key] || 0;
                    const percentage =
                      total > 0 ? Math.round((count / total) * 100) : 0;
                    const barHeight = total > 0 ? Math.max(8, percentage) : 4;
                    const isCorrect = option.isCorrect;
                    const shouldHighlight = showCorrectAnswer && isCorrect;

                    const displayCount = isPresentationMode ? "?" : count;
                    const displayPercentage = isPresentationMode
                      ? "?"
                      : `${percentage}%`;
                    const displayBarHeight = isPresentationMode
                      ? total > 0
                        ? 100
                        : 4
                      : barHeight;

                    return (
                      <div
                        key={option.key}
                        className="flex flex-col items-center flex-1 max-w-[140px] h-full"
                      >
                        {/* Vote count */}
                        <div
                          className={`text-lg sm:text-3xl font-bold mb-1 sm:mb-4 tracking-tighter shrink-0 ${
                            isPresentationMode
                              ? "text-gray-400 dark:text-gray-600 opacity-50"
                              : shouldHighlight
                                ? "text-emerald-600 dark:text-emerald-400 scale-110 transition-transform"
                                : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {displayCount}
                        </div>

                        {/* Bar Container */}
                        <div className="w-full h-[35dvh] sm:h-auto sm:flex-1 flex items-end justify-center bg-gray-100/50 dark:bg-gray-800/50 overflow-hidden mb-1 relative border border-gray-200 dark:border-gray-700 border-b-none rounded-t-lg">
                          <div
                            className={`w-full transition-all [transition-duration:800ms] [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] rounded-t-lg ${
                              isPresentationMode
                                ? "bg-gray-300 dark:bg-gray-600"
                                : shouldHighlight
                                  ? "bg-emerald-500 dark:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                  : "bg-blue-500 dark:bg-blue-500"
                            } ${isPresentationMode ? "opacity-30" : ""}`}
                            style={{ height: `${displayBarHeight}%` }}
                          />
                        </div>

                        {/* Option Label */}
                        <div
                          className={`mt-1.5 sm:mt-4 w-full text-center transition-colors duration-300 ${
                            shouldHighlight
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          <div
                            className={`w-7 h-7 sm:w-12 sm:h-12 mx-auto mb-1 sm:mb-3 flex items-center justify-center text-[10px] sm:text-lg font-bold shadow-sm transition-colors duration-300 rounded-lg ${
                              shouldHighlight
                                ? "bg-emerald-500 text-white border-2 border-emerald-500"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            {option.key}
                          </div>
                          <div className="text-[8.5px] sm:text-base font-medium px-0 sm:px-2 break-words leading-tight">
                            {option.text}
                          </div>
                          {total > 0 && (
                            <div
                              className={`text-[8px] sm:text-sm mt-0.5 sm:mt-2 font-bold ${
                                isPresentationMode
                                  ? "text-gray-400 dark:text-gray-600 opacity-50"
                                  : shouldHighlight
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {displayPercentage}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Response Stats */}
                <div className="mt-3.5 sm:mt-6 pt-2.5 sm:pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-6 sm:gap-12 text-[10px] sm:text-sm text-gray-500 dark:text-gray-400 font-medium tracking-widest uppercase shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                    <span className="text-gray-900 dark:text-white text-xs sm:text-base font-bold">
                      {Object.values(voteCounts).reduce(
                        (sum, c) => sum + (c as number),
                        0,
                      )}
                    </span>
                    <span className="opacity-70">responses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                    <span className="text-gray-900 dark:text-white text-xs sm:text-base font-bold">
                      {participants.length}
                    </span>
                    <span className="opacity-70">participants</span>
                  </div>
                </div>
              </div>
            </div>
          ) : quizStatus === "ended" ? (
            /* Quiz Ended */
            <div className="text-center py-8 sm:py-12 flex-1 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 min-h-[65dvh] sm:min-h-[75dvh] rounded-xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-20 sm:h-20 text-black dark:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-2xl font-light text-gray-900 dark:text-white mb-2 sm:mb-3">
                Quiz Completed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-6 sm:mb-8 max-w-md mx-auto px-4">
                All questions have been answered. View the final results and
                leaderboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 justify-center w-full max-w-[240px] sm:max-w-none mx-auto">
                <button
                  onClick={handleViewLeaderboard}
                  className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-black dark:bg-white text-white dark:text-black text-xs sm:text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
                >
                  View Leaderboard
                </button>
                <button
                  onClick={handleBackToPortal}
                  className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm font-semibold hover:border-gray-400 dark:hover:border-gray-500 transition-colors rounded-lg"
                >
                  Back to Portal
                </button>
              </div>
            </div>
          ) : !isActive ? (
            /* Quiz Not Started Yet */
            <div className="text-center py-8 sm:py-12 flex-1 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 min-h-[65dvh] sm:min-h-[75dvh] rounded-xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-20 sm:h-20 text-black dark:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-light text-gray-900 dark:text-white mb-2 sm:mb-3">
                Quiz Not Started
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 px-4">
                Go back to the portal to start the quiz and begin pushing
                questions.
              </p>
              <button
                onClick={handleBackToPortal}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
              >
                Back to Portal
              </button>
            </div>
          ) : (
            /* Quiz Active - Waiting for First Question */
            <div className="text-center py-8 sm:py-12 flex-1 flex flex-col items-center justify-center border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30 min-h-[65dvh] sm:min-h-[75dvh] rounded-xl">
              <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
                <svg
                  className="w-12 h-12 sm:w-20 sm:h-20 text-black dark:text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-lg sm:text-xl font-light text-gray-900 dark:text-white mb-2 sm:mb-3">
                Quiz Active - Ready to Start
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6 px-4">
                {participants.length} participant
                {participants.length !== 1 ? "s" : ""} waiting. Push the first
                question to begin.
              </p>
              <button
                onClick={handlePushNext}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Push First Question
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
