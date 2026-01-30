"use client";

import { useState, useEffect, useCallback } from "react";
import { useSocket } from "@/contexts/SocketContext";

interface Participant {
  odId: string;
  username: string;
  profilePicture?: string;
  score: number;
  correctAnswers: number;
  streak: number;
  isHost: boolean;
}

interface Question {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  options: string[];
  timeLimit: number;
}

interface QuestionResult {
  correctAnswer: number;
  explanation?: string;
  answers: Array<{
    odId: string;
    answer: number;
    correct: boolean;
    points: number;
    timeMs: number;
  }>;
  leaderboard?: LeaderboardEntry[];
}

interface LeaderboardEntry {
  rank: number;
  odId: string;
  username: string;
  profilePicture?: string;
  score: number;
  correctAnswers: number;
  accuracy?: number;
  streak?: number;
}

interface QuizState {
  roomCode: string | null;
  quizTitle: string;
  state:
    | "idle"
    | "waiting"
    | "countdown"
    | "question"
    | "reviewing"
    | "finished";
  isHost: boolean;
  participants: Participant[];
  currentQuestion: Question | null;
  questionResult: QuestionResult | null;
  countdown: number;
  myAnswer: number | null;
  answersCount: number;
  finalLeaderboard: LeaderboardEntry[];
  error: string | null;
}

export function useLiveQuiz() {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<QuizState>({
    roomCode: null,
    quizTitle: "",
    state: "idle",
    isHost: false,
    participants: [],
    currentQuestion: null,
    questionResult: null,
    countdown: 0,
    myAnswer: null,
    answersCount: 0,
    finalLeaderboard: [],
    error: null,
  });

  useEffect(() => {
    if (!socket) return;

    // Quiz created
    socket.on("quiz:created", (data) => {
      setState((prev) => ({
        ...prev,
        roomCode: data.roomCode,
        quizTitle: data.quiz.title,
        state: "waiting",
        isHost: true,
        participants: data.participants || [],
        error: null,
      }));
    });

    // Quiz joined
    socket.on("quiz:joined", (data) => {
      setState((prev) => ({
        ...prev,
        roomCode: data.roomCode,
        quizTitle: data.quiz.title,
        state: data.state,
        isHost: data.isHost,
        participants: data.participants,
        error: null,
      }));
    });

    // Participant joined
    socket.on("quiz:participant-joined", (data) => {
      setState((prev) => ({
        ...prev,
        participants: [
          ...prev.participants.filter((p) => p.odId !== data.participant.odId),
          data.participant,
        ],
      }));
    });

    // Participant left
    socket.on("quiz:participant-left", (data) => {
      setState((prev) => ({
        ...prev,
        participants: prev.participants.filter((p) => p.odId !== data.odId),
      }));
    });

    // Quiz starting
    socket.on("quiz:starting", (data) => {
      setState((prev) => ({
        ...prev,
        state: "countdown",
        countdown: data.countdown,
      }));
    });

    // Countdown update
    socket.on("quiz:countdown", (data) => {
      setState((prev) => ({
        ...prev,
        countdown: data.countdown,
      }));
    });

    // New question
    socket.on("quiz:question", (data) => {
      setState((prev) => ({
        ...prev,
        state: "question",
        currentQuestion: data,
        questionResult: null,
        myAnswer: null,
        answersCount: 0,
      }));
    });

    // Answer received confirmation
    socket.on("quiz:answer-received", (data) => {
      setState((prev) => ({
        ...prev,
        answersCount: data.answersCount,
      }));
    });

    // Answers count update
    socket.on("quiz:answers-update", (data) => {
      setState((prev) => ({
        ...prev,
        answersCount: data.answersCount,
      }));
    });

    // Question results
    socket.on("quiz:question-results", (data) => {
      setState((prev) => ({
        ...prev,
        state: "reviewing",
        questionResult: data,
      }));
    });

    // Quiz finished
    socket.on("quiz:finished", (data) => {
      setState((prev) => ({
        ...prev,
        state: "finished",
        finalLeaderboard: data.leaderboard,
      }));
    });

    // Error
    socket.on("quiz:error", (data) => {
      setState((prev) => ({
        ...prev,
        error: data.message,
      }));

      // Clear error after 5 seconds
      setTimeout(() => {
        setState((prev) => ({ ...prev, error: null }));
      }, 5000);
    });

    // Host changed
    socket.on("quiz:host-changed", () => {
      // Note: need to compare with current user id
      setState((prev) => ({
        ...prev,
        // Update isHost based on data if needed
      }));
    });

    return () => {
      socket.off("quiz:created");
      socket.off("quiz:joined");
      socket.off("quiz:participant-joined");
      socket.off("quiz:participant-left");
      socket.off("quiz:starting");
      socket.off("quiz:countdown");
      socket.off("quiz:question");
      socket.off("quiz:answer-received");
      socket.off("quiz:answers-update");
      socket.off("quiz:question-results");
      socket.off("quiz:finished");
      socket.off("quiz:error");
      socket.off("quiz:host-changed");
    };
  }, [socket]);

  const createQuiz = useCallback(
    (quizId: string, settings?: object) => {
      if (!socket || !isConnected) {
        setState((prev) => ({ ...prev, error: "Not connected to server" }));
        return;
      }
      socket.emit("quiz:create", { quizId, settings });
    },
    [socket, isConnected],
  );

  const joinQuiz = useCallback(
    (roomCode: string) => {
      if (!socket || !isConnected) {
        setState((prev) => ({ ...prev, error: "Not connected to server" }));
        return;
      }
      socket.emit("quiz:join", { roomCode });
    },
    [socket, isConnected],
  );

  const leaveQuiz = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit("quiz:leave", {});
    setState({
      roomCode: null,
      quizTitle: "",
      state: "idle",
      isHost: false,
      participants: [],
      currentQuestion: null,
      questionResult: null,
      countdown: 0,
      myAnswer: null,
      answersCount: 0,
      finalLeaderboard: [],
      error: null,
    });
  }, [socket, isConnected]);

  const startQuiz = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit("quiz:start", {});
  }, [socket, isConnected]);

  const submitAnswer = useCallback(
    (answer: number) => {
      if (!socket || !isConnected) return;
      socket.emit("quiz:answer", { answer });
      setState((prev) => ({ ...prev, myAnswer: answer }));
    },
    [socket, isConnected],
  );

  const nextQuestion = useCallback(() => {
    if (!socket || !isConnected) return;
    socket.emit("quiz:next", {});
  }, [socket, isConnected]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    isConnected,
    createQuiz,
    joinQuiz,
    leaveQuiz,
    startQuiz,
    submitAnswer,
    nextQuestion,
    clearError,
  };
}
