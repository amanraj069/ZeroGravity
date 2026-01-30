"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuiz } from "@/hooks/useLiveQuiz";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Check,
  ArrowLeft,
  Play,
  Crown,
  Zap,
} from "lucide-react";

export default function LiveQuizPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth();
  const { connectSocket, isConnected } = useSocket();
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const {
    roomCode,
    quizTitle,
    state,
    isHost,
    participants,
    currentQuestion,
    questionResult,
    countdown,
    myAnswer,
    answersCount,
    finalLeaderboard,
    error,
    joinQuiz,
    leaveQuiz,
    startQuiz,
    submitAnswer,
    nextQuestion,
  } = useLiveQuiz();

  // Connect socket on mount when logged in
  useEffect(() => {
    if (isLoggedIn && !authLoading) {
      connectSocket();
    }
  }, [isLoggedIn, authLoading, connectSocket]);

  // Timer for questions
  useEffect(() => {
    if (state === "question" && currentQuestion) {
      setTimeLeft(currentQuestion.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state, currentQuestion]);

  // Show confetti for winners
  useEffect(() => {
    if (state === "finished" && finalLeaderboard.length > 0 && user) {
      const myRank = finalLeaderboard.findIndex((e) => e.odId === user._id);
      if (myRank !== -1 && myRank < 3) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [state, finalLeaderboard, user]);

  const handleJoin = () => {
    if (roomCodeInput.trim()) {
      joinQuiz(roomCodeInput.trim().toUpperCase());
    }
  };

  const copyRoomCode = useCallback(() => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomCode]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoin();
    }
  };

  // Not logged in
  if (!isLoggedIn && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Join Live Quiz</h1>
          <p className="text-white/70 mb-6">
            Please log in to join a live quiz competition
          </p>
          <button
            onClick={() => router.push("/login?redirect=/liveQuiz")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Waiting/Join Screen
  if (state === "idle") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Live Quiz</h1>
            <p className="text-white/70">Enter a room code to join</p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter Room Code"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                onKeyPress={handleKeyPress}
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.5em] placeholder:text-white/30 placeholder:tracking-normal placeholder:text-base focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <button
              onClick={handleJoin}
              disabled={
                !isConnected || !roomCodeInput || roomCodeInput.length < 6
              }
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {!isConnected ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Join Quiz"
              )}
            </button>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center"
              >
                <p className="text-red-300">{error}</p>
              </motion.div>
            )}

            <button
              onClick={() => router.back()}
              className="w-full text-white/60 hover:text-white py-2 flex items-center justify-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby Screen
  if (state === "waiting") {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white mb-2">
                {quizTitle}
              </h1>

              {/* Room Code Display */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="bg-white/20 rounded-xl px-6 py-3">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">
                    Room Code
                  </p>
                  <p className="text-3xl font-bold text-white tracking-[0.3em]">
                    {roomCode}
                  </p>
                </div>
                <button
                  onClick={copyRoomCode}
                  className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition"
                >
                  {copied ? (
                    <Check className="w-6 h-6 text-green-400" />
                  ) : (
                    <Copy className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
              <p className="text-sm text-white/60 mt-2">
                Share this code with friends!
              </p>
            </div>
          </div>

          {/* Participants Card */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white">
                <Users className="w-5 h-5" />
                <span className="font-semibold">
                  {participants.length} Players
                </span>
              </div>
              {isHost && (
                <button
                  onClick={startQuiz}
                  disabled={participants.length < 1}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-2 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Start Quiz
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {participants.map((p) => (
                  <motion.div
                    key={p.odId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center p-4 rounded-xl bg-white/10"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {p.username?.[0]?.toUpperCase() || "?"}
                      </div>
                      {p.isHost && (
                        <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="mt-2 text-sm font-medium text-white truncate max-w-full">
                      {p.username}
                    </span>
                    {p.isHost && (
                      <span className="text-xs text-yellow-400 mt-1">Host</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {!isHost && (
              <p className="text-center text-white/60 mt-6">
                Waiting for host to start the quiz...
              </p>
            )}
          </div>

          {/* Leave Button */}
          <button
            onClick={leaveQuiz}
            className="w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-medium transition flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Leave Quiz
          </button>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center"
            >
              <p className="text-red-300">{error}</p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Countdown Screen
  if (state === "countdown") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <motion.div
          key={countdown}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.5, opacity: 0 }}
          className="text-center"
        >
          <p className="text-white/60 text-xl mb-4">Get Ready!</p>
          <div className="text-9xl font-bold text-white">{countdown}</div>
        </motion.div>
      </div>
    );
  }

  // Question Screen
  if (state === "question" && currentQuestion) {
    const progress = (timeLeft / currentQuestion.timeLimit) * 100;

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center text-white">
            <span className="bg-white/20 px-4 py-2 rounded-lg">
              Q {currentQuestion.questionNumber}/
              {currentQuestion.totalQuestions}
            </span>
            <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-lg">
              <Clock className="h-5 w-5" />
              <span
                className={`text-2xl font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : ""}`}
              >
                {timeLeft}s
              </span>
            </div>
            <span className="bg-white/20 px-4 py-2 rounded-lg">
              {answersCount}/{participants.length} answered
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${timeLeft <= 5 ? "bg-red-500" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}
              initial={{ width: "100%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Question */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => {
                const optionLetters = ["A", "B", "C", "D"];
                const colors = [
                  "from-red-500 to-rose-600",
                  "from-blue-500 to-indigo-600",
                  "from-yellow-500 to-orange-600",
                  "from-green-500 to-emerald-600",
                ];

                return (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: myAnswer === null ? 1.02 : 1 }}
                    whileTap={{ scale: myAnswer === null ? 0.98 : 1 }}
                    onClick={() => myAnswer === null && submitAnswer(idx)}
                    disabled={myAnswer !== null}
                    className={`p-6 rounded-xl text-left text-lg font-medium transition-all ${
                      myAnswer === idx
                        ? `bg-gradient-to-r ${colors[idx]} ring-4 ring-white/50`
                        : myAnswer !== null
                          ? "bg-white/10 opacity-50"
                          : `bg-gradient-to-r ${colors[idx]} hover:opacity-90`
                    } text-white`}
                  >
                    <span className="inline-block w-10 h-10 rounded-lg bg-white/20 text-center leading-10 mr-3 font-bold">
                      {optionLetters[idx]}
                    </span>
                    {option}
                  </motion.button>
                );
              })}
            </div>

            {myAnswer !== null && (
              <p className="text-center mt-6 text-white/60">
                <Loader2 className="inline animate-spin mr-2 h-4 w-4" />
                Waiting for other players...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results Screen
  if (state === "reviewing" && questionResult && currentQuestion) {
    const optionLetters = ["A", "B", "C", "D"];

    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white text-center mb-6">
              {currentQuestion.question}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = idx === questionResult.correctAnswer;
                const myAnswerHere = myAnswer === idx;

                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl flex items-center justify-between ${
                      isCorrect
                        ? "bg-green-500/30 border-2 border-green-500"
                        : myAnswerHere && !isCorrect
                          ? "bg-red-500/30 border-2 border-red-500"
                          : "bg-white/10"
                    }`}
                  >
                    <span className="text-white">
                      <span className="inline-block w-8 h-8 rounded bg-white/20 text-center leading-8 mr-3 font-bold">
                        {optionLetters[idx]}
                      </span>
                      {option}
                    </span>
                    {isCorrect && (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    )}
                    {myAnswerHere && !isCorrect && (
                      <XCircle className="h-6 w-6 text-red-400" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* My result */}
            {myAnswer !== null && (
              <div
                className={`text-center p-4 rounded-xl mb-6 ${
                  myAnswer === questionResult.correctAnswer
                    ? "bg-green-500/20"
                    : "bg-red-500/20"
                }`}
              >
                {myAnswer === questionResult.correctAnswer ? (
                  <p className="text-green-400 font-semibold text-lg">
                    ✨ Correct! +
                    {questionResult.answers.find((a) => a.odId === user?._id)
                      ?.points || 0}{" "}
                    points
                  </p>
                ) : (
                  <p className="text-red-400 font-semibold text-lg">
                    ❌ Incorrect
                  </p>
                )}
              </div>
            )}

            {/* Leaderboard */}
            {questionResult.leaderboard && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Current Standings
                </h3>
                <div className="space-y-2">
                  {questionResult.leaderboard.slice(0, 5).map((entry) => (
                    <div
                      key={entry.odId}
                      className={`flex items-center justify-between p-3 rounded-xl ${
                        entry.odId === user?._id
                          ? "bg-purple-500/30 border border-purple-500"
                          : "bg-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            entry.rank === 1
                              ? "bg-yellow-500"
                              : entry.rank === 2
                                ? "bg-gray-400"
                                : entry.rank === 3
                                  ? "bg-amber-600"
                                  : "bg-white/20"
                          }`}
                        >
                          {entry.rank}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                          {entry.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <span className="text-white">{entry.username}</span>
                        {entry.streak && entry.streak >= 3 && (
                          <span className="text-orange-400 text-sm">
                            🔥 {entry.streak}
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-white">
                        {entry.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isHost && (
              <button
                onClick={nextQuestion}
                className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition"
              >
                Next Question →
              </button>
            )}

            {!isHost && (
              <p className="text-center text-white/60 mt-6">
                Waiting for host to continue...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Final Results Screen
  if (state === "finished") {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {/* Simple confetti effect */}
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [
                    "#FFD700",
                    "#FF6B6B",
                    "#4ECDC4",
                    "#45B7D1",
                    "#96E6A1",
                  ][Math.floor(Math.random() * 5)],
                }}
                initial={{ top: -20, opacity: 1 }}
                animate={{
                  top: "100%",
                  opacity: 0,
                  rotate: Math.random() * 720,
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  delay: Math.random() * 2,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h1 className="text-3xl font-bold text-white text-center mb-8">
              🎉 Quiz Complete!
            </h1>

            {/* Podium for top 3 */}
            <div className="flex justify-center items-end gap-4 mb-8 h-56">
              {/* 2nd place */}
              {finalLeaderboard[1] && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center text-white font-bold text-xl border-4 border-gray-300">
                    {finalLeaderboard[1].username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-white mt-2 text-sm">
                    {finalLeaderboard[1].username}
                  </span>
                  <span className="text-xs text-white/60">
                    {finalLeaderboard[1].score} pts
                  </span>
                  <div className="w-20 h-20 bg-gradient-to-b from-gray-400 to-gray-500 rounded-t-lg flex items-center justify-center text-3xl font-bold text-white mt-2">
                    🥈
                  </div>
                </motion.div>
              )}

              {/* 1st place */}
              {finalLeaderboard[0] && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-20 h-20 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-2xl border-4 border-yellow-300">
                    {finalLeaderboard[0].username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-bold text-white mt-2">
                    {finalLeaderboard[0].username}
                  </span>
                  <span className="text-sm text-white/60">
                    {finalLeaderboard[0].score} pts
                  </span>
                  <div className="w-24 h-28 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-t-lg flex items-center justify-center text-4xl font-bold text-white mt-2">
                    🥇
                  </div>
                </motion.div>
              )}

              {/* 3rd place */}
              {finalLeaderboard[2] && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold text-lg border-4 border-amber-500">
                    {finalLeaderboard[2].username?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="font-medium text-white mt-2 text-sm">
                    {finalLeaderboard[2].username}
                  </span>
                  <span className="text-xs text-white/60">
                    {finalLeaderboard[2].score} pts
                  </span>
                  <div className="w-20 h-14 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-lg flex items-center justify-center text-2xl font-bold text-white mt-2">
                    🥉
                  </div>
                </motion.div>
              )}
            </div>

            {/* Full leaderboard */}
            <div className="space-y-2">
              {finalLeaderboard.slice(3).map((entry) => (
                <div
                  key={entry.odId}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    entry.odId === user?._id
                      ? "bg-purple-500/30 border border-purple-500"
                      : "bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 text-center font-bold text-white">
                      {entry.rank}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {entry.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className="text-white">{entry.username}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-white">
                      {entry.score} pts
                    </div>
                    <div className="text-xs text-white/60">
                      {entry.accuracy}% accuracy
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                leaveQuiz();
                router.push("/quizzes");
              }}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
