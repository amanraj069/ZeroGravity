"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import NextImage from "next/image";
import {
  getQuiz,
  listParticipants,
  pushQuestion,
  startQuiz,
  leaderboard,
  endQuiz,
  hostQuiz,
  unhostQuiz,
} from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { useAuth } from "@/contexts/AuthContext";
import { Quiz, QuizParticipant, QuizLeaderboardEntry } from "@/types/quiz";
import QRCode from "qrcode";
import { ChevronUp, X } from "lucide-react";

export default function HostQuizPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({});
  const [board, setBoard] = useState<QuizLeaderboardEntry[]>([]);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isHosted, setIsHosted] = useState<boolean>(false);
  const [generatedJoinCode, setGeneratedJoinCode] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [, setCurrentQuestionTimeLimit] = useState<number>(0);
  const [viewMode, setViewMode] = useState<
    "control" | "results" | "leaderboard"
  >("control");
  const [showQRPopup, setShowQRPopup] = useState<boolean>(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [isParticipantsPanelOpen, setIsParticipantsPanelOpen] =
    useState<boolean>(false);

  const questions = useMemo(() => quiz?.questions || [], [quiz]);
  const activeJoinCode = isHosted ? generatedJoinCode : "";

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
        const hosted =
          q.quiz?.status === "published" || q.quiz?.status === "active";
        setIsActive(q.quiz?.status === "active");
        setIsHosted(hosted);
        setCurrentIndex(q.quiz?.currentQuestionIndex ?? -1);
        setGeneratedJoinCode(q.quiz?.joinCode || "");

        // Recovery path: if quiz is hosted but join code is missing, generate one again.
        if (hosted && !q.quiz?.joinCode) {
          const hostedAgain = await hostQuiz(quizId);
          if (hostedAgain?.success && hostedAgain?.joinCode) {
            setGeneratedJoinCode(hostedAgain.joinCode);
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

    // Fallback: Poll for participants every 5 seconds whenever quiz is hosted.
    const pollParticipants = async () => {
      if (isHosted) {
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
        setCurrentQuestionTimeLimit(payload.timeLimit);
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
      setViewMode("control");
      (async () => {
        const [b, q] = await Promise.all([
          leaderboard(quizId),
          getQuiz(quizId),
        ]);
        if (b?.success) setBoard(b.leaderboard);
        if (q?.success) {
          setQuiz(q.quiz);
          const hosted =
            q.quiz?.status === "published" || q.quiz?.status === "active";
          setIsHosted(hosted);
          setGeneratedJoinCode(q.quiz?.joinCode || "");
        }
      })();
    };
    const onUnhosted = (payload: { quizId: string }) => {
      if (payload?.quizId !== quizId) return;
      setIsHosted(false);
      setIsActive(false);
      setGeneratedJoinCode("");
      setParticipants([]);
      setCurrentIndex(-1);
      setVoteCounts({});
      setBoard([]);
      setShowQRPopup(false);
    };
    const onParticipantsCleared = (payload: { quizId: string }) => {
      if (payload?.quizId !== quizId) return;
      setParticipants([]);
    };
    const onQuestionTimeUp = () => {
      // Instantly update leaderboard and participants when question timer ends
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
    s.on("quiz:unhosted", onUnhosted);
    s.on("participants:cleared", onParticipantsCleared);
    s.on("question:timeup", onQuestionTimeUp);
    return () => {
      clearInterval(pollInterval);
      s.off("quiz:started", onStarted);
      s.off("participant:joined", onJoined);
      s.off("question:pushed", onQuestion);
      s.off("votes:update", onVotes);
      s.off("quiz:ended", onEnded);
      s.off("quiz:unhosted", onUnhosted);
      s.off("participants:cleared", onParticipantsCleared);
      s.off("question:timeup", onQuestionTimeUp);
    };
  }, [quizId, isHosted, isActive]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

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
      setGeneratedJoinCode(r.joinCode || "");

      // If API response misses joinCode, fetch latest quiz snapshot as fallback.
      if (!r.joinCode) {
        const q = await getQuiz(quizId);
        if (q?.success) {
          setGeneratedJoinCode(q.quiz?.joinCode || "");
        }
      }
    }
  };

  const start = async () => {
    const r = await startQuiz(quizId);
    if (!r?.success) alert("Failed to start quiz");
    else setIsActive(true);
  };

  const copyJoinCode = async () => {
    if (activeJoinCode) {
      try {
        await navigator.clipboard.writeText(activeJoinCode);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error("Failed to copy join code:", err);
      }
    }
  };

  const generateQRCode = async () => {
    const code = activeJoinCode;
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

  const pushNextQuestion = async () => {
    const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1;
    if (nextIndex >= questions.length) return;
    await push(nextIndex);
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
      setShowQRPopup(false);
      setParticipants([]);
      setCurrentIndex(-1);
      setVoteCounts({});
      setBoard([]);
    }
  };

  const refreshParticipants = async () => {
    const p = await listParticipants(quizId);
    if (p?.success) {
      setParticipants(p.participants);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto p-3 sm:p-6 pb-24 lg:pb-6 space-y-4 sm:space-y-6">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Participants Panel - 55% width */}
            <div className="hidden lg:block w-full lg:w-[55%]">
              {/* Participants List with Avatars */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-4 sm:p-8 h-[48dvh] lg:h-[85dvh] min-h-[320px] flex flex-col rounded-xl">
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-b border-gray-200 dark:border-gray-700 pb-3 sm:pb-4">
                  <h2 className="text-xl sm:text-2xl font-light text-gray-900 dark:text-white">
                    Participants
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={refreshParticipants}
                      className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors rounded-lg"
                      title="Refresh participants list"
                    >
                      <svg
                        className="w-3.5 h-3.5 mr-1.5 sm:mr-2"
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
                    <span className="inline-flex items-center bg-gray-50 dark:bg-gray-700 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg">
                      {participants.length} joined
                    </span>
                  </div>
                </div>

                {/* Avatar Grid Layout - newest participants at beginning */}
                <div className="flex-1 min-h-0 overflow-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 pr-1 sm:pr-2">
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
                              <div className="w-20 h-20 sm:w-24 sm:h-24 xl:w-28 xl:h-28 aspect-square overflow-hidden shadow-lg flex-shrink-0 border-2 border-gray-200 dark:border-gray-600 rounded-full">
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
                                className={`w-20 h-20 sm:w-24 sm:h-24 xl:w-28 xl:h-28 aspect-square overflow-hidden flex items-center justify-center text-white text-2xl sm:text-3xl leading-none font-medium shadow-lg flex-shrink-0 rounded-full ${getAvatarColor(
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
                              className="absolute top-0 right-0 w-8 h-8 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg border-2 border-white dark:border-gray-800 rounded-full z-10"
                              title={`Remove ${p.participantName}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2 sm:mt-3 truncate w-full font-medium">
                            {p.participantName}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {participants.length === 0 && (
                  <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="text-center">
                      <p className="text-base font-light mb-2 text-gray-500 dark:text-gray-400">
                        {isHosted
                          ? "Waiting for participants..."
                          : "Host the quiz to let people join"}
                      </p>
                      {!isHosted && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
                          Use the Host Quiz button in the control panel.
                        </p>
                      )}
                      {activeJoinCode && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 font-light">
                          Share code:{" "}
                          <span className="font-mono">{activeJoinCode}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {participants.length > 0 && (
                  <button
                    className="w-full mt-3 sm:mt-4 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-600 text-xs sm:text-sm text-gray-700 dark:text-gray-300 hover:border-red-300 dark:hover:border-red-700 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-light rounded-lg"
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
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-3 sm:p-4 h-[calc(100dvh-155px)] lg:min-h-[560px] lg:h-[85dvh] flex flex-col overflow-auto rounded-xl">
                {/* Quiz Info (moved from top header) */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-light text-gray-900 dark:text-white tracking-tight">
                        {quiz?.title || "Host Quiz"}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                        {quiz?.description || "Ready to host your quiz?"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      {!isHosted ? (
                        <button
                          className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light rounded-lg"
                          onClick={host}
                        >
                          Host Quiz
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 sm:gap-3">
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
                                className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-sm rounded-lg"
                                title="Stop hosting quiz"
                              >
                                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-white"></div>
                              </button>
                              <button
                                className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light rounded-lg"
                                onClick={start}
                              >
                                Start Quiz
                              </button>
                            </>
                          ) : (
                            <button
                              className="px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm bg-red-600 text-white hover:bg-red-700 transition-colors font-light rounded-lg"
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

                  {activeJoinCode && (
                    <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-light text-gray-700 dark:text-gray-400 mb-0.5">
                            Quiz Join Code
                          </p>
                          <p className="text-lg sm:text-xl tracking-widest font-mono font-light text-gray-900 dark:text-white">
                            {activeJoinCode}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={copyJoinCode}
                            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs border transition-colors font-light rounded-lg ${
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
                            className="px-2 sm:px-2.5 py-1 sm:py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-black dark:hover:border-white transition-colors font-light bg-white dark:bg-gray-800 rounded-lg"
                            aria-label="Show QR code"
                            title="Show QR code for easy joining"
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
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-500 mt-1 sm:mt-1.5 font-light">
                        Share this code with participants to join your quiz
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <span className="inline-flex items-center gap-2 bg-gray-50 dark:bg-gray-900 px-3 py-2 sm:py-3 text-[11px] sm:text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 w-full sm:w-[40%] rounded-lg">
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
                    <span className="inline-flex items-center bg-white dark:bg-gray-800 px-3 py-2 sm:py-3 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 w-full sm:w-[60%] rounded-lg">
                      {participants.length} participant
                      {participants.length !== 1 ? "s" : ""} joined
                    </span>
                  </div>
                </div>

                {/* Admin Settings Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mt-3 sm:mt-4">
                  <h3 className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-2 sm:mb-3 flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                  <div className="space-y-1.5 sm:space-y-2">
                    <button
                      onClick={() =>
                        router.push(
                          `/quizzes/create?quizId=${quizId}&edit=true`,
                        )
                      }
                      className="w-full flex items-center justify-between px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors rounded-lg"
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
                        if (!activeJoinCode) return;
                        const link = `${window.location.origin}/joinQuiz?code=${activeJoinCode}`;
                        navigator.clipboard.writeText(link);
                        alert("Quiz link copied to clipboard!");
                      }}
                      className="w-full flex items-center justify-between px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors rounded-lg"
                      disabled={!activeJoinCode}
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
                      onClick={() => router.push(`/leaderboard/${quizId}`)}
                      className="w-full flex items-center justify-between px-3 sm:px-4 py-2 text-[11px] sm:text-xs text-left bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 transition-colors rounded-lg"
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

                {/* Control mode: single CTA to control flow in the dedicated panel */}
                {viewMode === "control" && (
                  <div className="space-y-2 sm:space-y-3 border-t border-gray-200 dark:border-gray-700 pt-3 sm:pt-4 mt-auto text-center flex flex-col items-center justify-center">
                    <h2 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mt-2 sm:mt-4 mb-1">
                      Quiz Flow Control
                    </h2>
                    <p className="text-[11px] sm:text-xs font-light text-gray-600 dark:text-gray-400 max-w-sm mb-2 sm:mb-4">
                      Go to the Control Panel to manage questions, view live
                      responses, and control the pace of the quiz.
                    </p>
                    <button
                      className={`px-5 sm:px-6 py-2.5 sm:py-3 font-light text-xs sm:text-sm border transition-colors rounded-lg ${
                        isHosted
                          ? "bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 border-black dark:border-white"
                          : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (currentIndex < 0 && isActive) {
                          pushNextQuestion();
                        } else {
                          router.push(`/hosted/${quizId}`);
                        }
                      }}
                      disabled={!isHosted}
                    >
                      {currentIndex < 0 && isActive
                        ? "Push First Question"
                        : "Go to Control Panel"}
                    </button>
                  </div>
                )}

                {/* Results mode: histogram with correct/incorrect colors */}
                {viewMode === "results" && currentIndex >= 0 && (
                  <div className="space-y-3 sm:space-y-5 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 mt-auto">
                    <div className="text-center">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                        Responses - Question {currentIndex + 1}
                      </h2>
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        className="px-4 sm:px-6 py-2 sm:py-3 font-light text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                        onClick={() => setViewMode("leaderboard")}
                      >
                        View Leaderboard
                      </button>
                      <button
                        className="px-4 sm:px-6 py-2 sm:py-3 font-light text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
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
                                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-3 py-1 text-sm font-light rounded-lg">
                                    {pct}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-3 bg-gray-200 dark:bg-gray-700 overflow-hidden rounded-lg">
                                <div
                                  className={`h-3 rounded-lg ${
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
                  <div className="space-y-3 sm:space-y-5 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-5 mt-auto">
                    <div className="text-center">
                      <h2 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white">
                        Leaderboard
                      </h2>
                    </div>
                    <div className="flex items-center justify-center">
                      <button
                        className="px-4 sm:px-6 py-2 sm:py-3 font-light text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg"
                        onClick={() => setViewMode("control")}
                      >
                        Go back to quiz
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[30dvh] overflow-auto">
                      {board
                        .slice()
                        .sort(
                          (a, b) => (b.totalScore || 0) - (a.totalScore || 0),
                        )
                        .map((b, idx) => {
                          const isDeleted = !!b.isDeleted;
                          return (
                            <div
                              key={b.quizUserId}
                              className={`flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg ${
                                isDeleted
                                  ? "bg-gray-100 dark:bg-gray-800/70 opacity-70"
                                  : "bg-gray-50 dark:bg-gray-900"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 flex items-center justify-center text-sm font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg">
                                  {idx + 1}
                                </div>
                                <span
                                  className={`text-sm font-light ${
                                    isDeleted
                                      ? "text-gray-500 dark:text-gray-400 line-through"
                                      : "text-gray-900 dark:text-white"
                                  }`}
                                >
                                  {b.participantName}
                                </span>
                                {isDeleted && (
                                  <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg">
                                    Left
                                  </span>
                                )}
                              </div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-sm font-light text-gray-700 dark:text-gray-400">
                                  {Math.round(b.totalScore || 0)}
                                </span>
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                                  pts
                                </span>
                              </div>
                            </div>
                          );
                        })}
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

      {/* Mobile Participants Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        <div className="mx-3 mb-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden">
          <button
            onClick={() => setIsParticipantsPanelOpen((prev) => !prev)}
            className="w-full px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between"
          >
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Participants ({participants.length})
            </span>
            <ChevronUp
              className={`w-4 h-4 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${
                isParticipantsPanelOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {isParticipantsPanelOpen && (
            <div className="max-h-[42vh] overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {participants.length} joined
                </span>
                <button
                  onClick={refreshParticipants}
                  className="inline-flex items-center bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-[11px] text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors rounded-lg"
                  title="Refresh participants list"
                >
                  Refresh
                </button>
              </div>

              {participants.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {participants
                    .slice()
                    .reverse()
                    .map((p) => (
                      <div
                        key={p.quizUserId}
                        className="flex flex-col items-center text-center"
                      >
                        {p.participantAvatar ? (
                          <div className="w-14 h-14 aspect-square overflow-hidden border border-gray-200 dark:border-gray-600 rounded-full">
                            <NextImage
                              src={`/quiz/avatars/${p.participantAvatar}`}
                              alt={`Avatar for ${p.participantName}`}
                              className="w-full h-full object-cover"
                              width={56}
                              height={56}
                            />
                          </div>
                        ) : (
                          <div
                            className={`w-14 h-14 aspect-square overflow-hidden flex items-center justify-center text-white text-lg leading-none font-medium rounded-full ${getAvatarColor(
                              p.participantName || "U",
                            )}`}
                          >
                            {p.participantName?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <span className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 truncate w-full">
                          {p.participantName}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                    {isHosted
                      ? "Waiting for participants..."
                      : "Host the quiz to let people join"}
                  </p>
                  {!isHosted && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light mt-1">
                      Tap Host Quiz in the control panel.
                    </p>
                  )}
                  {activeJoinCode && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-light mt-1">
                      Share code: {activeJoinCode}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Popup Modal */}
      {showQRPopup && (
        <div
          className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50"
          onClick={() => setShowQRPopup(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 p-8 shadow-xl max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-700 rounded-xl"
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
                  Code: {activeJoinCode}
                </p>
              </div>

              {qrCodeDataUrl && (
                <div className="flex justify-center mb-6">
                  <NextImage
                    src={qrCodeDataUrl}
                    alt="QR Code for joining quiz"
                    className="border border-gray-200 dark:border-gray-700 rounded-lg"
                    width={200}
                    height={200}
                  />
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => {
                    const code = activeJoinCode;
                    if (code) {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/joinQuiz?code=${code}`,
                      );
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 transition-colors font-light rounded-lg"
                >
                  Copy Join Link
                </button>
                <button
                  onClick={() => setShowQRPopup(false)}
                  className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light rounded-lg"
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
