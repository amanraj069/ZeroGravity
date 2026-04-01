"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getQuiz, leaderboard } from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { Quiz, QuizLeaderboardEntry } from "@/types/quiz";
import { useAuth } from "@/contexts/AuthContext";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");
  const { user } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [board, setBoard] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Function to fetch leaderboard data
  const fetchLeaderboard = React.useCallback(async () => {
    try {
      const b = await leaderboard(quizId);
      if (b?.success) {
        setBoard(b.leaderboard);
      }
    } catch (error) {
      console.error("Failed to update leaderboard:", error);
    }
  }, [quizId]);

  useEffect(() => {
    if (!quizId) return;

    (async () => {
      try {
        const [q, b] = await Promise.all([
          getQuiz(quizId),
          leaderboard(quizId),
        ]);

        if (q?.success) {
          setQuiz(q.quiz);
        }

        if (b?.success) {
          setBoard(b.leaderboard);
        }
      } catch (error) {
        console.error("Failed to load leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    })();

    // Start polling every 5 seconds for live updates
    pollingRef.current = setInterval(fetchLeaderboard, 5000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [quizId, fetchLeaderboard]);

  useEffect(() => {
    if (!quizId) return;

    joinQuizRoom(quizId);
    const s = getSocket();

    // Refresh leaderboard on various events
    s.on("votes:update", fetchLeaderboard);
    s.on("question:timeup", fetchLeaderboard);
    s.on("question:pushed", fetchLeaderboard);
    s.on("quiz:ended", fetchLeaderboard);

    return () => {
      s.off("votes:update", fetchLeaderboard);
      s.off("question:timeup", fetchLeaderboard);
      s.off("question:pushed", fetchLeaderboard);
      s.off("quiz:ended", fetchLeaderboard);
    };
  }, [quizId, fetchLeaderboard]);

  const handleBackToHosted = () => {
    router.push(`/hosted/${quizId}`);
  };

  const handleBackToPortal = () => {
    router.push(`/quizzes/host/${quizId}`);
  };

  if (loading) {
    return (
      <ZeroGravityLoading
        title="Loading Leaderboard"
        subtitle="Fetching quiz results..."
        showNavigation={true}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-4 sm:py-10">
        <div className="w-full max-w-6xl space-y-3 sm:space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <button
                onClick={() =>
                  router.push(
                    `/quizzes/host/${quizId}${quiz?.joinCode ? `?code=${quiz.joinCode}` : ""}`,
                  )
                }
                className="mt-1 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Back to Host"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
              <div>
                <h1 className="text-xl sm:text-4xl font-light text-black dark:text-white tracking-tight mb-0.5 sm:mb-1">
                  Leaderboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light">
                  {quiz?.title || "Quiz Results"}
                </p>
              </div>
            </div>

            {user && quiz?.ownerUserId === user.userId && (
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex flex-row gap-1.5 sm:gap-3">
                  <button
                    onClick={handleBackToHosted}
                    className="px-2 sm:px-5 py-1.5 sm:py-2.5 text-[10px] sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-white font-light transition-colors whitespace-nowrap"
                  >
                    ← Back to Control
                  </button>
                  <button
                    onClick={handleBackToPortal}
                    className="px-2 sm:px-5 py-1.5 sm:py-2.5 text-[10px] sm:text-sm border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-white font-light transition-colors whitespace-nowrap"
                  >
                    Portal
                  </button>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-500 font-light">
                  {board.length} participant{board.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </div>

          {/* Desktop Leaderboard - Quizizz-style */}
          <div className="hidden lg:block">
            {/* Column Headers */}
            <div className="flex items-center gap-5 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="w-[200px] flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Participant
              </div>
              <div className="flex-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Answer Summary
              </div>
              <div className="w-[60px] text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
                Accuracy
              </div>
              <div className="w-[120px] text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
                Score
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800 border-x border-b border-gray-200 dark:border-gray-800">
              {board.length > 0 ? (
                board
                  .slice()
                  .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                  .map((entry) => {
                    const isDeleted = !!entry.isDeleted;
                    const accuracy = entry.accuracy || 0;
                    const correctAnswers = entry.correctAnswers || 0;
                    const incorrectAnswers = entry.incorrectAnswers || 0;
                    const totalQuestions =
                      quiz?.questions?.length ||
                      correctAnswers + incorrectAnswers ||
                      1;
                    const answeredQuestions = correctAnswers + incorrectAnswers;
                    const unanswered = totalQuestions - answeredQuestions;

                    // Generate avatar color from name
                    const getAvatarColor = (name: string) => {
                      const colors = [
                        "bg-pink-500",
                        "bg-orange-500",
                        "bg-red-500",
                        "bg-purple-500",
                        "bg-blue-500",
                        "bg-green-500",
                        "bg-yellow-500",
                        "bg-indigo-500",
                        "bg-cyan-500",
                        "bg-teal-500",
                      ];
                      const charCode = name.charCodeAt(0) || 0;
                      return colors[charCode % colors.length];
                    };

                    return (
                      <div
                        key={entry.quizUserId}
                        className={`py-4 px-4 transition-colors ${
                          isDeleted
                            ? "opacity-60"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center gap-5">
                          {/* Left: Avatar + Name */}
                          <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                            {entry.participantAvatar ? (
                              <Image
                                src={`/quiz/avatars/${entry.participantAvatar}`}
                                alt={entry.participantName}
                                width={56}
                                height={56}
                                className={`w-14 h-14 rounded-full object-cover flex-shrink-0 ${isDeleted ? "grayscale" : ""}`}
                              />
                            ) : (
                              <div
                                className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-medium flex-shrink-0 ${getAvatarColor(entry.participantName)} ${isDeleted ? "grayscale" : ""}`}
                              >
                                {entry.participantName
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </div>
                            )}
                            <h3
                              className={`text-base font-medium truncate ${
                                isDeleted
                                  ? "text-gray-500 dark:text-gray-400"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {entry.participantName}
                            </h3>
                          </div>

                          {/* Center: Answer bars + counts */}
                          <div className="flex-1 min-w-0">
                            <div className="flex gap-1 mb-1.5 mr-12">
                              {Array.from({ length: totalQuestions }).map(
                                (_, i) => {
                                  let bgColor = "bg-blue-400 dark:bg-blue-500";
                                  if (i < correctAnswers) {
                                    bgColor = "bg-green-500";
                                  } else if (i < answeredQuestions) {
                                    bgColor = "bg-red-500";
                                  }
                                  return (
                                    <div
                                      key={i}
                                      className={`h-5 rounded-sm ${bgColor}`}
                                      style={{
                                        width: `${100 / totalQuestions}%`,
                                      }}
                                    />
                                  );
                                },
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓ {correctAnswers} Correct
                              </span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                ✗ {incorrectAnswers} Incorrect
                              </span>
                              {unanswered > 0 && (
                                <span className="text-blue-500 dark:text-blue-400 font-medium">
                                  — {unanswered} Skipped
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Accuracy circle */}
                          <div className="w-[60px] flex items-center justify-center flex-shrink-0">
                            <div className="relative w-12 h-12">
                              <svg
                                className="w-12 h-12 -rotate-90"
                                viewBox="0 0 36 36"
                              >
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  className="stroke-gray-200 dark:stroke-gray-700"
                                  strokeWidth="3"
                                />
                                <circle
                                  cx="18"
                                  cy="18"
                                  r="15"
                                  fill="none"
                                  className="stroke-green-500"
                                  strokeWidth="3"
                                  strokeDasharray={`${accuracy * 0.9425} 94.25`}
                                  strokeLinecap="round"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-white">
                                {accuracy}%
                              </span>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="w-[120px] text-right flex-shrink-0">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {Math.round(entry.totalScore || 0)}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(entry.pointsEarned || 0)} pts
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="min-h-[400px] text-center py-12 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400 dark:text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-light text-gray-900 dark:text-white mb-2">
                    No scores yet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
                    Participants need to answer questions to appear on the
                    leaderboard
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile View - Quizizz-style rows */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
            {board.length > 0 ? (
              board
                .slice()
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((entry) => {
                  const isDeleted = !!entry.isDeleted;
                  const accuracy = entry.accuracy || 0;
                  const correctAnswers = entry.correctAnswers || 0;
                  const incorrectAnswers = entry.incorrectAnswers || 0;
                  const totalQuestions =
                    quiz?.questions?.length ||
                    correctAnswers + incorrectAnswers ||
                    1;
                  const answeredQuestions = correctAnswers + incorrectAnswers;
                  const unanswered = totalQuestions - answeredQuestions;

                  // Generate avatar color from name
                  const getAvatarColor = (name: string) => {
                    const colors = [
                      "bg-pink-500",
                      "bg-orange-500",
                      "bg-red-500",
                      "bg-purple-500",
                      "bg-blue-500",
                      "bg-green-500",
                      "bg-yellow-500",
                      "bg-indigo-500",
                      "bg-cyan-500",
                      "bg-teal-500",
                    ];
                    const charCode = name.charCodeAt(0) || 0;
                    return colors[charCode % colors.length];
                  };

                  return (
                    <div
                      key={entry.quizUserId}
                      className={`py-3 px-2 ${isDeleted ? "opacity-60" : ""}`}
                    >
                      <div className="flex items-center gap-3">
                        {/* Left: Avatar + Name + Bars */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            {entry.participantAvatar ? (
                              <Image
                                src={`/quiz/avatars/${entry.participantAvatar}`}
                                alt={entry.participantName}
                                width={32}
                                height={32}
                                className={`w-8 h-8 rounded-full object-cover flex-shrink-0 ${isDeleted ? "grayscale" : ""}`}
                              />
                            ) : (
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getAvatarColor(entry.participantName)} ${isDeleted ? "grayscale" : ""}`}
                              >
                                {entry.participantName
                                  ?.charAt(0)
                                  ?.toUpperCase() || "?"}
                              </div>
                            )}
                            <h3
                              className={`text-sm font-medium truncate ${
                                isDeleted
                                  ? "text-gray-500 dark:text-gray-400 line-through"
                                  : "text-gray-900 dark:text-white"
                              }`}
                            >
                              {entry.participantName}
                            </h3>
                            {/* Counts beside name */}
                            <div className="flex items-center gap-1.5 text-[10px] ml-auto flex-shrink-0">
                              <span className="text-green-600 dark:text-green-400 font-medium">
                                ✓{correctAnswers}
                              </span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                ✗{incorrectAnswers}
                              </span>
                              {unanswered > 0 && (
                                <span className="text-blue-500 dark:text-blue-400 font-medium">
                                  —{unanswered}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Answer bars */}
                          <div className="flex gap-0.5 mb-1">
                            {Array.from({ length: totalQuestions }).map(
                              (_, i) => {
                                let bgColor = "bg-blue-400 dark:bg-blue-500";
                                if (i < correctAnswers) {
                                  bgColor = "bg-green-500";
                                } else if (i < answeredQuestions) {
                                  bgColor = "bg-red-500";
                                }
                                return (
                                  <div
                                    key={i}
                                    className={`h-4 rounded-sm ${bgColor}`}
                                    style={{
                                      width: `${100 / totalQuestions}%`,
                                    }}
                                  />
                                );
                              },
                            )}
                          </div>
                        </div>

                        {/* Right: Accuracy circle + Score */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {/* Accuracy circle */}
                          <div className="relative w-10 h-10">
                            <svg
                              className="w-10 h-10 -rotate-90"
                              viewBox="0 0 36 36"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                className="stroke-gray-200 dark:stroke-gray-700"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                className="stroke-green-500"
                                strokeWidth="3"
                                strokeDasharray={`${accuracy * 0.9425} 94.25`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-gray-900 dark:text-white">
                              {accuracy}%
                            </span>
                          </div>
                          {/* Score */}
                          <div className="text-right min-w-[40px]">
                            <div className="text-sm font-bold text-gray-900 dark:text-white text-center">
                              {Math.round(entry.totalScore || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-xs text-gray-600 dark:text-gray-400">
                No scores yet
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
