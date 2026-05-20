export interface Quiz {
  _id: string;
  quizId: string;
  title: string;
  description?: string;
  status: "draft" | "published" | "active" | "ended";
  joinCode?: string;
  ownerUserId: string;
  questions: Array<{
    questionId?: string;
    text: string;
    options: Array<{ key: string; text: string; isCorrect?: boolean }>;
    timeLimitSeconds: number;
    maxMarks: number;
  }>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  participants?: number;
  totalParticipants?: number;
}

export interface QuizListResponse {
  success: boolean;
  data?: Quiz[];
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface QuizParticipant {
  quizUserId: string;
  participantName: string;
  participantAvatar?: string;
  totalScore?: number;
}

export interface QuizLeaderboardEntry {
  quizUserId: string;
  participantName: string;
  participantAvatar?: string;
  totalScore?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  totalResponses?: number;
  accuracy?: number;
  pointsEarned?: number;
  isDeleted?: boolean;
  answers?: Array<{
    questionId: string;
    selectedOptionKey: string;
    isCorrect: boolean;
    responseTimeSeconds?: number;
  }>;
}

export interface AdminQuizDetails {
  success: boolean;
  quiz: Quiz;
  participants: QuizParticipant[];
  leaderboard: QuizLeaderboardEntry[];
}

export interface AdminQuizListItem {
  quizId: string;
  title: string;
  endedAt?: string;
}

export interface AdminQuizListResponse {
  success: boolean;
  items: AdminQuizListItem[];
  total: number;
}

export interface QuizSessionSummary {
  sessionId: string;
  sessionNumber: number;
  totalParticipants: number;
  totalQuestions: number;
  startedAt?: string;
  endedAt?: string;
  duration?: number; // seconds
  title: string;
}

export interface QuizSessionParticipant {
  quizUserId: string;
  participantName: string;
  participantAvatar?: string;
  totalScore: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  pointsEarned: number;
  responses: Array<{
    questionId: string;
    selectedOptionKey: string;
    timeLeftSeconds?: number;
    awardedMarks?: number;
    isCorrect: boolean;
  }>;
  joinedAt?: string;
  lastAnswerAt?: string;
}

export interface QuizSessionQuestion {
  questionId: string;
  text: string;
  options: Array<{ key: string; text: string; isCorrect?: boolean }>;
  timeLimitSeconds: number;
  maxMarks: number;
}

export interface QuizSessionDetail {
  sessionId: string;
  quizId: string;
  sessionNumber: number;
  title: string;
  description?: string;
  totalQuestions: number;
  totalParticipants: number;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
  questions: QuizSessionQuestion[];
  leaderboard: QuizSessionParticipant[];
}
