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
      <main className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-6xl space-y-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-2">
              <button
                onClick={() =>
                  router.push(
                    `/quizzes/host/${quizId}${quiz?.joinCode ? `?code=${quiz.joinCode}` : ""}`,
                  )
                }
                className="mt-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                title="Back to Host"
              >
                <svg
                  className="w-6 h-6"
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
                <h1 className="text-4xl font-light text-black dark:text-white tracking-tight mb-2">
                  Leaderboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
                  {quiz?.title || "Quiz Results"}
                </p>
              </div>
            </div>

            {user && quiz?.ownerUserId === user.userId && (
              <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <button
                  onClick={handleBackToHosted}
                  className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-white font-light transition-colors whitespace-nowrap"
                >
                  ← Back to Control
                </button>
                <button
                  onClick={handleBackToPortal}
                  className="px-6 py-3 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-white font-light transition-colors whitespace-nowrap"
                >
                  Portal
                </button>
              </div>
            )}
          </div>

          {/* Leaderboard - Table Header */}
          <div className="hidden lg:block border border-gray-200 dark:border-gray-800">
            <div className="grid grid-cols-12 gap-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="col-span-4 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Participant
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center">
                Score
              </div>
              <div className="col-span-1 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide text-center">
                Accuracy
              </div>
              <div className="col-span-5 text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Answer Summary
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-0 border border-gray-200 dark:border-gray-800 border-t-0">
            {board.length > 0 ? (
              board
                .slice()
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((entry, index) => {
                  const rank = index + 1;
                  const correctAnswers = entry.correctAnswers || 0;
                  const incorrectAnswers = entry.incorrectAnswers || 0;
                  const accuracy = entry.accuracy || 0;
                  const pointsScored = entry.pointsEarned || 0;
                  const totalQuestions =
                    quiz?.questions?.length ||
                    correctAnswers + incorrectAnswers ||
                    1;
                  const answeredQuestions = correctAnswers + incorrectAnswers;

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
                      className={`hidden lg:block border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:border-b-0 bg-white dark:bg-gray-900`}
                    >
                      <div className="grid grid-cols-12 gap-0 p-4 items-center">
                        {/* Participant Column with Avatar */}
                        <div className="col-span-4 flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold flex-shrink-0">
                            {rank}
                          </div>
                          {entry.participantAvatar ? (
                            <Image
                              src={`/quiz/avatars/${entry.participantAvatar}`}
                              alt={entry.participantName}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 flex items-center justify-center text-white text-lg font-medium flex-shrink-0 ${getAvatarColor(entry.participantName)}`}
                            >
                              {entry.participantName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                          )}
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {entry.participantName}
                          </h3>
                        </div>

                        {/* Score Column */}
                        <div className="col-span-2 text-center">
                          <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {Math.round(entry.totalScore || 0)}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(pointsScored)} pts
                          </p>
                        </div>

                        {/* Accuracy Column */}
                        <div className="col-span-1 text-center">
                          <span className="text-base font-medium text-gray-900 dark:text-white">
                            {accuracy}%
                          </span>
                        </div>

                        {/* Answer Summary Column - Fixed width per question */}
                        <div className="col-span-5">
                          <div className="flex gap-1">
                            {Array.from({ length: totalQuestions }).map(
                              (_, i) => {
                                let bgColor = "bg-gray-300 dark:bg-gray-600"; // unanswered
                                if (i < correctAnswers) {
                                  bgColor = "bg-green-500";
                                } else if (i < answeredQuestions) {
                                  bgColor = "bg-red-500";
                                }
                                return (
                                  <div
                                    key={i}
                                    className={`h-6 ${bgColor}`}
                                    style={{
                                      width: `${100 / totalQuestions}%`,
                                    }}
                                  />
                                );
                              },
                            )}
                          </div>
                          <div className="flex gap-3 mt-1 text-xs">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              ✓{correctAnswers}
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              ✗{incorrectAnswers}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="min-h-[500px] text-center py-12 bg-white dark:bg-gray-900 align-items-center justify-center flex flex-col gap-2">
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

          {/* Mobile View - Compact Cards */}
          <div className="lg:hidden space-y-3">
            {board.length > 0 ? (
              board
                .slice()
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((entry, index) => {
                  const rank = index + 1;
                  const accuracy = entry.accuracy || 0;
                  const correctAnswers = entry.correctAnswers || 0;
                  const incorrectAnswers = entry.incorrectAnswers || 0;
                  const totalQuestions =
                    quiz?.questions?.length ||
                    correctAnswers + incorrectAnswers ||
                    1;
                  const answeredQuestions = correctAnswers + incorrectAnswers;

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
                      className="p-4 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 transition-colors bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-bold flex-shrink-0">
                            {rank}
                          </div>
                          {entry.participantAvatar ? (
                            <Image
                              src={`/quiz/avatars/${entry.participantAvatar}`}
                              alt={entry.participantName}
                              width={48}
                              height={48}
                              className="w-12 h-12 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-12 h-12 flex items-center justify-center text-white text-lg font-medium flex-shrink-0 ${getAvatarColor(entry.participantName)}`}
                            >
                              {entry.participantName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                          )}
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {entry.participantName}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900 dark:text-white">
                            {Math.round(entry.totalScore || 0)}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Math.round(entry.pointsEarned || 0)} pts ·{" "}
                            {accuracy}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-1">
                          {Array.from({ length: totalQuestions }).map(
                            (_, i) => {
                              let bgColor = "bg-gray-300 dark:bg-gray-600";
                              if (i < correctAnswers) {
                                bgColor = "bg-green-500";
                              } else if (i < answeredQuestions) {
                                bgColor = "bg-red-500";
                              }
                              return (
                                <div
                                  key={i}
                                  className={`h-4 ${bgColor}`}
                                  style={{ width: `${100 / totalQuestions}%` }}
                                />
                              );
                            },
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            ✓{correctAnswers}
                          </span>
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            ✗{incorrectAnswers}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                No scores yet
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {board.length > 0 && (
            <div className="grid grid-cols-3 gap-4 border-t border-gray-200 dark:border-gray-800 pt-8">
              <div className="p-5 border border-gray-200 dark:border-gray-800 text-center bg-white dark:bg-gray-900">
                <div className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                  {board.length}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-light uppercase tracking-wide">
                  Participants
                </p>
              </div>
              <div className="p-5 border border-gray-200 dark:border-gray-800 text-center bg-white dark:bg-gray-900">
                <div className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                  {Math.round(board[0]?.totalScore || 0)}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-light uppercase tracking-wide">
                  High Score
                </p>
              </div>
              <div className="p-5 border border-gray-200 dark:border-gray-800 text-center bg-white dark:bg-gray-900">
                <div className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                  {Math.round(
                    board.reduce(
                      (sum, entry) => sum + (entry.totalScore || 0),
                      0,
                    ) / board.length,
                  ) || 0}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-light uppercase tracking-wide">
                  Average
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
