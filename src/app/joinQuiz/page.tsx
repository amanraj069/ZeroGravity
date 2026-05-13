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
  listParticipantsPublic,
  getQuizPublicInfo,
} from "@/services/quizzesService";
import { QuizParticipant } from "@/types/quiz";
import { getSocket, joinQuizRoom } from "@/services/socketClient";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { QuizQuestion } from "@/services/quizzesService";
import { BackButton } from "@/components/BackButton";
import { useNavigation } from "@/contexts/NavigationContext";

function JoinQuizContent() {
  const search = useSearchParams();
  const { goBack } = useNavigation();
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
  const REJOIN_TOKEN_KEY = "zg_quiz_rejoin_token";
  const [rejoinToken, setRejoinToken] = useState<string>("");
  const [savedJoinCode, setSavedJoinCode] = useState<string>("");
  const [savedName, setSavedName] = useState<string>("");
  const [joined, setJoined] = useState<{
    quizId: string;
    quizUserId: string;
  } | null>(null);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(
    null,
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(-1);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const [isTimeUp, setIsTimeUp] = useState<boolean>(false);
  const [stoppedByHost, setStoppedByHost] = useState<boolean>(false);
  const [showQuizEnded, setShowQuizEnded] = useState<boolean>(false);
  const [showKickedOut, setShowKickedOut] = useState<boolean>(false);
  const [serverStartTime, setServerStartTime] = useState<Date | null>(null);
  const [serverTimeLimit, setServerTimeLimit] = useState<number>(0);
  const [isRestoredSession, setIsRestoredSession] = useState<boolean>(false);
  const [quizTitle, setQuizTitle] = useState<string>("");
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Handle hydration-safe initialization
  useEffect(() => {
    setMounted(true);

    // Initialize name from localStorage
    try {
      const o = localStorage.getItem("zg_name_obf");
      if (o) {
        const decodedName = deobfuscate(o);
        setName(decodedName);
        setSavedName(decodedName);
      }
    } catch {
      // Ignore errors
    }

    // Initialize join code from localStorage for quick rejoin
    try {
      const savedJoinCode = localStorage.getItem("zg_join_code");
      if (savedJoinCode) {
        setSavedJoinCode(savedJoinCode.toUpperCase());
        setJoinCode((prev) =>
          prev && prev.trim() ? prev : savedJoinCode.toUpperCase(),
        );
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

    // Initialize rejoin token for resume flow
    try {
      const savedRejoinToken = localStorage.getItem(REJOIN_TOKEN_KEY);
      if (savedRejoinToken) {
        setRejoinToken(savedRejoinToken);
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
      index?: number;
      startTime?: string;
      timeLimit?: number;
    }) => {
      if (payload?.quizId !== joined.quizId) return;
      setCurrentQuestion(payload.question);
      setCurrentQuestionIndex(payload.index ?? -1);
      setHasAnswered(false);
      setIsTimeUp(false);
      setStoppedByHost(false);

      if (payload.startTime && payload.timeLimit) {
        setServerStartTime(new Date(payload.startTime));
        setServerTimeLimit(payload.timeLimit);
        // Calculate initial remaining time
        const elapsed = Math.floor(
          (new Date().getTime() - new Date(payload.startTime).getTime()) / 1000,
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
    const onQuestionTimeUp = (payload?: { stoppedByHost?: boolean }) => {
      setIsTimeUp(true);
      setStoppedByHost(payload?.stoppedByHost || false);
      setTimeLeft(0);
    };
    const onEnded = () => {
      setCurrentQuestion(null);
      setShowQuizEnded(true);
      setHasAnswered(false);
      setIsTimeUp(false);
      setStoppedByHost(false);
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
          "Ignoring participant:left event during session restoration period",
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

    // Listen for new participants joining
    const onParticipantJoined = (payload: {
      quizId: string;
      participant: QuizParticipant;
    }) => {
      if (payload?.quizId !== joined.quizId) return;
      setParticipants((prev) => {
        // Check if participant already exists to avoid duplicates
        const exists = prev.find(
          (p) => p.quizUserId === payload.participant.quizUserId,
        );
        if (exists) return prev;
        return [...prev, payload.participant];
      });
    };
    s.on("participant:joined", onParticipantJoined);

    // Listen for participants leaving/being removed
    const onParticipantRemoved = (payload: {
      quizId: string;
      quizUserId: string;
    }) => {
      if (payload?.quizId !== joined.quizId) return;
      // Remove the participant from the list (unless it's the current user, which is handled by onKickedOut)
      if (payload.quizUserId !== joined.quizUserId) {
        setParticipants((prev) =>
          prev.filter((p) => p.quizUserId !== payload.quizUserId),
        );
      }
    };
    // participant:left is used for both kicked out notification and updating participant list
    s.on("participant:left", onParticipantRemoved);

    // On mount, also fetch current state in case we refreshed mid-question
    (async () => {
      const invalidateLocalSession = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {}
        setJoined(null);
        setCurrentQuestion(null);
        setHasAnswered(false);
        setIsTimeUp(false);
        setStoppedByHost(false);
        setTimeLeft(0);
        setShowQuizEnded(false);
        setShowKickedOut(false);
      };

      const cur = await getCurrentQuestion(joined.quizId, joined.quizUserId);
      if (!cur?.success) {
        if (cur?.message === "Participant not in quiz") {
          invalidateLocalSession();
          return;
        }
      }

      if (cur?.success && cur.index >= 0) {
        setCurrentQuestion(cur.question);
        setCurrentQuestionIndex(cur.index);
        // Set hasAnswered and isTimeUp based on server response
        setHasAnswered(cur.hasAnswered || false);
        setIsTimeUp(cur.isTimeUp || false);

        if (cur.startTime && cur.timeLimit && cur.remainingTime !== undefined) {
          setServerStartTime(new Date(cur.startTime));
          setServerTimeLimit(cur.timeLimit);
          // If time is up, set to 0, otherwise use server's remaining time
          setTimeLeft(cur.isTimeUp ? 0 : cur.remainingTime);
        } else {
          // Fallback to client-side timer
          setTimeLeft(cur.isTimeUp ? 0 : cur.question.timeLimitSeconds);
          setServerStartTime(null);
          setServerTimeLimit(0);
        }
      }

      // Fetch initial participants list and quiz info
      try {
        const p = await listParticipantsPublic(joined.quizId);
        if (p?.success && p.participants) {
          setParticipants(p.participants);

          // Hard guard: if current local session user is not in participant list,
          // invalidate stale local session and send user back to join entry.
          const isCurrentUserInQuiz = p.participants.some(
            (participant: QuizParticipant) =>
              participant.quizUserId === joined.quizUserId,
          );

          if (!isCurrentUserInQuiz) {
            invalidateLocalSession();
            return;
          }
        }
      } catch (error) {
        console.error("Failed to fetch participants:", error);
      }

      // Fetch quiz metadata
      try {
        const quizData = await getQuizPublicInfo(joined.quizId);
        if (quizData?.success && quizData.quiz) {
          setQuizTitle(quizData.quiz.title || "Quiz");
          setTotalQuestions(quizData.quiz.questions?.length || 0);
        }
      } catch (error) {
        console.error("Failed to fetch quiz data:", error);
      }
    })();
    return () => {
      s.off("question:pushed", onQuestion);
      s.off("question:timeup", onQuestionTimeUp);
      s.off("quiz:ended", onEnded);
      s.off("participant:left", onKickedOut);
      s.off("participant:left", onParticipantRemoved);
      s.off("participants:cleared", onParticipantsCleared);
      s.off("participant:joined", onParticipantJoined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  useEffect(() => {
    if (!currentQuestion) return;
    // Don't start timer if already time up
    if (isTimeUp) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (serverStartTime && serverTimeLimit > 0) {
        // Use server-side timer synchronization
        const elapsed = Math.floor(
          (new Date().getTime() - serverStartTime.getTime()) / 1000,
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
  }, [currentQuestion, serverStartTime, serverTimeLimit, isTimeUp]);

  const normalizedJoinCode = joinCode.trim().toUpperCase();
  const normalizedName = name.trim();
  const canUseRejoinFlow = Boolean(
    rejoinToken &&
    savedJoinCode &&
    savedName &&
    normalizedJoinCode === savedJoinCode &&
    normalizedName === savedName,
  );

  const handleJoin = async () => {
    if (!joinCode || !name) return;

    if (!selectedAvatar) {
      setShowAvatarError(true);
      return;
    }

    setShowAvatarError(false);
    const res = await joinQuiz(
      normalizedJoinCode,
      normalizedName,
      selectedAvatar,
      canUseRejoinFlow ? rejoinToken : undefined,
    );
    if (res?.success) {
      setJoined({ quizId: res.quizId, quizUserId: res.quizUserId });
      setIsRestoredSession(false); // This is a fresh join, not a restored session
      try {
        if (res.rejoinToken) {
          setRejoinToken(res.rejoinToken);
          localStorage.setItem(REJOIN_TOKEN_KEY, res.rejoinToken);
        }
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ quizId: res.quizId, quizUserId: res.quizUserId }),
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

    try {
      const result = await submitAnswer(joined.quizId, {
        quizUserId: joined.quizUserId,
        questionId: currentQuestion.questionId,
        selectedOptionKey: key,
        timeLeftSeconds: timeLeft,
      });
      if (!result?.success) {
        // If time is up on server side, don't revert - the answer window has closed
        if (result?.message?.toLowerCase().includes("time")) {
          setIsTimeUp(true);
        } else {
          console.error("Failed to submit answer:", result?.message);
          setHasAnswered(false);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      // Don't show alert, just log the error - the UI state handles it
    }
  };

  const handleExit = async () => {
    // Don't show confirmation dialog if user is already kicked out
    if (showKickedOut) {
      // User is already kicked out, just go back without confirmation
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
      goBack();
      return;
    }

    const confirmExit = window.confirm(
      "Are you sure you want to leave the quiz?",
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
        // Clear active session only; keep profile data for quick rejoin
        localStorage.removeItem(STORAGE_KEY);
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
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
        <div className="text-center pt-6 pb-4 sm:py-6 lg:pt-12 lg:pb-2 bg-white dark:bg-gray-900">
          <div className="mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-2 sm:mb-4">
              <BackButton />
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-light text-black dark:text-white tracking-tight">
                Join Quiz
              </h1>
            </div>
            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 font-light leading-relaxed max-w-2xl mx-auto">
              Enter the cosmic quiz realm and test your knowledge among the
              stars
            </p>
          </div>
        </div>

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 pt-2 pb-12 sm:pb-16 min-h-0">
          <div className="max-w-6xl mx-auto w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-stretch">
              {/* Form section - First on mobile, Second on desktop */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-5 sm:p-8 lg:p-10 border border-black dark:border-gray-700 shadow-lg h-auto lg:h-[60dvh] flex flex-col justify-center order-1 lg:order-2 rounded-xl">
                <div className="space-y-5 sm:space-y-6 lg:space-y-8">
                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 mb-2 sm:mb-4">
                      Quiz Access Code
                    </label>
                    <input
                      className="w-full border sm:border-2 border-gray-300 dark:border-gray-600 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-light focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-2 focus:ring-black/10 dark:focus:ring-gray-500/20 transition-all placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm rounded-lg"
                      placeholder="Enter 6-letter code"
                      value={joinCode}
                      onChange={(e) =>
                        setJoinCode(e.target.value.toUpperCase())
                      }
                      maxLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm sm:text-base font-medium text-gray-800 dark:text-gray-200 mb-2 sm:mb-4">
                      Your Name
                    </label>
                    <input
                      className="w-full border sm:border-2 border-gray-300 dark:border-gray-600 px-4 sm:px-6 py-3 sm:py-4 text-base sm:text-lg font-light focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-2 focus:ring-black/10 dark:focus:ring-gray-500/20 transition-all placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm rounded-lg"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  {showAvatarError && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400 text-center">
                        Please select an avatar to continue
                      </p>
                    </div>
                  )}

                  <button
                    className="w-full bg-black dark:bg-white text-white dark:text-black py-3 sm:py-4 px-6 sm:px-8 text-base sm:text-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/20 dark:focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black dark:disabled:hover:bg-white shadow-lg hover:shadow-xl transform hover:translate-y-[-1px] rounded-lg"
                    onClick={handleJoin}
                    disabled={!joinCode.trim() || !name.trim()}
                  >
                    {canUseRejoinFlow ? "Join Quiz Again" : "Launch Into Quiz"}
                  </button>
                </div>
              </div>

              {/* Avatar Selection - Second on mobile, First on desktop */}
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 border border-black dark:border-gray-700 min-h-[350px] h-[40vh] sm:h-[50dvh] lg:h-[60dvh] flex flex-col order-2 lg:order-1 rounded-xl">
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-light text-gray-900 dark:text-white mb-1 sm:mb-2">
                    Choose Your Avatar
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Select an avatar to represent you in the quiz
                  </p>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-3 md:gap-6 p-2 sm:p-4">
                    {avatars.map((avatar) => (
                      <button
                        key={avatar}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedAvatar(avatar);
                        }}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 md:w-28 md:h-28 rounded-full overflow-hidden transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-orange-300 dark:focus:ring-orange-600 mx-auto ${
                          selectedAvatar === avatar
                            ? "border-4 border-orange-600 dark:border-orange-500 shadow-lg ring-2 ring-orange-200 dark:ring-orange-800"
                            : "border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
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
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Hero-style header section */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 lg:py-8 pt-4 pb-2">
          {/* Mobile Layout */}
          <div className="lg:hidden mb-4">
            {/* Title and Exit Button Row */}
            <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-gray-800 pb-2">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-light text-black dark:text-white tracking-tight truncate">
                  Quiz {quizTitle && `- ${quizTitle}`}
                </h1>
              </div>
              <div className="flex items-center gap-3 ml-2 flex-shrink-0">
                {totalQuestions > 0 && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider whitespace-nowrap">
                    {totalQuestions}Q
                  </span>
                )}
                {!showKickedOut && (
                  <button
                    onClick={handleExit}
                    className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800 whitespace-nowrap rounded-lg"
                    title="Leave Quiz"
                  >
                    Exit
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex items-center justify-between mb-4 gap-6">
            <div className="flex-shrink-0">
              <h1 className="text-3xl font-light text-black dark:text-white tracking-tight">
                Quiz {quizTitle && `- ${quizTitle}`}
              </h1>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0">
              {totalQuestions > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  {totalQuestions}Q
                </span>
              )}
              {!showKickedOut && (
                <button
                  onClick={handleExit}
                  className="bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800 rounded-lg"
                  title="Leave Quiz"
                >
                  Exit Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center px-4 pb-8">
        <div className="w-full max-w-6xl">
          {showKickedOut ? (
            <div className="flex flex-col items-center justify-center min-h-[500px] py-12">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-8 sm:p-12 max-w-md w-full text-center rounded-xl">
                <div className="w-20 h-20 sm:w-28 sm:h-28 mx-auto mb-6 sm:mb-8 flex items-center justify-center">                  <span className="text-5xl sm:text-7xl">💀</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-light text-gray-900 dark:text-white mb-3 tracking-tight">
                  Removed from Quiz
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base mb-8 font-light">
                  The host has removed you from this quiz
                </p>
                <button
                  onClick={() => goBack()}
                  className="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-6 text-sm sm:text-base font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-black/20 dark:focus:ring-white/20 shadow-lg hover:shadow-xl transform hover:translate-y-[-1px] rounded-lg"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : showQuizEnded ? (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
              <div className="w-20 h-20 sm:w-28 sm:h-28 mb-6 sm:mb-8 flex items-center justify-center">
                <svg
                  className="w-16 h-16 sm:w-24 sm:h-24 text-black dark:text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                Quiz Complete
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
                Thanks for participating
              </p>
              <button
                onClick={handleExit}
                className="h-10 px-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors rounded-lg"
              >
                Return to Quiz Entry
              </button>
            </div>
          ) : currentQuestion ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-h-[75vh] lg:min-h-[70vh] flex flex-col rounded-xl overflow-hidden">
              {/* Question Header with Timer and Progress */}
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/80">
                <div className="flex items-center justify-between gap-4 mb-4">
                  {/* Progress Indicator */}
                  <div className="flex flex-col text-[10px] sm:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-tight">
                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-900 dark:text-white text-xs sm:text-sm">
                        {currentQuestionIndex + 1}
                      </span>
                      <span className="opacity-60 text-[8px] sm:text-[10px]">
                        Question
                      </span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-gray-900 dark:text-white text-xs sm:text-sm">
                        {totalQuestions}
                      </span>
                      <span className="opacity-60 text-[8px] sm:text-[10px]">
                        OF Total
                      </span>
                    </div>
                  </div>

                  {/* Timer */}
                  <div
                    className={`h-8 sm:h-10 px-3 sm:px-4 font-mono text-sm sm:text-lg font-bold flex items-center flex-shrink-0 border ${
                      timeLeft <= 10
                        ? "bg-red-500 text-white border-red-600"
                        : timeLeft <= 30
                          ? "bg-amber-500 text-white border-amber-600"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-200 dark:border-gray-600"
                    } rounded-lg`}
                  >
                    {Math.floor(timeLeft / 60)}:
                    {(timeLeft % 60).toString().padStart(2, "0")}
                  </div>
                </div>

                <h2 className="text-[14px] sm:text-lg md:text-2xl font-light text-black dark:text-white leading-relaxed w-full">
                  {currentQuestion.text}
                </h2>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-4 md:p-6 flex flex-col justify-center items-center">
                {hasAnswered ? (
                  /* Answered State - Centered */
                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white">
                      Answer submitted
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {totalQuestions > 0 &&
                      currentQuestionIndex === totalQuestions - 1
                        ? "Quiz has ended, contact your Host to know the results."
                        : "Waiting for host to push next question"}
                    </p>
                  </div>
                ) : isTimeUp ? (
                  /* Time Up / Stopped by Host State - Centered */
                  <div className="text-center">
                    <h3 className="text-xl md:text-2xl font-light text-gray-900 dark:text-white">
                      {stoppedByHost
                        ? "Oops! Host has stopped receiving responses"
                        : "Time's up"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      {totalQuestions > 0 &&
                      currentQuestionIndex === totalQuestions - 1
                        ? "Quiz has ended, contact your Host to know the results."
                        : "Waiting for next question"}
                    </p>
                  </div>
                ) : (
                  /* Answer Options - Colorful Buttons */
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full">
                    {currentQuestion.options.map((o, index) => {
                      const colors = [
                        "bg-red-600 hover:bg-red-700 active:bg-red-800",
                        "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                        "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
                        "bg-purple-600 hover:bg-purple-700 active:bg-purple-800",
                        "bg-green-600 hover:bg-green-700 active:bg-green-800",
                        "bg-pink-600 hover:bg-pink-700 active:bg-pink-800",
                        "bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800",
                        "bg-orange-600 hover:bg-orange-700 active:bg-orange-800",
                      ];
                      const colorClass = colors[index % colors.length];

                      return (
                        <button
                          key={o.key}
                          className={`${colorClass} text-white p-4 sm:p-8 text-left transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed transform hover:scale-[1.01] active:scale-[0.99] border-b-4 border-black/20 rounded-lg`}
                          onClick={() => sendAnswer(o.key)}
                          disabled={hasAnswered || isTimeUp}
                        >
                          <div className="flex items-center gap-3 sm:gap-4">
                            <div className="flex-shrink-0 w-8 h-8 sm:w-12 sm:h-12 bg-white/20 flex items-center justify-center text-sm sm:text-xl font-bold border border-white/30 rounded-lg">
                              {o.key}
                            </div>
                            <div className="flex-1 text-sm sm:text-lg font-medium leading-tight">
                              {o.text}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="pb-16">
              <div className="mx-auto pb-4">
                {/* Participants Section */}
                <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 lg:mt-4 min-h-[50vh] lg:min-h-[70vh] rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Participants
                    </h3>
                    <span className="inline-flex items-center bg-black dark:bg-white px-3 py-1 text-sm text-white dark:text-black font-medium rounded-lg">
                      {participants.length} joined
                    </span>
                  </div>

                  <div className="p-6 min-h-[200px]">
                    {participants.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-4 md:gap-6">
                        {participants.map((p) => (
                          <div
                            key={p.quizUserId}
                            className={`flex flex-row sm:flex-col items-center sm:text-center p-2 sm:p-3 transition-all rounded-xl gap-4 sm:gap-0 ${
                              p.quizUserId === joined?.quizUserId
                                ? "border border-amber-500 bg-amber-50/50 dark:bg-amber-900/10"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                            }`}
                          >
                            {p.participantAvatar ? (
                              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden shadow-sm flex-shrink-0 border border-gray-200 dark:border-gray-600 bg-white">
                                <NextImage
                                  src={`/quiz/avatars/${p.participantAvatar}`}
                                  alt={`Avatar for ${p.participantName}`}
                                  className="w-full h-full object-cover"
                                  width={64}
                                  height={64}
                                />
                              </div>
                            ) : (
                              <div
                                className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-white text-lg leading-none font-medium shadow-sm flex-shrink-0 ${getAvatarColor(
                                  p.participantName || "U",
                                )}`}
                              >
                                {p.participantName?.charAt(0)?.toUpperCase() ||
                                  "?"}
                              </div>
                            )}
                            <div className="flex-1 min-w-0 sm:mt-3">
                              <span className="block text-sm sm:text-xs text-gray-900 dark:text-white sm:text-gray-700 sm:dark:text-gray-300 truncate font-bold sm:uppercase tracking-tight">
                                {p.participantName}
                              </span>
                              <span className="sm:hidden text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-medium">
                                {p.quizUserId === joined?.quizUserId ? "You" : "Participant"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 dark:bg-gray-500 animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                          Waiting for participants to join...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
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
