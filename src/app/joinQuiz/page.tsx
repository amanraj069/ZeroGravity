"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import NextImage from "next/image";
import {
  joinQuiz,
  submitAnswer,
  getCurrentQuestion,
  obfuscate,
  deobfuscate,
  leaveQuiz,
} from "@/services/quizzesService";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import LandingNavbar from "@/components/landing/LandingNavbar";
import SimpleFooter from "@/components/landing/SimpleFooter";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { QuizQuestion } from "@/services/quizzesService";

function JoinQuizContent() {
  const search = useSearchParams();
  const prefill = search.get("code") || "";
  const [joinCode, setJoinCode] = useState(prefill);
  const [name, setName] = useState<string>("");
  const [selectedAvatar, setSelectedAvatar] = useState<string>("");
  const [showAvatarError, setShowAvatarError] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Available avatars
  const avatars = [
    "Avatar1.png",
    "Avatar2.png",
    "Avatar3.png",
    "Avatar4.png",
    "Avatar5.png",
    "Avatar6.png",
    "Avatar7.png",
    "Avatar8.png",
    "Avatar9.png",
    "Avatar10.png",
    "Avatar11.png",
    "Avatar12.png",
  ];
  const STORAGE_KEY = "zg_current_quiz";
  const [joined, setJoined] = useState<{
    quizId: string;
    quizUserId: string;
  } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const [showQuizEnded, setShowQuizEnded] = useState<boolean>(false);
  const [showKickedOut, setShowKickedOut] = useState<boolean>(false);
  const [serverStartTime, setServerStartTime] = useState<Date | null>(null);
  const [serverTimeLimit, setServerTimeLimit] = useState<number>(0);
  const [isRestoredSession, setIsRestoredSession] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hydration-safe initialization
  useEffect(() => {
    setMounted(true);

    // Initialize name from localStorage
    try {
      const o = localStorage.getItem("zg_name_obf");
      if (o) {
        setName(deobfuscate(o));
      }
    } catch {
      // Ignore errors
    }

    // Initialize avatar from localStorage
    try {
      const savedAvatar = localStorage.getItem("zg_avatar");
      if (savedAvatar) {
        setSelectedAvatar(savedAvatar);
      }
    } catch {
      // Ignore errors
    }

    // Initialize joined state from localStorage
    try {
      const saved = localStorage.getItem("zg_current_quiz");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.quizId && parsed?.quizUserId) {
          setJoined(parsed);
          setIsRestoredSession(true);
        }
      }
    } catch {
      // Ignore errors
    }
  }, []);

  // Clear avatar error when avatar is selected
  useEffect(() => {
    if (selectedAvatar) {
      setShowAvatarError(false);
      // Immediately save to localStorage when avatar is selected
      try {
        localStorage.setItem("zg_avatar", selectedAvatar);
      } catch {
        // Ignore errors
      }
    }
  }, [selectedAvatar]);

  useEffect(() => {
    // If restored, immediately join the room
    if (joined?.quizId && mounted) {
      joinQuizRoom(joined.quizId);

      // Reset the restored session flag after a short delay
      // This allows normal kicked out functionality to work after initialization
      if (isRestoredSession) {
        const timeoutId = setTimeout(() => {
          setIsRestoredSession(false);
        }, 3000); // 3 seconds should be enough for session restoration

        return () => clearTimeout(timeoutId);
      }
    }
  }, [joined?.quizId, mounted, isRestoredSession]);

  useEffect(() => {
    if (!joined?.quizId) return;
    joinQuizRoom(joined.quizId);
    const s = getSocket();
    const onQuestion = (payload: {
      quizId: string;
      question: QuizQuestion;
      startTime?: string;
      timeLimit?: number;
    }) => {
      if (payload?.quizId !== joined.quizId) return;
      setCurrentQuestion(payload.question);
      setHasAnswered(false);
      setIsTimeUp(false);

      if (payload.startTime && payload.timeLimit) {
        setServerStartTime(new Date(payload.startTime));
        setServerTimeLimit(payload.timeLimit);
        // Calculate initial remaining time
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(payload.startTime).getTime()) / 1000
        );
        const remaining = Math.max(0, payload.timeLimit - elapsed);
        setTimeLeft(remaining);
      } else {
        // Fallback to client-side timer
        setTimeLeft(payload.question.timeLimitSeconds);
        setServerStartTime(null);
        setServerTimeLimit(0);
      }
    };
    const onQuestionTimeUp = () => {
      setIsTimeUp(true);
    };
    const onEnded = () => {
      setCurrentQuestion(null);
      setShowQuizEnded(true);
      setHasAnswered(false);
      setIsTimeUp(false);
      setTimeLeft(0);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };
    const onKickedOut = (payload: {
      quizId: string;
      quizUserId: string;
      participantName: string;
    }) => {
      if (
        payload?.quizId !== joined.quizId ||
        payload?.quizUserId !== joined.quizUserId
      )
        return;

      // Don't show kicked out message immediately after restoring session
      // Give some time for the session to stabilize (only for the first few seconds)
      if (isRestoredSession) {
        console.log(
          "Ignoring participant:left event during session restoration period"
        );
        return;
      }

      console.log("Participant was individually removed by admin");
      setCurrentQuestion(null);
      setShowKickedOut(true);
      setHasAnswered(false);
      setIsTimeUp(false);
      setTimeLeft(0);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };
    const onParticipantsCleared = (payload: { quizId: string }) => {
      if (payload?.quizId !== joined.quizId) return;

      // When admin clears all participants, always show kicked out message
      console.log("All participants were cleared by admin");
      setCurrentQuestion(null);
      setShowKickedOut(true);
      setHasAnswered(false);
      setIsTimeUp(false);
      setTimeLeft(0);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    };
    s.on("question:pushed", onQuestion);
    s.on("question:timeup", onQuestionTimeUp);
    s.on("quiz:ended", onEnded);
    s.on("participant:left", onKickedOut);
    s.on("participants:cleared", onParticipantsCleared);
    // On mount, also fetch current state in case we refreshed mid-question
    (async () => {
      const cur = await getCurrentQuestion(joined.quizId);
      if (cur?.success && cur.index >= 0) {
        setCurrentQuestion(cur.question);
        setHasAnswered(false);
        setIsTimeUp(false);

        if (cur.startTime && cur.timeLimit && cur.remainingTime !== undefined) {
          setServerStartTime(new Date(cur.startTime));
          setServerTimeLimit(cur.timeLimit);
          setTimeLeft(cur.remainingTime);
        } else {
          // Fallback to client-side timer
          setTimeLeft(cur.question.timeLimitSeconds);
          setServerStartTime(null);
          setServerTimeLimit(0);
        }
      }
    })();
    return () => {
      s.off("question:pushed", onQuestion);
      s.off("question:timeup", onQuestionTimeUp);
      s.off("quiz:ended", onEnded);
      s.off("participant:left", onKickedOut);
      s.off("participants:cleared", onParticipantsCleared);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  useEffect(() => {
    if (!currentQuestion) return;
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (serverStartTime && serverTimeLimit > 0) {
        // Use server-side timer synchronization
        const elapsed = Math.floor(
          (new Date().getTime() - serverStartTime.getTime()) / 1000
        );
        const remaining = Math.max(0, serverTimeLimit - elapsed);
        setTimeLeft(remaining);

        if (remaining === 0) {
          setIsTimeUp(true);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
      } else {
        // Fallback to client-side timer
        setTimeLeft((t) => {
          const newTime = Math.max(0, t - 1);
          if (newTime === 0) {
            setIsTimeUp(true);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
          }
          return newTime;
        });
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentQuestion, serverStartTime, serverTimeLimit]);

  const handleJoin = async () => {
    if (!joinCode || !name) return;

    if (!selectedAvatar) {
      setShowAvatarError(true);
      return;
    }

    setShowAvatarError(false);
    const res = await joinQuiz(
      joinCode.trim().toUpperCase(),
      name.trim(),
      selectedAvatar
    );
    if (res?.success) {
      setJoined({ quizId: res.quizId, quizUserId: res.quizUserId });
      setIsRestoredSession(false); // This is a fresh join, not a restored session
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ quizId: res.quizId, quizUserId: res.quizUserId })
        );
        localStorage.setItem("zg_join_code", joinCode.trim().toUpperCase());
        localStorage.setItem("zg_name_obf", obfuscate(name.trim()));
        localStorage.setItem("zg_avatar", selectedAvatar);
      } catch {}
    } else {
      // Check if error is about already being in the quiz
      if (res?.message?.includes("already in this quiz")) {
        alert(`${res.message}`);
        // Optionally: Clear current session so they can try with different name
      } else {
        alert(res?.message || "Failed to join");
      }
    }
  };

  const sendAnswer = async (key: string) => {
    if (
      !joined ||
      !currentQuestion ||
      !currentQuestion.questionId ||
      hasAnswered ||
      isTimeUp
    )
      return;

    setHasAnswered(true);

    const result = await submitAnswer(joined.quizId, {
      quizUserId: joined.quizUserId,
      questionId: currentQuestion.questionId,
      selectedOptionKey: key,
      timeLeftSeconds: timeLeft,
    });
    if (!result?.success) {
      alert("Failed to submit answer");
      setHasAnswered(false);
    }
  };

  const handleExit = async () => {
    // Don't show confirmation dialog if user is already kicked out
    if (showKickedOut) {
      // User is already kicked out, just redirect without confirmation
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("zg_join_code");
        localStorage.removeItem("zg_participant_name");
        localStorage.removeItem("zg_avatar");
      } catch {}
      window.location.href = "/joinQuiz";
      return;
    }

    const confirmExit = window.confirm(
      "Are you sure you want to leave the quiz?"
    );
    if (confirmExit) {
      // If we're currently in a quiz, attempt to remove from backend
      if (joined?.quizId && joined?.quizUserId) {
        try {
          await leaveQuiz(joined.quizId, joined.quizUserId);
        } catch (error) {
          console.error("Failed to leave quiz on backend:", error);
          // Continue with local cleanup even if backend call fails
        }
      }

      try {
        // Clear all quiz-related data from localStorage
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem("zg_join_code");
        localStorage.removeItem("zg_name_obf");
        localStorage.removeItem("zg_avatar");
      } catch {}

      // Reset all state to take user back to entry screen
      setJoined(null);
      setCurrentQuestion(null);
      setShowQuizEnded(false);
      setShowKickedOut(false);
      setHasAnswered(false);
      setIsTimeUp(false);
      setTimeLeft(0);
      setIsRestoredSession(false);
      setSelectedAvatar("");

      // Clear timer if running
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  // Prevent hydration mismatch - show loading until mounted
  if (!mounted) {
    return (
      <ZeroGravityLoading
        title="Initializing ZeroGravity"
        subtitle="Preparing your cosmic experience..."
      />
    );
  }

  if (!joined) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <LandingNavbar />

        {/* Hero-style header */}
        <div className="text-center py-8 lg:py-12 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-black mb-6 tracking-tight">
              Join Quiz
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
              Enter the cosmic quiz realm and test your knowledge among the
              stars
            </p>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center px-6 pt-4 pb-20 min-h-0">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              {/* Form section - First on mobile, Second on desktop */}
              <div className="bg-white/90 backdrop-blur-sm p-8 lg:p-10 border border-black shadow-lg h-auto lg:h-[60vh] flex flex-col justify-center order-1 lg:order-2">
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-4">
                      Quiz Access Code
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 px-6 py-4 text-lg font-light focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all placeholder-gray-500 bg-white shadow-sm"
                      placeholder="Enter 6-letter code"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-4">
                      Your Cosmic Identity
                    </label>
                    <input
                      className="w-full border-2 border-gray-300 px-6 py-4 text-lg font-light focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all placeholder-gray-500 bg-white shadow-sm"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {showAvatarError && (
                    <div className="bg-red-50 border border-red-200 p-3">
                      <p className="text-sm text-red-600 text-center">
                        Please select an avatar to continue
                      </p>
                    </div>
                  )}

                  <button
                    className="w-full bg-black text-white py-4 px-8 text-lg font-medium hover:bg-gray-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black shadow-lg hover:shadow-xl transform hover:translate-y-[-1px]"
                    onClick={handleJoin}
                    disabled={!joinCode.trim() || !name.trim()}
                  >
                    Launch Into Quiz
                  </button>
                </div>
              </div>

              {/* Avatar Selection - Second on mobile, First on desktop */}
              <div className="bg-white/80 backdrop-blur-sm p-6 lg:p-8 border border-black h-[50vh] lg:h-[60vh] flex flex-col order-2 lg:order-1">
                <div className="mb-6">
                  <h3 className="text-xl font-light text-gray-900 mb-2">
                    Choose Your Avatar
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select an avatar to represent you in the quiz
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 p-4">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedAvatar(avatar);
                        }}
                        className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full overflow-hidden transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                          selectedAvatar === avatar
                            ? "border-4 border-orange-600 shadow-lg ring-2 ring-orange-200"
                            : "border-2 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <NextImage
                          src={`/quiz/avatars/${avatar}`}
                          alt={`Avatar ${avatar.replace(".png", "")}`}
                          className="w-full h-full object-cover scale-110"
                          draggable={false}
                          width={100}
                          height={100}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <SimpleFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      {/* Hero-style header section */}
      <div className="bg-white">
        <div className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12">
          {/* Title and Exit Button Row */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-light text-black tracking-tight">
              Quiz Room
            </h1>
            {!showKickedOut && (
              <button
                onClick={handleExit}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-sm font-light transition-colors focus:outline-none focus:ring-2 focus:ring-red-300"
                title="Leave Quiz"
              >
                Exit Quiz
              </button>
            )}
          </div>

          <div className="text-center">
            <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed max-w-2xl mx-auto">
              {currentQuestion && !showQuizEnded && !showKickedOut
                ? "Answer the current question before time runs out"
                : showQuizEnded
                ? "Quiz completed - great job participating!"
                : ""}
            </p>

            {currentQuestion && !showQuizEnded && !showKickedOut && (
              <div className="mt-8">
                {/* Enhanced Timer Display */}
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div
                        className={`w-3 h-3 ${
                          timeLeft <= 10
                            ? "bg-red-500"
                            : timeLeft <= 30
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        } animate-pulse`}
                      ></div>
                      <span className="text-sm text-gray-600 font-medium tracking-wide uppercase">
                        Time Remaining
                      </span>
                    </div>
                  </div>

                  <div
                    className={`relative p-6 border transition-all duration-300 ${
                      timeLeft <= 10
                        ? "bg-red-50 border-red-300"
                        : timeLeft <= 30
                        ? "bg-yellow-50 border-yellow-300"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {/* Timer Display */}
                    <div className="relative text-center">
                      <div
                        className={`text-5xl sm:text-6xl font-mono font-bold tracking-wider mb-4 ${
                          timeLeft <= 10
                            ? "text-red-600"
                            : timeLeft <= 30
                            ? "text-amber-600"
                            : "text-black"
                        }`}
                      >
                        {Math.floor(timeLeft / 60)}:
                        {(timeLeft % 60).toString().padStart(2, "0")}
                      </div>

                      {/* Progress bar */}
                      <div className="w-full">
                        <div className="h-1 bg-gray-200">
                          <div
                            className={`h-full transition-all duration-1000 ease-linear ${
                              timeLeft <= 10
                                ? "bg-red-600"
                                : timeLeft <= 30
                                ? "bg-yellow-600"
                                : "bg-black"
                            }`}
                            style={{
                              width: `${Math.max(
                                0,
                                (timeLeft /
                                  (currentQuestion?.timeLimitSeconds ||
                                    timeLeft)) *
                                  100
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 pb-10">
        <div className="w-full max-w-3xl">
          {showKickedOut ? (
            <div className="text-center pt-8 pb-16">
              <div className="max-w-2xl mx-auto mt-12">
                <h2 className="text-3xl font-light text-red-600 mb-4">
                  You were removed from the quiz
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  The host has removed you from this quiz. You can join another
                  quiz or create your own.
                </p>
                <div className="bg-red-50 p-4 mb-6 border border-red-200">
                  <p className="text-sm text-red-600">
                    You were kicked out by the admin
                  </p>
                </div>
                <button
                  onClick={handleExit}
                  className="bg-black text-white px-6 py-3 font-light hover:bg-gray-800 transition-colors"
                >
                  Return to Quiz Entry
                </button>
              </div>
            </div>
          ) : showQuizEnded ? (
            <div className="text-center pt-8 pb-16">
              <div className="max-w-2xl mx-auto">
                <div className="w-24 h-24 mx-auto mb-8 bg-green-100 flex items-center justify-center">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-3xl font-light text-gray-900 mb-4">
                  Quiz Complete!
                </h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  Thanks for participating! Contact the host to learn about the
                  results.
                </p>
                <div className="bg-gray-50 p-4 mb-6 border border-gray-200">
                  <p className="text-sm text-gray-500">
                    🎉 Great job completing the quiz!
                  </p>
                </div>
                <button
                  onClick={handleExit}
                  className="bg-black text-white px-6 py-3 font-light hover:bg-gray-800 transition-colors"
                >
                  Return to Quiz Entry
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="space-y-4">
              {hasAnswered ? (
                <div className="text-center pt-12 pb-16">
                  <div className="max-w-2xl mx-auto">
                    {/* Success Icon with Animation */}
                    <div className="relative mx-auto mb-8">
                      <div className="w-32 h-32 mx-auto bg-green-100 flex items-center justify-center border border-green-200">
                        <div className="w-16 h-16 bg-green-500 flex items-center justify-center animate-pulse">
                          <svg
                            className="w-8 h-8 text-white"
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
                      </div>
                    </div>

                    <h2 className="text-3xl font-light text-gray-900 mb-6 tracking-tight">
                      Answer Submitted
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                      Great job! Waiting for the next question...
                    </p>

                    {/* Elegant waiting indicator */}
                    <div className="flex items-center justify-center space-x-3 mb-8">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-400 animate-pulse"></div>
                        <div
                          className="w-2 h-2 bg-green-400 animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-green-400 animate-pulse"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500 font-light">
                        Processing...
                      </span>
                    </div>

                    {/* Progress indicator */}
                    <div className="bg-gray-50 p-6 border border-gray-200">
                      <div className="flex items-center justify-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
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
                        <div className="flex-1 h-2 bg-gray-200 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse"></div>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          Submitted
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isTimeUp ? (
                <div className="text-center pt-12 pb-16">
                  <div className="max-w-2xl mx-auto">
                    {/* Enhanced Time's Up Icon */}
                    <div className="relative mx-auto mb-8">
                      <div className="w-32 h-32 mx-auto bg-red-100 flex items-center justify-center border border-red-200">
                        <div className="w-16 h-16 bg-red-500 flex items-center justify-center animate-pulse">
                          <svg
                            className="w-8 h-8 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <h2 className="text-3xl font-light text-red-600 mb-6 tracking-tight">
                      Time&apos;s Up!
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-8">
                      Don&apos;t worry, there&apos;s always the next question.
                    </p>

                    {/* Enhanced waiting message */}
                    <div className="bg-gray-50 p-6 border border-gray-200 mb-8">
                      <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gray-400 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
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
                        <span className="text-gray-700 font-medium">
                          Waiting for next question
                        </span>
                      </div>

                      {/* Animated progress dots */}
                      <div className="flex items-center justify-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 animate-bounce"
                            style={{ animationDelay: "0.4s" }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-500 ml-3">
                          Host is preparing...
                        </span>
                      </div>
                    </div>

                    {/* Encouragement message */}
                    <div className="bg-blue-50 p-4 border border-blue-200">
                      <p className="text-sm text-blue-700 font-medium">
                        🎯 Stay focused! The next question is coming soon.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-8 lg:p-10 border border-gray-200">
                  {/* Question Header */}
                  <div className="mb-8">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 bg-black flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-light text-black leading-relaxed text-center max-w-4xl mx-auto">
                      {currentQuestion.text}
                    </h2>
                  </div>

                  {/* Answer Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:gap-4">
                    {currentQuestion.options.map((o, idx: number) => (
                      <button
                        key={o.key}
                        className="group relative p-5 lg:p-6 text-left transition-all duration-200 border border-gray-200 hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:bg-white"
                        onClick={(e) => {
                          const target = e.currentTarget as HTMLButtonElement;
                          target.className =
                            "group relative p-5 lg:p-6 text-left transition-all duration-200 border border-black bg-black text-white hover:border-black hover:bg-black";
                          sendAnswer(o.key);
                        }}
                        disabled={hasAnswered || isTimeUp}
                      >
                        {/* Option Content */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-bold transition-all duration-200 group-hover:shadow-md">
                            {o.key}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-medium text-gray-900 group-hover:text-gray-700 transition-colors break-words">
                              {o.text}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Answer Instructions */}
                  <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500 font-light">
                      Select your answer by clicking on one of the options above
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center pt-8 pb-16">
              <div className="max-w-2xl mx-auto">
                <div className="w-128 h-128 mx-auto mb-8 flex items-center justify-center">
                  <NextImage
                    src="/quiz/waitingQuizzes.png"
                    alt="Waiting for quiz"
                    className="w-full h-full object-contain"
                    width={512}
                    height={512}
                  />
                </div>
                <h2 className="text-2xl font-light text-gray-900 mb-4">
                  Waiting for quiz to start
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  You&apos;re all set! The host will start pushing questions
                  shortly.
                </p>
                <div className="mt-12 flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <SimpleFooter />
    </div>
  );
}

export default function JoinQuizPage() {
  return (
    <Suspense
      fallback={
        <ZeroGravityLoading
          title="Loading Quiz"
          subtitle="Preparing your quiz experience..."
        />
      }
    >
      <JoinQuizContent />
    </Suspense>
  );
}

// Force dynamic rendering
export const dynamic = "force-dynamic";
