"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getSessionDetails } from "@/services/quizzesService";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { useAuth } from "@/contexts/AuthContext";
import {
  QuizSessionDetail,
  QuizSessionParticipant,
} from "@/types/quiz";
import {
  X,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  ChevronDown,
  Users,
  Trophy,
  Hash,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";

export default function SessionDetailPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const quizId = String(params?.quizId || "");
  const sessionId = String(params?.sessionId || "");

  const [session, setSession] = useState<QuizSessionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, authLoading, router]);

  useEffect(() => {
    if (!quizId || !sessionId) return;
    (async () => {
      try {
        const res = await getSessionDetails(quizId, sessionId);
        if (res?.success) {
          setSession(res.session);
        } else {
          setError("Session not found");
        }
      } catch (err) {
        console.error("Failed to load session:", err);
        setError("Failed to load session");
      } finally {
        setLoading(false);
      }
    })();
  }, [quizId, sessionId]);

  if (authLoading || loading) {
    return (
      <ZeroGravityLoading
        title="Loading Session"
        subtitle="Fetching session data..."
        showNavigation={true}
      />
    );
  }

  if (!isLoggedIn) return null;

  if (error || !session) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent">
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
          <div className="text-center">
            <h1 className="text-2xl font-light text-gray-900 dark:text-white mb-2">
              {error || "Session not found"}
            </h1>
            <button
              onClick={() =>
                router.push(`/dashboard/quizzes/host/${quizId}`)
              }
              className="mt-4 px-5 py-2.5 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-light rounded-lg"
            >
              ← Back to Quiz
            </button>
          </div>
        </main>
      </div>
    );
  }

  const endedDate = session.endedAt ? new Date(session.endedAt) : null;
  const formattedDate = endedDate
    ? endedDate.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";
  const formattedTime = endedDate
    ? endedDate.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  const durationStr = session.duration
    ? session.duration < 60
      ? `${session.duration}s`
      : `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`
    : "—";

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

  const ParticipantReportSection = ({
    entry,
  }: {
    entry: QuizSessionParticipant;
  }) => {
    return (
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-8 border-t border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-4 duration-300 -mx-2 sm:mx-0 px-2 sm:px-0 bg-gray-50/30 dark:bg-gray-800/20 rounded-b-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 sm:gap-y-10">
          {session.questions.map((q, idx) => {
            const answer = entry.responses?.find(
              (a) => a.questionId === q.questionId,
            );

            const isCorrect = answer?.isCorrect;
            const hasAnswered = !!answer;

            return (
              <div
                key={q.questionId || idx}
                className="space-y-2.5 pb-4 sm:pb-8 border-b border-gray-100/50 dark:border-gray-800/30 last:border-0 md:odd:border-r md:odd:pr-8"
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <span
                    className={`flex-shrink-0 w-5 h-5 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-bold ${
                      !hasAnswered
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-500"
                        : isCorrect
                          ? "bg-green-500 text-white shadow-sm shadow-green-500/20"
                          : "bg-red-500 text-white shadow-sm shadow-red-500/20"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <p className="text-[11px] sm:text-sm text-gray-900 dark:text-white font-medium leading-relaxed">
                    {q.text}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-1 pl-7 sm:pl-10">
                  {q.options.map((opt) => {
                    const isSelected = answer?.selectedOptionKey === opt.key;
                    const isCorrectOpt = opt.isCorrect;

                    let variantClasses =
                      "border-transparent text-gray-500 dark:text-gray-400 opacity-60";
                    if (isSelected) {
                      variantClasses = isCorrect
                        ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300 opacity-100 font-medium"
                        : "border-red-500 bg-red-500/10 text-red-700 dark:text-red-300 opacity-100 font-medium";
                    } else if (isCorrectOpt && hasAnswered && !isCorrect) {
                      variantClasses =
                        "border-green-500/30 bg-green-500/5 text-green-600 dark:text-green-400 opacity-100";
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`flex items-center justify-between p-1.5 sm:p-2.5 border rounded-lg text-[10px] sm:text-xs transition-all ${variantClasses}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex-shrink-0 w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] font-bold ${
                              isSelected
                                ? "bg-current/10"
                                : "bg-gray-100 dark:bg-white/5"
                            }`}
                          >
                            {opt.key}
                          </span>
                          <span className="truncate">{opt.text}</span>
                        </div>
                        <div className="flex-shrink-0">
                          {isSelected && isCorrect && (
                            <Check
                              size={10}
                              className="text-green-600 sm:w-3 sm:h-3"
                            />
                          )}
                          {isSelected && !isCorrect && (
                            <X
                              size={10}
                              className="text-red-600 sm:w-3 sm:h-3"
                            />
                          )}
                          {!isSelected &&
                            isCorrectOpt &&
                            hasAnswered &&
                            !isCorrect && (
                              <Check
                                size={10}
                                className="text-green-500/50 sm:w-3 sm:h-3"
                              />
                            )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pl-7 sm:pl-10 flex items-center justify-between">
                  {!hasAnswered ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-[8px] font-bold uppercase tracking-wider">
                      <AlertCircle size={8} />
                      Skipped
                    </span>
                  ) : (
                    <span
                      className={`text-[8px] font-bold uppercase tracking-wider ${isCorrect ? "text-green-500" : "text-red-500"}`}
                    >
                      {isCorrect ? "Correct" : "Incorrect"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6 flex justify-center pb-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedUserId(null);
            }}
            className="px-4 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-[10px] font-medium text-gray-500 hover:text-gray-800 dark:hover:text-white flex items-center gap-1 transition-all hover:border-gray-400 shadow-sm"
          >
            Collapse Report <ChevronDown size={12} className="rotate-180" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <main className="flex-1 flex flex-col items-center px-3 sm:px-4 py-4 sm:py-10">
        <div className="w-full max-w-6xl space-y-3 sm:space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <BackButton
                href={`/dashboard/quizzes/host/${quizId}`}
                className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
                label="Back to Host"
              />
              <div>
                <h1 className="text-xl sm:text-4xl font-light text-black dark:text-white tracking-tight mb-0.5 sm:mb-1">
                  Session #{session.sessionNumber}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light">
                  {session.title}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <button
                onClick={() =>
                  router.push(`/dashboard/quizzes/host/${quizId}`)
                }
                className="px-2 sm:px-5 py-1.5 sm:py-2.5 text-[10px] sm:text-sm border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-gray-900 dark:text-white font-light transition-colors whitespace-nowrap rounded-lg"
              >
                ← Back to Quiz
              </button>
            </div>
          </div>

          {/* Session Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                  Date
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
                {formattedDate}
              </p>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                {formattedTime}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Users className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                  Participants
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {session.totalParticipants}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Hash className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                  Questions
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {session.totalQuestions}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
                <Trophy className="w-3.5 h-3.5" />
                <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">
                  Duration
                </span>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {durationStr}
              </p>
            </div>
          </div>

          {/* Leaderboard Header */}
          <div className="flex items-center gap-2 pt-2">
            <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <h2 className="text-base sm:text-xl font-light text-gray-900 dark:text-white">
              Leaderboard
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-light">
              ({session.leaderboard.length} participants)
            </span>
          </div>

          {/* Desktop Leaderboard */}
          <div className="hidden lg:block">
            {/* Column Headers */}
            <div className="flex items-center gap-5 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-t-xl">
              <div className="w-[200px] flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Participant
              </div>
              <div className="flex-1 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Answer Summary
              </div>
              <div className="w-[60px] text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
                Accuracy
              </div>
              <div className="w-[120px] text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex-shrink-0">
                Score
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-200 dark:divide-gray-800 border-x border-b border-gray-200 dark:border-gray-800 rounded-b-xl overflow-hidden">
              {session.leaderboard.length > 0 ? (
                session.leaderboard.map((entry) => {
                  const accuracy = entry.accuracy || 0;
                  const correctAnswers = entry.correctAnswers || 0;
                  const incorrectAnswers = entry.incorrectAnswers || 0;
                  const totalQuestions = session.totalQuestions || 1;
                  const answeredQuestions = correctAnswers + incorrectAnswers;
                  const unanswered = totalQuestions - answeredQuestions;

                  return (
                    <div
                      key={entry.quizUserId}
                      onClick={() =>
                        setExpandedUserId(
                          expandedUserId === entry.quizUserId
                            ? null
                            : entry.quizUserId,
                        )
                      }
                      className={`py-4 px-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${expandedUserId === entry.quizUserId ? "bg-gray-50 dark:bg-gray-800/80 shadow-inner" : ""}`}
                    >
                      <div className="flex items-center gap-5">
                        {/* Left: Avatar + Name */}
                        <div className="flex items-center gap-3 w-[200px] flex-shrink-0">
                          {entry.participantAvatar ? (
                            <Image
                              src={`/quiz/avatars/${entry.participantAvatar}`}
                              alt={entry.participantName}
                              width={56}
                              height={56}
                              className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-medium flex-shrink-0 ${getAvatarColor(entry.participantName)}`}
                            >
                              {entry.participantName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                          )}
                          <h3 className="text-base font-medium truncate text-gray-900 dark:text-white">
                            {entry.participantName}
                          </h3>
                        </div>

                        {/* Center: Answer bars */}
                        <div className="flex-1 min-w-0">
                          <div className="flex gap-1 mb-1.5 mr-12">
                            {Array.from({ length: totalQuestions }).map(
                              (_, i) => {
                                const question = session.questions[i];
                                const answer = entry.responses?.find(
                                  (a) =>
                                    a.questionId === question?.questionId,
                                );

                                let bgColor =
                                  "bg-blue-100 dark:bg-blue-900/30";
                                if (answer) {
                                  bgColor = answer.isCorrect
                                    ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                    : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                                }

                                return (
                                  <div
                                    key={i}
                                    className={`h-5 rounded-lg transition-all duration-300 ${bgColor}`}
                                    style={{
                                      width: `${100 / totalQuestions}%`,
                                    }}
                                  />
                                );
                              },
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              ✓ {correctAnswers} Correct
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              ✗ {incorrectAnswers} Incorrect
                            </span>
                            {unanswered > 0 && (
                              <span className="text-blue-500 dark:text-blue-400 font-medium">
                                — {unanswered} Skipped
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Accuracy circle */}
                        <div className="w-[60px] flex items-center justify-center flex-shrink-0">
                          <div className="relative w-12 h-12">
                            <svg
                              className="w-12 h-12 -rotate-90"
                              viewBox="0 0 36 36"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                className="stroke-gray-200 dark:stroke-gray-700"
                                strokeWidth="3"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                className="stroke-green-500"
                                strokeWidth="3"
                                strokeDasharray={`${accuracy * 0.9425} 94.25`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-900 dark:text-white">
                              {accuracy}%
                            </span>
                          </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                            {Math.round(entry.totalScore || 0)}
                          </div>
                          <div className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-0.5 flex items-center justify-end gap-1">
                            pts
                            <ChevronRight
                              size={12}
                              className={`transition-transform duration-300 ${expandedUserId === entry.quizUserId ? "rotate-90" : ""}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inline Report Section */}
                      {expandedUserId === entry.quizUserId && (
                        <ParticipantReportSection entry={entry} />
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="min-h-[200px] text-center py-12 flex flex-col items-center justify-center gap-2">
                  <h3 className="text-base font-light text-gray-900 dark:text-white mb-2">
                    No participants
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-light">
                    This session has no participant data
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Mobile View */}
          <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
            {session.leaderboard.length > 0 ? (
              session.leaderboard.map((entry) => {
                const accuracy = entry.accuracy || 0;
                const correctAnswers = entry.correctAnswers || 0;
                const incorrectAnswers = entry.incorrectAnswers || 0;
                const totalQuestions = session.totalQuestions || 1;
                const answeredQuestions = correctAnswers + incorrectAnswers;
                const unanswered = totalQuestions - answeredQuestions;

                return (
                  <div
                    key={entry.quizUserId}
                    onClick={() =>
                      setExpandedUserId(
                        expandedUserId === entry.quizUserId
                          ? null
                          : entry.quizUserId,
                      )
                    }
                    className={`py-4 px-3 transition-all duration-300 active:bg-gray-100 dark:active:bg-gray-800 ${
                      expandedUserId === entry.quizUserId
                        ? "bg-gray-50 dark:bg-gray-800/50"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        {/* Top Left: Avatar + Name + Counts */}
                        <div className="flex items-center gap-3 min-w-0">
                          {entry.participantAvatar ? (
                            <Image
                              src={`/quiz/avatars/${entry.participantAvatar}`}
                              alt={entry.participantName}
                              width={36}
                              height={36}
                              className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 ${getAvatarColor(entry.participantName)}`}
                            >
                              {entry.participantName
                                ?.charAt(0)
                                ?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <h3 className="text-sm font-medium truncate text-gray-900 dark:text-white">
                              {entry.participantName}
                            </h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-medium">
                              <span className="text-green-600 dark:text-green-400">
                                ✓{correctAnswers}
                              </span>
                              <span className="text-red-600 dark:text-red-400">
                                ✗{incorrectAnswers}
                              </span>
                              {unanswered > 0 && (
                                <span>—{unanswered}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Top Right: Accuracy + Score */}
                        <div className="flex items-center gap-2.5 flex-shrink-0">
                          <div className="relative w-9 h-9">
                            <svg
                              className="w-9 h-9 -rotate-90"
                              viewBox="0 0 36 36"
                            >
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                className="stroke-gray-200 dark:stroke-gray-700"
                                strokeWidth="3.5"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                fill="none"
                                className="stroke-green-500"
                                strokeWidth="3.5"
                                strokeDasharray={`${accuracy * 0.9425} 94.25`}
                                strokeLinecap="round"
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-gray-900 dark:text-white">
                              {accuracy}%
                            </span>
                          </div>
                          <div className="text-right min-w-[45px]">
                            <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                              {Math.round(entry.totalScore || 0)}
                            </div>
                            <div className="text-[9px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center justify-end gap-1">
                              pts
                              <ChevronRight
                                size={10}
                                className={`transition-transform duration-300 ${expandedUserId === entry.quizUserId ? "rotate-90" : ""}`}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom: Answer bars */}
                      <div className="flex gap-0.5">
                        {Array.from({ length: totalQuestions }).map((_, i) => {
                          const question = session.questions[i];
                          const answer = entry.responses?.find(
                            (a) => a.questionId === question?.questionId,
                          );

                          let bgColor = "bg-gray-100 dark:bg-gray-800";
                          if (answer) {
                            bgColor = answer.isCorrect
                              ? "bg-green-500"
                              : "bg-red-500";
                          }

                          return (
                            <div
                              key={i}
                              className={`h-1.5 rounded-sm flex-1 ${bgColor}`}
                            />
                          );
                        })}
                      </div>

                      {/* Inline Report Section - Mobile */}
                      {expandedUserId === entry.quizUserId && (
                        <ParticipantReportSection entry={entry} />
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-xs text-gray-600 dark:text-gray-400">
                No participant data
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
