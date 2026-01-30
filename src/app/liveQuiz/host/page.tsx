"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLiveQuiz } from "@/hooks/useLiveQuiz";
import { useSocket } from "@/contexts/SocketContext";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { Users, Loader2, ArrowLeft, Zap, Settings, Clock } from "lucide-react";

interface QuizSettings {
  timePerQuestion: number;
  maxParticipants: number;
  showLeaderboardAfterEach: boolean;
  shuffleQuestions: boolean;
  allowLateJoin: boolean;
}

function HostLiveQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = searchParams.get("quizId");
  const quizTitle = searchParams.get("title") || "Live Quiz";

  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { connectSocket, isConnected } = useSocket();
  const [showSettings, setShowSettings] = useState(true);
  const [settings, setSettings] = useState<QuizSettings>({
    timePerQuestion: 30,
    maxParticipants: 50,
    showLeaderboardAfterEach: true,
    shuffleQuestions: false,
    allowLateJoin: false,
  });

  const { roomCode, state, error, createQuiz } = useLiveQuiz();

  // Connect socket on mount when logged in
  useEffect(() => {
    if (isLoggedIn && !authLoading) {
      connectSocket();
    }
  }, [isLoggedIn, authLoading, connectSocket]);

  // Redirect to live quiz page once in a room
  useEffect(() => {
    if (roomCode && state !== "idle") {
      router.push("/liveQuiz");
    }
  }, [roomCode, state, router]);

  const handleCreateQuiz = () => {
    if (!quizId) {
      alert("No quiz selected");
      return;
    }
    createQuiz(quizId, settings);
    setShowSettings(false);
  };

  // Not logged in
  if (!isLoggedIn && !authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Host Live Quiz</h1>
          <p className="text-white/70 mb-6">
            Please log in to host a live quiz
          </p>
          <button
            onClick={() => router.push("/login?redirect=/liveQuiz/host")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // No quiz selected
  if (!quizId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Host Live Quiz</h1>
          <p className="text-white/70 mb-6">
            Select a quiz from your quizzes to host a live competition
          </p>
          <button
            onClick={() => router.push("/quizzes")}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition"
          >
            Browse Quizzes
          </button>
          <button
            onClick={() => router.back()}
            className="w-full text-white/60 hover:text-white py-3 mt-3 flex items-center justify-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Settings Screen
  if (showSettings && state === "idle") {
    return (
      <div className="min-h-screen p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Host Live Quiz
              </h1>
              <p className="text-white/70">{quizTitle}</p>
            </div>

            <div className="space-y-6">
              {/* Time per question */}
              <div>
                <label className="block text-white font-medium mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time per Question
                </label>
                <div className="flex gap-2">
                  {[15, 20, 30, 45, 60].map((time) => (
                    <button
                      key={time}
                      onClick={() =>
                        setSettings((s) => ({ ...s, timePerQuestion: time }))
                      }
                      className={`flex-1 py-3 rounded-xl font-medium transition ${
                        settings.timePerQuestion === time
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {time}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Max participants */}
              <div>
                <label className="block text-white font-medium mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Max Participants
                </label>
                <div className="flex gap-2">
                  {[10, 25, 50, 100].map((max) => (
                    <button
                      key={max}
                      onClick={() =>
                        setSettings((s) => ({ ...s, maxParticipants: max }))
                      }
                      className={`flex-1 py-3 rounded-xl font-medium transition ${
                        settings.maxParticipants === max
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : "bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      {max}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle options */}
              <div className="space-y-4">
                <label className="flex items-center justify-between p-4 bg-white/10 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-white font-medium">
                      Show Leaderboard After Each Question
                    </p>
                    <p className="text-white/60 text-sm">
                      Display rankings after every question
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        showLeaderboardAfterEach: !s.showLeaderboardAfterEach,
                      }))
                    }
                    className={`w-12 h-7 rounded-full transition ${
                      settings.showLeaderboardAfterEach
                        ? "bg-green-500"
                        : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.showLeaderboardAfterEach
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-4 bg-white/10 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-white font-medium">Shuffle Questions</p>
                    <p className="text-white/60 text-sm">
                      Randomize question order
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        shuffleQuestions: !s.shuffleQuestions,
                      }))
                    }
                    className={`w-12 h-7 rounded-full transition ${
                      settings.shuffleQuestions ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.shuffleQuestions
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between p-4 bg-white/10 rounded-xl cursor-pointer">
                  <div>
                    <p className="text-white font-medium">Allow Late Join</p>
                    <p className="text-white/60 text-sm">
                      Players can join after quiz starts
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings((s) => ({
                        ...s,
                        allowLateJoin: !s.allowLateJoin,
                      }))
                    }
                    className={`w-12 h-7 rounded-full transition ${
                      settings.allowLateJoin ? "bg-green-500" : "bg-white/20"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full transition-transform ${
                        settings.allowLateJoin
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center"
                >
                  <p className="text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Actions */}
              <div className="space-y-3 pt-4">
                <button
                  onClick={handleCreateQuiz}
                  disabled={!isConnected}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-4 rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {!isConnected ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Create Live Quiz
                    </>
                  )}
                </button>

                <button
                  onClick={() => router.back()}
                  className="w-full text-white/60 hover:text-white py-2 flex items-center justify-center gap-2 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Loading/Creating state
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white">Creating live quiz...</p>
      </div>
    </div>
  );
}

// Loading component for Suspense fallback
function HostLiveQuizLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white">Loading...</p>
      </div>
    </div>
  );
}

// Default export with Suspense boundary for useSearchParams
export default function HostLiveQuizPage() {
  return (
    <Suspense fallback={<HostLiveQuizLoading />}>
      <HostLiveQuizContent />
    </Suspense>
  );
}
