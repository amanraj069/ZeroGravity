"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getQuiz,
  listParticipants,
  pushQuestion,
  endQuestion,
  leaderboard,
  endQuiz,
} from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import LandingNavbar from "@/components/landing/LandingNavbar";
import LandingFooter from "@/components/landing/LandingFooter";
import { Quiz, QuizParticipant, QuizLeaderboardEntry } from "@/types/quiz";

export default function HostedQuizPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [board, setBoard] = useState<QuizLeaderboardEntry[]>([]);
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

      // Fetch final vote counts and leaderboard when question ends
      try {
        const [b, p] = await Promise.all([
          leaderboard(quizId),
          listParticipants(quizId),
        ]);
        if (b?.success) setBoard(b.leaderboard);
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

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
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

      const [b, p] = await Promise.all([
        leaderboard(quizId),
        listParticipants(quizId),
      ]);
      if (b?.success) setBoard(b.leaderboard);
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
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-light text-gray-900 tracking-tight">
                  {quiz.title}
                </h1>
                <p className="text-gray-600 font-light">Live Quiz Control</p>
              </div>
              <button
                onClick={handleBackToPortal}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 transition-colors font-light rounded-lg"
              >
                ← Back to Quiz Portal
              </button>
            </div>

            {currentQuestion && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Question Info */}
                <div className="lg:col-span-2">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-medium text-blue-900">
                        Question {currentIndex + 1} of {questions.length}
                      </h2>
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-medium ${
                          isQuestionActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {isQuestionActive ? "Active" : "Ended"}
                      </span>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-blue-100">
                      <p className="text-gray-900 text-xl leading-relaxed font-medium">
                        {currentQuestion.text}
                      </p>
                    </div>

                    {/* Show answer options for reference */}
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-blue-900 mb-3">
                        Answer Options:
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {currentQuestion.options.map((option) => (
                          <div
                            key={option.key}
                            className="bg-white p-3 rounded-lg border border-blue-100"
                          >
                            <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-sm font-bold mr-2">
                              {option.key}
                            </span>
                            <span className="text-gray-700 text-sm">
                              {option.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timer and Controls */}
                <div className="space-y-4">
                  <div
                    className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                      currentQuestionTimeLeft <= 10
                        ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300"
                        : currentQuestionTimeLeft <= 30
                        ? "bg-gradient-to-br from-yellow-50 to-amber-100 border-yellow-300"
                        : "bg-gradient-to-br from-green-50 to-emerald-100 border-green-300"
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600 mb-2">
                        Time Remaining
                      </p>
                      <div
                        className={`text-4xl font-mono font-bold ${
                          currentQuestionTimeLeft <= 10
                            ? "text-red-600"
                            : currentQuestionTimeLeft <= 30
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        {formatTime(currentQuestionTimeLeft)}
                      </div>
                    </div>
                  </div>

                  {isQuestionActive && (
                    <button
                      onClick={handleStopQuestion}
                      className="w-full px-4 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium rounded-lg"
                    >
                      Stop Question
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Post-Question Actions */}
            {!isQuestionActive && currentQuestion && (
              <div className="mt-6 flex items-center justify-center space-x-4">
                {currentIndex + 1 < questions.length ? (
                  <button
                    onClick={handlePushNext}
                    className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors font-medium rounded-lg"
                  >
                    Push Next Question
                  </button>
                ) : (
                  <button
                    onClick={handleEndQuiz}
                    className="px-8 py-3 bg-red-600 text-white hover:bg-red-700 transition-colors font-medium rounded-lg"
                  >
                    End Quiz
                  </button>
                )}
                <button
                  onClick={handleViewLeaderboard}
                  className="px-8 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium rounded-lg"
                >
                  View Leaderboard
                </button>
              </div>
            )}

            {/* Quiz Ended Section */}
            {!isActive && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-green-900 mb-2">
                    Quiz Completed Successfully!
                  </h3>
                  <p className="text-green-700 mb-4">
                    All questions have been answered. You can view the final
                    results below.
                  </p>
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={handleViewLeaderboard}
                      className="px-6 py-3 bg-green-600 text-white hover:bg-green-700 transition-colors font-medium rounded-lg"
                    >
                      View Final Leaderboard
                    </button>
                    <button
                      onClick={handleBackToPortal}
                      className="px-6 py-3 bg-white text-green-700 border border-green-300 hover:bg-green-50 transition-colors font-medium rounded-lg"
                    >
                      Back to Quiz Portal
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Response Graph Section */}
          <div className="bg-white border border-gray-100 shadow-sm p-8 rounded-xl">
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              Response Analytics
            </h2>

            {isQuestionActive ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
                <h3 className="text-xl font-light text-gray-900 mb-4">
                  Collecting responses...
                </h3>
                <p className="text-gray-600 mb-6">
                  Participants are answering the current question
                </p>

                {/* Live response counter */}
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 max-w-md mx-auto">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {Object.values(voteCounts).reduce(
                          (sum, c) => sum + (c as number),
                          0
                        )}
                      </div>
                      <p className="text-sm text-blue-700">Responses</p>
                    </div>
                    <div className="text-blue-400">
                      <svg
                        className="w-6 h-6"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">
                        {participants.length}
                      </div>
                      <p className="text-sm text-blue-700">Total</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-500"
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
                      />
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {participants.length > 0
                        ? Math.round(
                            (Object.values(voteCounts).reduce(
                              (sum, c) => sum + (c as number),
                              0
                            ) /
                              participants.length) *
                              100
                          )
                        : 0}
                      % responded
                    </p>
                  </div>
                </div>
              </div>
            ) : currentQuestion || (!isActive && currentIndex >= 0) ? (
              <div className="space-y-6">
                {!isActive && currentIndex < 0 && (
                  <div className="text-center py-8 mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Quiz Results Summary
                    </h3>
                    <p className="text-gray-600">
                      The quiz has ended. Below are the results from the last
                      question.
                    </p>
                  </div>
                )}
                {(() => {
                  const questionToShow =
                    currentQuestion ||
                    questions[Math.max(0, currentIndex)] ||
                    questions[questions.length - 1];
                  if (!questionToShow) return null;

                  const correctKeys = new Set(
                    (questionToShow?.options || [])
                      .filter((o) => o.isCorrect)
                      .map((o) => o.key)
                  );
                  const total = Object.values(voteCounts).reduce(
                    (sum, c) => sum + (c as number),
                    0
                  );
                  const maxVotes = Math.max(
                    ...Object.values(voteCounts).map((c) => c as number),
                    1
                  );

                  return (questionToShow?.options || []).map((option) => {
                    const count = voteCounts[option.key] || 0;
                    const percentage =
                      total > 0 ? Math.round((count / total) * 100) : 0;
                    const barWidth =
                      maxVotes > 0 ? (count / maxVotes) * 100 : 0;
                    const isCorrect = correctKeys.has(option.key);

                    return (
                      <div key={option.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                isCorrect
                                  ? "bg-green-500 text-white"
                                  : "bg-gray-400 text-white"
                              }`}
                            >
                              {option.key}
                            </span>
                            <span className="text-gray-900 font-medium">
                              {option.text}
                            </span>
                            {isCorrect && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                Correct
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className="text-gray-600 font-medium">
                              {count} vote{count !== 1 ? "s" : ""}
                            </span>
                            <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium min-w-[60px] text-center">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-1000 ease-out ${
                              isCorrect
                                ? "bg-gradient-to-r from-green-400 to-green-600"
                                : "bg-gradient-to-r from-gray-400 to-gray-600"
                            }`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  });
                })()}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="text-center text-gray-600">
                    <p className="text-lg font-medium">
                      Total Responses:{" "}
                      {Object.values(voteCounts).reduce(
                        (sum, c) => sum + (c as number),
                        0
                      )}
                    </p>
                    <p className="text-sm">
                      Participants: {participants.length}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <h3 className="text-xl font-light text-gray-900 mb-2">
                  No active question
                </h3>
                <p className="text-gray-600">
                  Push a question to start seeing responses
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
