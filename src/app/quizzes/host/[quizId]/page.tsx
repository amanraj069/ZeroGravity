"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import {
  getQuiz,
  listParticipants,
  pushQuestion,
  startQuiz,
  leaderboard,
  endQuiz,
  endQuestion,
  hostQuiz,
  unhostQuiz,
} from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { useAuth } from "@/contexts/AuthContext";
import { Quiz, QuizParticipant, QuizLeaderboardEntry } from "@/types/quiz";
import QRCode from "qrcode";

export default function HostQuizPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const params = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");
  const joinCode = search.get("code") || "";

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [board, setBoard] = useState<QuizLeaderboardEntry[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isHosted, setIsHosted] = useState<boolean>(false);
  const [generatedJoinCode, setGeneratedJoinCode] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [currentQuestionTimeLeft, setCurrentQuestionTimeLeft] =
    useState<number>(0);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] =
    useState<Date | null>(null);
  const [currentQuestionTimeLimit, setCurrentQuestionTimeLimit] =
    useState<number>(0);
  const [viewMode, setViewMode] = useState<
    "control" | "results" | "leaderboard"
  >("control");
  const [showQRPopup, setShowQRPopup] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const questions = useMemo(() => quiz?.questions || [], [quiz]);

  // Function to generate consistent colors for avatars
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-pink-400",
      "bg-orange-400",
      "bg-red-400",
      "bg-purple-400",
      "bg-blue-400",
      "bg-green-400",
      "bg-yellow-400",
      "bg-indigo-400",
      "bg-cyan-400",
      "bg-teal-400",
      "bg-lime-400",
      "bg-rose-400",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (!quizId) return;
    (async () => {
      const q = await getQuiz(quizId);
      if (q?.success) {
        setQuiz(q.quiz);
        setIsActive(q.quiz?.status === "active");
        setIsHosted(
          q.quiz?.status === "published" || q.quiz?.status === "active",
        );
        if (q.quiz?.joinCode) {
          setGeneratedJoinCode(q.quiz.joinCode);
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
    const onJoined = (payload: {
      quizId: string;
      participant: QuizParticipant;
    }) => {
      if (payload?.quizId !== quizId) return;
      console.log("New participant joined:", payload.participant);
      setParticipants((prev) => {
        // Check if participant already exists to avoid duplicates
        const exists = prev.find(
          (p) => p.quizUserId === payload.participant.quizUserId,
        );
        if (exists) {
          console.log("Participant already exists, skipping duplicate");
          return prev;
        }
        console.log("Adding new participant to list");
        return [...prev, payload.participant];
      });
    };

    // Fallback: Poll for participants every 5 seconds when quiz is hosted but not active
    const pollParticipants = async () => {
      if (isHosted && !isActive) {
        try {
          const p = await listParticipants(quizId);
          if (p?.success) {
            setParticipants(p.participants);
          }
        } catch (error) {
          console.error("Failed to poll participants:", error);
        }
      }
    };

    const pollInterval = setInterval(pollParticipants, 5000);

    const onQuestion = (payload: {
      quizId: string;
      index: number;
      startTime?: string;
      timeLimit?: number;
    }) => {
      if (payload?.quizId !== quizId) return;
      setCurrentIndex(payload.index);
      setVoteCounts({});
      setViewMode("control");

      if (payload.startTime && payload.timeLimit) {
        setCurrentQuestionStartTime(new Date(payload.startTime));
        setCurrentQuestionTimeLimit(payload.timeLimit);
        // Calculate initial remaining time
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

      // Update participants list when votes come in (real-time leaderboard update)
      (async () => {
        const p = await listParticipants(quizId);
        if (p?.success) setParticipants(p.participants);
      })();
    };
    const onStarted = () => {
      setIsActive(true);
    };
    const onEnded = () => {
      setCurrentIndex(-1);
      setIsActive(false);
      (async () => {
        const b = await leaderboard(quizId);
        if (b?.success) setBoard(b.leaderboard);
      })();
    };
    const onQuestionTimeUp = () => {
      // Instantly update leaderboard and participants when question timer ends
      setCurrentQuestionTimeLeft(0);
      setViewMode("results");
      (async () => {
        const [b, p] = await Promise.all([
          leaderboard(quizId),
          listParticipants(quizId),
        ]);
        if (b?.success) setBoard(b.leaderboard);
        if (p?.success) setParticipants(p.participants);
      })();
    };
    s.on("quiz:started", onStarted);
    s.on("participant:joined", onJoined);
    s.on("question:pushed", onQuestion);
    s.on("votes:update", onVotes);
    s.on("quiz:ended", onEnded);
    s.on("question:timeup", onQuestionTimeUp);
    return () => {
      clearInterval(pollInterval);
      s.off("quiz:started", onStarted);
      s.off("participant:joined", onJoined);
      s.off("question:pushed", onQuestion);
      s.off("votes:update", onVotes);
      s.off("quiz:ended", onEnded);
      s.off("question:timeup", onQuestionTimeUp);
    };
  }, [quizId, isHosted, isActive]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  // Timer for host display
  useEffect(() => {
    if (currentQuestionStartTime && currentQuestionTimeLimit > 0) {
      const timer = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - currentQuestionStartTime.getTime()) / 1000,
        );
        const remaining = Math.max(0, currentQuestionTimeLimit - elapsed);
        setCurrentQuestionTimeLeft(remaining);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [currentQuestionStartTime, currentQuestionTimeLimit]);

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

  const host = async () => {
    const r = await hostQuiz(quizId);
    if (!r?.success) {
      alert("Failed to host quiz");
    } else {
      setIsHosted(true);
      setGeneratedJoinCode(r.joinCode);
    }
  };

  const start = async () => {
    const r = await startQuiz(quizId);
    if (!r?.success) alert("Failed to start quiz");
    else setIsActive(true);
  };

  const copyJoinCode = async () => {
    if (generatedJoinCode) {
      try {
        await navigator.clipboard.writeText(generatedJoinCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy join code:", err);
      }
    }
  };

  const generateQRCode = async () => {
    const code = generatedJoinCode || joinCode;
    if (!code) return;

    try {
      const joinUrl = `${window.location.origin}/joinQuiz?code=${code}`;
      const qrDataUrl = await QRCode.toDataURL(joinUrl, {
        width: 320,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrCodeDataUrl(qrDataUrl);
      setShowQRPopup(true);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
    }
  };

  const push = async (idx: number) => {
    const r = await pushQuestion(quizId, idx);
    if (!r?.success) alert("Failed to push question");
    else {
      setViewMode("control");
      // Redirect to hosted page when first question is pushed
      if (idx === 0) {
        router.push(`/hosted/${quizId}`);
      }
    }
  };

  const stop = async () => {
    const r = await endQuiz(quizId);
    if (!r?.success) alert("Failed to stop quiz");
    else setIsActive(false);
  };

  const unhost = async () => {
    const r = await unhostQuiz(quizId);
    if (!r?.success) {
      alert("Failed to unhost quiz");
    } else {
      setIsHosted(false);
      setIsActive(false);
      setGeneratedJoinCode("");
      setParticipants([]);
      setCurrentIndex(-1);
      setVoteCounts({});
      setBoard([]);
    }
  };

  const endCurrentQuestion = async () => {
    const r = await endQuestion(quizId);
    if (!r?.success) {
      alert("Failed to end question");
    } else {
      // Instantly update UI
      setCurrentQuestionTimeLeft(0);
      setViewMode("results");

      // Check if this was the last question (quiz auto-ended)
      if (r.isLastQuestion) {
        // Quiz was automatically ended, update UI accordingly
        setIsActive(false);
        setCurrentIndex(-1);
      }

      // Update leaderboard and participants immediately
      const [b, p] = await Promise.all([
        leaderboard(quizId),
        listParticipants(quizId),
      ]);
      if (b?.success) setBoard(b.leaderboard);
      if (p?.success) setParticipants(p.participants);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(1, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const pushNextQuestion = async () => {
    const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1;
    if (nextIndex >= questions.length) return;
    await push(nextIndex);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Participants Panel - 55% width */}
            <div className="w-full lg:w-[55%]">
              {/* Participants List with Avatars */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-8 h-[85vh] flex flex-col">
                <div className="mb-6 flex items-end justify-between border-b border-gray-200 dark:border-gray-700 pb-4">
                  <h2 className="text-2xl font-light text-gray-900 dark:text-white">
                    Participants
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={async () => {
                        console.log("Manually refreshing participants...");
                        const p = await listParticipants(quizId);
                        if (p?.success) {
                          setParticipants(p.participants);
                          console.log(
                            "Participants refreshed:",
                            p.participants.length,
                          );
                        }
                      }}
                      className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                      title="Refresh participants list"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh
                    </button>
                    <span className="inline-flex items-center bg-gray-50 dark:bg-gray-700 px-3 py-1 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                      {participants.length} joined
                    </span>
                  </div>
                </div>

                {/* Avatar Grid Layout - newest participants at beginning */}
                <div className="flex-1 min-h-0 overflow-auto">
                  <div className="grid grid-cols-3 xl:grid-cols-4 gap-6 pr-2">
                    {participants
                      .slice()
                      .reverse()
                      .map((p) => (
                        <div
                          key={p.quizUserId}
                          className="flex flex-col items-center text-center relative group"
                        >
                          <div className="relative">
                            {p.participantAvatar ? (
                              <div className="w-24 h-24 xl:w-28 xl:h-28 aspect-square overflow-hidden shadow-lg flex-shrink-0 border-2 border-gray-200 dark:border-gray-600">
                                <NextImage
                                  src={`/quiz/avatars/${p.participantAvatar}`}
                                  alt={`Avatar for ${p.participantName}`}
                                  className="w-full h-full object-cover scale-110"
                                  width={112}
                                  height={112}
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-24 h-24 xl:w-28 xl:h-28 aspect-square overflow-hidden flex items-center justify-center text-white text-3xl leading-none font-medium shadow-lg flex-shrink-0 ${getAvatarColor(
                                  p.participantName || "U",
                                )}`}
                              >
                                {p.participantName?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}
                            <button
                              onClick={async () => {
                                const ok = confirm(
                                  `Remove ${p.participantName} from the quiz?`,
                                );
                                if (!ok) return;
                                try {
                                  const { leaveQuiz } =
                                    await import("@/services/quizzesService");
                                  const res = await leaveQuiz(
                                    quizId,
                                    p.quizUserId,
                                  );
                                  if (!res?.success) {
                                    alert("Failed to remove participant");
                                  } else {
                                    setParticipants((prev) =>
                                      prev.filter(
                                        (participant) =>
                                          participant.quizUserId !==
                                          p.quizUserId,
                                      ),
                                    );
                                  }
                                } catch (error) {
                                  console.error(
                                    "Error removing participant:",
                                    error,
                                  );
                                  alert("Failed to remove participant");
                                }
                              }}
                              className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg border-2 border-white dark:border-gray-800"
                              title={`Remove ${p.participantName}`}
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 mt-3 truncate w-full font-medium">
                            {p.participantName}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {participants.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="text-center">
                      <p className="text-base font-light mb-2 text-gray-500 dark:text-gray-400">
                        Waiting for participants...
                      </p>
                      {(joinCode || generatedJoinCode) && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
                          Share code:{" "}
                          <span className="font-mono">
                            {generatedJoinCode || joinCode}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {participants.length > 0 && (
                  <button
                    className="w-full mt-4 px-4 py-3 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-light"
                    onClick={async () => {
                      const ok = confirm(
                        "Clear all participants? This cannot be undone.",
                      );
                      if (!ok) return;
                      const { clearParticipants } =
                        await import("@/services/quizzesService");
                      const res = await clearParticipants(quizId);
                      if (!res?.success) alert("Failed to clear participants");
                      else setParticipants([]);
                    }}
                  >
                    Clear All Participants
                  </button>
                )}
              </div>
            </div>

            {/* Right Panel - Quiz Info and Controls - 45% width */}
            <div className="w-full lg:w-[45%]">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6 h-[85vh] flex flex-col overflow-auto">
                {/* Quiz Info (moved from top header) */}
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                        {quiz?.title || "Host Quiz"}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                        {quiz?.description || "Ready to host your quiz?"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {!isHosted ? (
                        <>
                          <button
                            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:opacity-90 transition-colors font-light flex items-center gap-2"
                            onClick={() =>
                              router.push(
                                `/liveQuiz/host?quizId=${quizId}&title=${encodeURIComponent(quiz?.title || "Quiz")}`,
                              )
                            }
                          >
                            <span className="w-2 h-2 bg-green-400 animate-pulse"></span>
                            Host Live
                          </button>
                          <button
                            className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light"
                            onClick={host}
                          >
                            Host Quiz
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          {!isActive ? (
                            <>
                              <button
                                onClick={async () => {
                                  const ok = confirm(
                                    "Stop hosting this quiz? This will remove the join code and clear all participants.",
                                  );
                                  if (!ok) return;
                                  await unhost();
                                }}
                                className="w-10 h-10 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm"
                                title="Stop hosting quiz"
                              >
                                <div className="w-4 h-4 bg-white"></div>
                              </button>
                              <button
                                className="px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light"
                                onClick={start}
                              >
                                Start Quiz
                              </button>
                            </>
                          ) : (
                            <button
                              className="px-5 py-2.5 bg-red-600 text-white hover:bg-red-700 transition-colors font-light"
                              onClick={stop}
                              title="Stop current quiz"
                            >
                              Stop Quiz
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {(joinCode || generatedJoinCode) && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-5 border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-light text-gray-700 dark:text-gray-400 mb-1">
                            Quiz Join Code
                          </p>
                          <p className="text-2xl tracking-widest font-mono font-light text-gray-900 dark:text-white">
                            {generatedJoinCode || joinCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={copyJoinCode}
                            className={`px-4 py-2 border transition-colors font-light ${
                              copySuccess
                                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                                : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white"
                            }`}
                            aria-label="Copy join code"
                          >
                            {copySuccess ? "✓ Copied" : "Copy Code"}
                          </button>
                          <button
                            onClick={generateQRCode}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white transition-colors font-light bg-white dark:bg-gray-800"
                            aria-label="Show QR code"
                            title="Show QR code for easy joining"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-500 mt-3 font-light">
                        Share this code with participants to join your quiz
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-3 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 w-[40%]">
                      <span
                        className={`inline-block h-2 w-2 ${
                          isActive
                            ? "bg-green-500"
                            : isHosted
                              ? "bg-yellow-500"
                              : "bg-gray-400"
                        }`}
                      />
                      {isActive
                        ? "Quiz Active"
                        : isHosted
                          ? "Quiz Hosted"
                          : "Quiz Not Hosted"}
                    </span>
                    <span className="inline-flex items-center bg-white dark:bg-gray-800 px-3 py-3 text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 w-[60%]">
                      {participants.length} participant
                      {participants.length !== 1 ? "s" : ""} joined
                    </span>
                  </div>
                </div>

                {/* Admin Settings Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-5">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Quiz Settings
                  </h3>
                  <div className="space-y-3">
                    <button
                      onClick={() =>
                        router.push(`/quizzes/create?edit=${quizId}`)
                      }
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      disabled={isActive}
                    >
                      <span className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Edit Questions
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/joinQuiz?code=${generatedJoinCode || joinCode}`;
                        navigator.clipboard.writeText(link);
                        alert("Quiz link copied to clipboard!");
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                      disabled={!isHosted}
                    >
                      <span className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                          />
                        </svg>
                        Share Quiz Link
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={async () => {
                        const b = await leaderboard(quizId);
                        if (b?.success) {
                          setBoard(b.leaderboard);
                          setViewMode("leaderboard");
                        }
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                    >
                      <span className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        View Leaderboard
                      </span>
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Control mode: single CTA to push/stop with timer */}
                {viewMode === "control" && (
                  <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5 mt-auto">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Question Control
                      </h2>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-light">
                        {questions.length} question
                        {questions.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Push first or next question */}
                    {currentIndex < 0 ? (
                      <div className="flex justify-center">
                        <button
                          className={`px-6 py-3 font-light text-sm ${
                            isActive
                              ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                          }`}
                          onClick={() => push(0)}
                          disabled={!isActive || questions.length === 0}
                        >
                          Push first question to users
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-4">
                        <button
                          className={`px-6 py-3 font-light text-sm ${
                            currentQuestionTimeLeft > 0
                              ? "bg-red-600 text-white hover:bg-red-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                          }`}
                          onClick={endCurrentQuestion}
                          disabled={currentQuestionTimeLeft === 0}
                          title="Stop current question"
                        >
                          Stop
                        </button>
                        <div className="text-xl font-mono font-light text-gray-900 dark:text-white">
                          {formatTime(currentQuestionTimeLeft)}
                        </div>
                      </div>
                    )}

                    {/* After a question ended, show Next CTA */}
                    {currentIndex >= 0 && currentQuestionTimeLeft === 0 && (
                      <div className="flex items-center justify-center gap-3">
                        <button
                          className={`px-6 py-3 font-light text-sm ${
                            currentIndex + 1 < questions.length
                              ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                          }`}
                          onClick={pushNextQuestion}
                          disabled={currentIndex + 1 >= questions.length}
                        >
                          Push next question
                        </button>
                        <button
                          className="px-6 py-3 font-light text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          onClick={() => setViewMode("results")}
                        >
                          View responses
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Results mode: histogram with correct/incorrect colors */}
                {viewMode === "results" && currentIndex >= 0 && (
                  <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5 mt-auto">
                    <div className="text-center">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Responses - Question {currentIndex + 1}
                      </h2>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        className="px-6 py-3 font-light text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setViewMode("leaderboard")}
                      >
                        View Leaderboard
                      </button>
                      <button
                        className="px-6 py-3 font-light text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setViewMode("control")}
                      >
                        Go back to quiz
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const q = questions[currentIndex];
                        const correctKeys = new Set(
                          (q?.options || [])
                            .filter((o) => o.isCorrect)
                            .map((o) => o.key),
                        );
                        const total = Object.values(voteCounts).reduce(
                          (sum, c) => sum + (c as number),
                          0,
                        );
                        const entries = (q?.options || []).map((o) => {
                          const count = voteCounts[o.key] || 0;
                          const pct =
                            total > 0 ? Math.round((count / total) * 100) : 0;
                          const isCorrect = correctKeys.has(o.key);
                          return {
                            key: o.key,
                            text: o.text,
                            count,
                            pct,
                            isCorrect,
                          };
                        });
                        return entries.map(
                          ({ key, text, count, pct, isCorrect }) => (
                            <div key={key} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-base font-light text-gray-900 dark:text-white">
                                  {key}. {text}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-600 dark:text-gray-400 font-light text-sm">
                                    {count} vote{count !== 1 ? "s" : ""}
                                  </span>
                                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 text-sm font-light">
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className={`h-3 ${
                                    isCorrect ? "bg-green-600" : "bg-red-600"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          ),
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Leaderboard full-page view within panel */}
                {viewMode === "leaderboard" && (
                  <div className="space-y-5 border-t border-gray-200 dark:border-gray-700 pt-5 mt-auto">
                    <div className="text-center">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Leaderboard
                      </h2>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        className="px-6 py-3 font-light text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setViewMode("control")}
                      >
                        Go back to quiz
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[30vh] overflow-auto">
                      {board
                        .slice()
                        .sort(
                          (a, b) => (b.totalScore || 0) - (a.totalScore || 0),
                        )
                        .map((b, idx) => (
                          <div
                            key={b.quizUserId}
                            className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-7 h-7 flex items-center justify-center text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {idx + 1}
                              </div>
                              <span className="text-sm font-light text-gray-900 dark:text-white">
                                {b.participantName}
                              </span>
                            </div>
                            <span className="text-sm font-light text-gray-700 dark:text-gray-400">
                              {Math.round(b.totalScore || 0)} pts
                            </span>
                          </div>
                        ))}
                      {board.length === 0 && (
                        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm font-light">
                          No scores yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* QR Code Popup Modal */}
      {showQRPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowQRPopup(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-8 shadow-xl max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-light text-gray-900 dark:text-white">
                Join Quiz QR Code
              </h3>
              <button
                onClick={() => setShowQRPopup(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close QR code popup"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 font-light mb-2">
                  Scan this QR code to join the quiz
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                  Code: {generatedJoinCode || joinCode}
                </p>
              </div>

              {qrCodeDataUrl && (
                <div className="flex justify-center mb-6">
                  <NextImage
                    src={qrCodeDataUrl}
                    alt="QR Code for joining quiz"
                    className="border border-gray-200 dark:border-gray-700"
                    width={200}
                    height={200}
                  />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const code = generatedJoinCode || joinCode;
                    if (code) {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/joinQuiz?code=${code}`,
                      );
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 transition-colors font-light"
                >
                  Copy Join Link
                </button>
                <button
                  onClick={() => setShowQRPopup(false)}
                  className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
