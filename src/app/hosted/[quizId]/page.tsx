"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getQuiz,
  listParticipants,
  pushQuestion,
  endQuestion,
  endQuiz,
} from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SimpleFooter from "@/components/landing/SimpleFooter";
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
  const [currentQuestionTimeLeft, setCurrentQuestionTimeLeft] =
    useState<number>(0);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState<Date | null>(null);
  const [currentQuestionTimeLimit, setCurrentQuestionTimeLimit] =
    useState<number>(0);
  const [isQuestionActive, setIsQuestionActive] = useState<boolean>(false);

  useEffect(() => {
    if (!quizId) return;
    (async () => {
      const q = await getQuiz(quizId);
      if (q?.success) {
        setQuiz(q.quiz);
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
              (new Date().getTime() - startTime.getTime()) / 1000
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

      if (payload.startTime && payload.timeLimit) {
        setCurrentQuestionStartTime(new Date(payload.startTime));
        setCurrentQuestionTimeLimit(payload.timeLimit);
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(payload.startTime).getTime()) / 1000
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
      // Don't redirect - stay on hosted page
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
          (new Date().getTime() - currentQuestionStartTime.getTime()) / 1000
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

      if (r.isLastQuestion) {
        setIsActive(false);
        setCurrentIndex(-1);
      }

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

  const handleEndQuiz = async () => {
    const ok = confirm("Are you sure you want to end the quiz?");
    if (!ok) return;

    const r = await endQuiz(quizId);
    if (!r?.success) {
      alert("Failed to end quiz");
    } else {
      setIsActive(false);
      setCurrentIndex(-1);
      // Stay on hosted page - don't redirect
    }
  };

  const handleViewLeaderboard = () => {
    router.push(`/leaderboard/${quizId}`);
  };

  const handleBackToPortal = () => {
    router.push(`/quizzes/host/${quizId}`);
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <LandingNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-light text-gray-900 mb-4">
              Quiz not found
            </h1>
            <button
              onClick={handleBackToPortal}
              className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-light"
            >
              Back to Quiz Portal
            </button>
          </div>
        </main>
        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-6xl space-y-6">
          {/* Header */}
          <div className="border-b border-gray-100 pb-6">
            <div className="flex items-start justify-between gap-6 mb-4">
              <div className="flex-1">
                <h1 className="text-4xl font-light text-black tracking-tight">
                  {quiz.title}
                </h1>
                <p className="text-sm text-gray-600 font-light mt-2">
                  {quiz.description || "Live quiz control"}
                </p>
              </div>
              <button
                onClick={handleBackToPortal}
                className="px-5 py-2 text-sm font-light text-gray-900 border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all whitespace-nowrap"
              >
                ← Back
              </button>
            </div>
          </div>

          {currentQuestion ? (
            <div className="space-y-6">
              {/* Question Section */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
                      Question {currentIndex + 1} of {questions.length}
                    </div>
                    <h2 className="text-2xl font-light text-gray-900 leading-relaxed">
                      {currentQuestion.text}
                    </h2>
                  </div>
                  <div
                    className={`px-3 py-1 text-xs font-medium whitespace-nowrap ${
                      isQuestionActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {isQuestionActive ? "Active" : "Ended"}
                  </div>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Options
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQuestion.options.map((option) => {
                      const total = Object.values(voteCounts).reduce(
                        (sum, c) => sum + (c as number),
                        0
                      );
                      const count = voteCounts[option.key] || 0;
                      const percentage =
                        total > 0 ? Math.round((count / total) * 100) : 0;

                      return (
                        <div
                          key={option.key}
                          className="relative p-3 border border-gray-200 hover:border-gray-400 transition-colors"
                        >
                          {/* Background percentage bar */}
                          <div
                            className="absolute inset-0 bg-gray-100 transition-all duration-300 pointer-events-none"
                            style={{ width: `${percentage}%` }}
                          ></div>

                          {/* Content */}
                          <div className="relative flex items-start gap-2">
                            <div className="flex-shrink-0 w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-medium">
                              {option.key}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm text-gray-700">
                                {option.text}
                              </div>
                              {total > 0 && (
                                <div className="text-xs text-gray-500 font-light mt-1">
                                  {count} vote{count !== 1 ? "s" : ""} (
                                  {percentage}%)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Timer and Stats */}
              <div className="grid grid-cols-3 gap-3">
                {/* Timer */}
                <div>
                  <div
                    className={`p-4 border transition-all ${
                      currentQuestionTimeLeft <= 10
                        ? "bg-red-50 border-red-200"
                        : currentQuestionTimeLeft <= 30
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-2">
                      Time Left
                    </div>
                    <div
                      className={`text-2xl font-mono font-light tracking-tight ${
                        currentQuestionTimeLeft <= 10
                          ? "text-red-600"
                          : currentQuestionTimeLeft <= 30
                          ? "text-amber-600"
                          : "text-gray-900"
                      }`}
                    >
                      {formatTime(currentQuestionTimeLeft)}
                    </div>
                    <div className="mt-3 h-1 bg-gray-200">
                      <div
                        className={`h-full transition-all duration-1000 ease-linear ${
                          currentQuestionTimeLeft <= 10
                            ? "bg-red-500"
                            : currentQuestionTimeLeft <= 30
                            ? "bg-amber-500"
                            : "bg-gray-400"
                        }`}
                        style={{
                          width: `${Math.max(
                            0,
                            (currentQuestionTimeLeft /
                              (currentQuestion?.timeLimitSeconds || 1)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Response Count */}
                <div>
                  <div className="p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-2">
                      Responses
                    </div>
                    <div className="text-2xl font-light text-gray-900">
                      {Object.values(voteCounts).reduce(
                        (sum, c) => sum + (c as number),
                        0
                      )}
                      /{participants.length}
                    </div>
                    <div className="mt-3 h-1 bg-gray-200">
                      <div
                        className="h-full bg-gray-400 transition-all duration-500"
                        style={{
                          width: `${
                            participants.length > 0
                              ? (Object.values(voteCounts).reduce(
                                  (sum, c) => sum + (c as number),
                                  0
                                ) /
                                  participants.length) *
                                100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Participants */}
                <div>
                  <div className="p-4 border border-gray-200">
                    <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-2">
                      Participants
                    </div>
                    <div className="text-2xl font-light text-gray-900">
                      {participants.length}
                    </div>
                    <div className="mt-3 text-xs text-gray-600">Connected</div>
                  </div>
                </div>
              </div>

              {/* Vote Results */}
              {!isQuestionActive && (
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Response Breakdown
                  </div>
                  <div className="space-y-2">
                    {(() => {
                      const correctKeys = new Set(
                        (currentQuestion?.options || [])
                          .filter((o) => o.isCorrect)
                          .map((o) => o.key)
                      );
                      const total = Object.values(voteCounts).reduce(
                        (sum, c) => sum + (c as number),
                        0
                      );

                      return (currentQuestion?.options || []).map((option) => {
                        const count = voteCounts[option.key] || 0;
                        const percentage =
                          total > 0 ? Math.round((count / total) * 100) : 0;
                        const isCorrect = correctKeys.has(option.key);

                        return (
                          <div key={option.key}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-light text-gray-900">
                                  {option.key}. {option.text}
                                </span>
                                {isCorrect && (
                                  <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5">
                                    Correct
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-light text-gray-600">
                                {count} ({percentage}%)
                              </span>
                            </div>
                            <div className="h-2 bg-gray-200">
                              <div
                                className={`h-full transition-all ${
                                  isCorrect ? "bg-green-500" : "bg-gray-400"
                                }`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 border-t border-gray-100 pt-4">
                {isQuestionActive ? (
                  <button
                    onClick={handleStopQuestion}
                    className="flex-1 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-light transition-colors"
                  >
                    Stop Question
                  </button>
                ) : currentIndex + 1 < questions.length ? (
                  <button
                    onClick={handlePushNext}
                    className="flex-1 px-6 py-2 bg-black hover:bg-gray-800 text-white text-sm font-light transition-colors"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleEndQuiz}
                    className="flex-1 px-6 py-2 bg-black hover:bg-gray-800 text-white text-sm font-light transition-colors"
                  >
                    End Quiz
                  </button>
                )}
                <button
                  onClick={handleViewLeaderboard}
                  className="flex-1 px-6 py-2 border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-light transition-colors"
                >
                  Leaderboard
                </button>
              </div>
            </div>
          ) : !isActive ? (
            /* Quiz Ended */
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-green-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
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
              <h2 className="text-2xl font-light text-gray-900 mb-3">
                Quiz Completed
              </h2>
              <p className="text-gray-600 text-sm mb-8 max-w-md mx-auto">
                All questions have been answered. View the final results and
                leaderboard.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleViewLeaderboard}
                  className="px-6 py-2 bg-black hover:bg-gray-800 text-white text-sm font-light transition-colors"
                >
                  View Leaderboard
                </button>
                <button
                  onClick={handleBackToPortal}
                  className="px-6 py-2 border border-gray-200 hover:bg-gray-50 text-gray-900 text-sm font-light transition-colors"
                >
                  Back to Portal
                </button>
              </div>
            </div>
          ) : (
            /* No Question Yet */
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-6 bg-gray-100 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-600"
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
              <h2 className="text-xl font-light text-gray-900 mb-3">
                Waiting for responses
              </h2>
              <p className="text-gray-600 text-sm mb-6">
                Ready to start? Go back to push the first question.
              </p>
              <button
                onClick={handleBackToPortal}
                className="px-6 py-2 bg-black hover:bg-gray-800 text-white text-sm font-light transition-colors"
              >
                Back to Portal
              </button>
            </div>
          )}
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
}
