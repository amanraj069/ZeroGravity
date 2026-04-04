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
