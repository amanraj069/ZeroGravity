"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getQuiz, leaderboard } from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SimpleFooter from "@/components/landing/SimpleFooter";
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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <LandingNavbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-2 border-gray-300 border-t-black  animate-spin"></div>
            <p className="text-sm text-gray-600 font-light">
              Loading leaderboard...
            </p>
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
        <div className="w-full max-w-6xl space-y-8">
          {/* Header */}
          <div className="border-b border-gray-100 pb-8">
            <h1 className="text-4xl font-light text-black tracking-tight mb-2">
              Leaderboard
            </h1>
            <p className="text-sm text-gray-600 font-light mb-8">
              {quiz?.title || "Quiz Results"}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleBackToHosted}
                className="flex-1 px-6 py-3 bg-black hover:bg-gray-800 text-white font-light transition-colors "
              >
                ← Back to Control
              </button>
              <button
                onClick={handleBackToPortal}
                className="flex-1 px-6 py-3 border border-gray-200 hover:bg-gray-50 text-gray-900 font-light transition-colors "
              >
                Portal
              </button>
            </div>
          </div>

          {/* Leaderboard - Table Header */}
          <div className="hidden lg:block border border-gray-200 mb-0">
            <div className="grid grid-cols-12 gap-0 p-4 bg-white border-b border-gray-200">
              <div className="col-span-3 text-xs font-medium text-gray-600 uppercase tracking-wide">
                Name
              </div>
              <div className="col-span-4 text-xs font-medium text-gray-600 uppercase tracking-wide">
                Answer Summary
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-600 uppercase tracking-wide text-center">
                Accuracy
              </div>
              <div className="col-span-2 text-xs font-medium text-gray-600 uppercase tracking-wide text-center">
                Points
              </div>
              <div className="col-span-1 text-xs font-medium text-gray-600 uppercase tracking-wide text-right pr-4">
                Score
              </div>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-0 border border-gray-200 border-t-0">
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

                  return (
                    <div
                      key={entry.quizUserId}
                      className={`hidden lg:block border-b border-gray-200 hover:bg-opacity-80 transition-colors last:border-b-0 ${
                        rank === 1
                          ? "bg-yellow-50"
                          : rank === 2
                          ? "bg-gray-100"
                          : rank === 3
                          ? "bg-orange-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="grid grid-cols-12 gap-0 p-4 items-center">
                        {/* Name Column */}
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="w-10 h-10 flex items-center justify-center bg-black text-white text-sm font-medium flex-shrink-0">
                            {rank}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-light text-gray-900 truncate">
                              {entry.participantName}
                            </h3>
                            <p className="text-xs text-gray-500 font-light">
                              Participant
                            </p>
                          </div>
                        </div>

                        {/* Answer Summary Column */}
                        <div className="col-span-4 space-y-2">
                          {/* Visual Blocks */}
                          <div className="flex gap-0.5">
                            {Array.from({
                              length: Math.max(
                                correctAnswers + incorrectAnswers,
                                1
                              ),
                            }).map((_, i) => {
                              if (i < correctAnswers)
                                return (
                                  <div
                                    key={i}
                                    className="w-2 h-3 bg-green-500"
                                  />
                                );
                              return (
                                <div key={i} className="w-2 h-3 bg-red-500" />
                              );
                            })}
                          </div>
                          {/* Answer Count */}
                          <div className="flex gap-4 text-xs font-light">
                            <span className="text-green-700">
                              ✓{correctAnswers}
                            </span>
                            <span className="text-red-700">
                              ✗{incorrectAnswers}
                            </span>
                          </div>
                        </div>

                        {/* Accuracy Column */}
                        <div className="col-span-2 text-center">
                          <div className="flex items-center justify-center">
                            <span className="text-sm font-light text-gray-900">
                              {accuracy}%
                            </span>
                          </div>
                        </div>

                        {/* Points Column */}
                        <div className="col-span-2 text-center">
                          <span className="text-sm font-light text-gray-900">
                            {pointsScored}/92
                          </span>
                        </div>

                        {/* Score Column */}
                        <div className="col-span-1 text-right pr-4">
                          <span className="text-sm font-light text-gray-900">
                            {Math.round(entry.totalScore || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-12 bg-gray-50">
                <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
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
                <h3 className="text-base font-light text-gray-900 mb-2">
                  No scores yet
                </h3>
                <p className="text-sm text-gray-600 font-light">
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

                  return (
                    <div
                      key={entry.quizUserId}
                      className={`p-4 border border-gray-200 hover:border-gray-400 transition-colors ${
                        rank === 1
                          ? "bg-yellow-50 border-yellow-200"
                          : rank === 2
                          ? "bg-gray-100 border-gray-300"
                          : rank === 3
                          ? "bg-orange-50 border-orange-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 flex items-center justify-center bg-black text-white text-xs font-medium flex-shrink-0">
                            {rank}
                          </div>
                          <div>
                            <h3 className="text-sm font-light text-gray-900">
                              {entry.participantName}
                            </h3>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-light text-gray-900">
                            {Math.round(entry.totalScore || 0)}
                          </div>
                          <p className="text-xs text-gray-500 font-light">
                            score
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-0.5">
                          {Array.from({
                            length: Math.max(
                              (entry.correctAnswers || 0) +
                                (entry.incorrectAnswers || 0),
                              1
                            ),
                          }).map((_, i) => {
                            if (i < (entry.correctAnswers || 0))
                              return (
                                <div
                                  key={i}
                                  className="flex-1 h-2 bg-green-500"
                                />
                              );
                            return (
                              <div key={i} className="flex-1 h-2 bg-red-500" />
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-gray-600 font-light">
                            {accuracy}% • ✓{entry.correctAnswers || 0} ✗
                            {entry.incorrectAnswers || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-gray-600">
                No scores yet
              </div>
            )}
          </div>

          {/* Stats Summary */}
          {board.length > 0 && (
            <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-8">
              <div className="p-5 border border-gray-200  text-center">
                <div className="text-2xl font-light text-gray-900 mb-2">
                  {board.length}
                </div>
                <p className="text-xs text-gray-600 font-light uppercase tracking-wide">
                  Participants
                </p>
              </div>
              <div className="p-5 border border-gray-200  text-center">
                <div className="text-2xl font-light text-gray-900 mb-2">
                  {Math.round(board[0]?.totalScore || 0)}
                </div>
                <p className="text-xs text-gray-600 font-light uppercase tracking-wide">
                  High Score
                </p>
              </div>
              <div className="p-5 border border-gray-200  text-center">
                <div className="text-2xl font-light text-gray-900 mb-2">
                  {Math.round(
                    board.reduce(
                      (sum, entry) => sum + (entry.totalScore || 0),
                      0
                    ) / board.length
                  ) || 0}
                </div>
                <p className="text-xs text-gray-600 font-light uppercase tracking-wide">
                  Average
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <SimpleFooter />
    </div>
  );
}
