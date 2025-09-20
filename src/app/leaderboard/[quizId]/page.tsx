"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getQuiz, leaderboard } from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { Quiz, QuizLeaderboardEntry } from "@/types/quiz";

export default function LeaderboardPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [board, setBoard] = useState<QuizLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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
  }, [quizId]);

  useEffect(() => {
    if (!quizId) return;

    joinQuizRoom(quizId);
    const s = getSocket();

    const onVotesUpdate = async () => {
      // Refresh leaderboard when votes are updated
      try {
        const b = await leaderboard(quizId);
        if (b?.success) {
          setBoard(b.leaderboard);
        }
      } catch (error) {
        console.error("Failed to update leaderboard:", error);
      }
    };

    s.on("votes:update", onVotesUpdate);
    s.on("question:timeup", onVotesUpdate);

    return () => {
      s.off("votes:update", onVotesUpdate);
      s.off("question:timeup", onVotesUpdate);
    };
  }, [quizId]);

  const handleBackToHosted = () => {
    router.push(`/hosted/${quizId}`);
  };

  const handleBackToPortal = () => {
    router.push(`/quizzes/host/${quizId}`);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "from-yellow-100 to-amber-100 border-yellow-300";
      case 2:
        return "from-gray-100 to-slate-100 border-gray-300";
      case 3:
        return "from-orange-100 to-amber-100 border-orange-300";
      default:
        return "from-white to-gray-50 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <LandingNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Loading leaderboard...</p>
          </div>
        </main>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-gray-900 mb-4 tracking-tight">
              Leaderboard
            </h1>
            <p className="text-lg text-gray-600 font-light mb-6">
              {quiz?.title || "Quiz Results"}
            </p>

            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={handleBackToHosted}
                className="px-6 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-light rounded-lg"
              >
                ← Back to Live Control
              </button>
              <button
                onClick={handleBackToPortal}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors font-light rounded-lg"
              >
                Quiz Portal
              </button>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4">
            {board.length > 0 ? (
              board
                .slice()
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((entry, index) => {
                  const rank = index + 1;
                  const rankIcon = getRankIcon(rank);
                  const rankColor = getRankColor(rank);

                  return (
                    <div
                      key={entry.quizUserId}
                      className={`bg-gradient-to-r ${rankColor} p-6 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {/* Rank */}
                          <div className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm border border-gray-200">
                            {rankIcon ? (
                              <span className="text-2xl">{rankIcon}</span>
                            ) : (
                              <span className="text-lg font-bold text-gray-700">
                                #{rank}
                              </span>
                            )}
                          </div>

                          {/* Participant Info */}
                          <div>
                            <h3 className="text-xl font-medium text-gray-900">
                              {entry.participantName}
                            </h3>
                            <p className="text-sm text-gray-600">Participant</p>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-3xl font-bold text-gray-900">
                            {Math.round(entry.totalScore || 0)}
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            points
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar for Visual Score Representation */}
                      {board.length > 0 && (
                        <div className="mt-4">
                          <div className="h-2 bg-white bg-opacity-50 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-1000 ease-out ${
                                rank === 1
                                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600"
                                  : rank === 2
                                  ? "bg-gradient-to-r from-gray-400 to-gray-600"
                                  : rank === 3
                                  ? "bg-gradient-to-r from-orange-400 to-orange-600"
                                  : "bg-gradient-to-r from-blue-400 to-blue-600"
                              }`}
                              style={{
                                width: `${Math.max(
                                  10,
                                  ((entry.totalScore || 0) /
                                    (board[0]?.totalScore || 1)) *
                                    100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-200">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                <h3 className="text-xl font-light text-gray-900 mb-2">
                  No scores yet
                </h3>
                <p className="text-gray-600">
                  Participants need to answer questions to appear on the
                  leaderboard
                </p>
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {board.length > 0 && (
            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {board.length}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    Total Participants
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round(board[0]?.totalScore || 0)}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    Highest Score
                  </p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900">
                    {Math.round(
                      board.reduce(
                        (sum, entry) => sum + (entry.totalScore || 0),
                        0
                      ) / board.length
                    ) || 0}
                  </div>
                  <p className="text-sm text-blue-700 font-medium">
                    Average Score
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
