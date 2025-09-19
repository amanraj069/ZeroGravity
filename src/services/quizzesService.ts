import { API_ENDPOINTS, apiCall, apiCallWithAuth } from "@/config/api";
import { QuizListResponse } from "@/types/quiz";

export interface QuizOption {
  key: string;
  text: string;
  isCorrect?: boolean;
}

export interface QuizQuestion {
  questionId?: string;
  text: string;
  options: QuizOption[];
  timeLimitSeconds: number;
  maxMarks: number;
}

export interface QuizDraft {
  title: string;
  description?: string;
  questions: QuizQuestion[];
}

export const createQuiz = async (draft: QuizDraft) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.CREATE, {
    method: "POST",
    body: JSON.stringify(draft),
  });
  return res.json();
};

export const updateDraft = async (
  quizId: string,
  draft: Partial<QuizDraft>
) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.GET(quizId), {
    method: "PATCH",
    body: JSON.stringify(draft),
  });
  return res.json();
};

export const publishQuiz = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.PUBLISH(quizId), {
    method: "POST",
  });
  return res.json();
};

export const getQuiz = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.GET(quizId));
  return res.json();
};

export const getCurrentQuestion = async (quizId: string) => {
  const res = await apiCall(API_ENDPOINTS.QUIZZES.CURRENT(quizId));
  return res.json();
};

export const joinQuiz = async (
  joinCode: string,
  name: string,
  avatar?: string
) => {
  const res = await apiCall(API_ENDPOINTS.QUIZZES.JOIN, {
    method: "POST",
    body: JSON.stringify({ joinCode, name, avatar }),
  });
  return res.json();
};

export const listParticipants = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.PARTICIPANTS(quizId));
  return res.json();
};

export const hostQuiz = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.PUBLISH(quizId), {
    method: "POST",
  });
  return res.json();
};

export const startQuiz = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.START(quizId), {
    method: "POST",
  });
  return res.json();
};

export const pushQuestion = async (quizId: string, index: number) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.PUSH(quizId, index), {
    method: "POST",
  });
  return res.json();
};

export const submitAnswer = async (
  quizId: string,
  payload: {
    quizUserId: string;
    questionId: string;
    selectedOptionKey: string;
    timeLeftSeconds: number;
  }
) => {
  const res = await apiCall(API_ENDPOINTS.QUIZZES.ANSWER(quizId), {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const leaderboard = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.LEADERBOARD(quizId));
  return res.json();
};

export const endQuiz = async (quizId: string) => {
  const res = await apiCallWithAuth(API_ENDPOINTS.QUIZZES.END(quizId), {
    method: "POST",
  });
  return res.json();
};

export const endQuestion = async (quizId: string) => {
  const res = await apiCallWithAuth(
    API_ENDPOINTS.QUIZZES.END_QUESTION(quizId),
    {
      method: "POST",
    }
  );
  return res.json();
};

export const leaveQuiz = async (quizId: string, quizUserId: string) => {
  const res = await apiCall(API_ENDPOINTS.QUIZZES.LEAVE(quizId), {
    method: "POST",
    body: JSON.stringify({ quizUserId }),
  });
  return res.json();
};

export const clearParticipants = async (quizId: string) => {
  const res = await apiCallWithAuth(
    `${API_ENDPOINTS.QUIZZES.GET(quizId)}/participants/clear`,
    { method: "POST" }
  );
  return res.json();
};

// Simple obfuscation (not cryptographic): base64
export const obfuscate = (text: string) => {
  if (typeof window === "undefined") return text;
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return text;
  }
};
export const deobfuscate = (text: string) => {
  if (typeof window === "undefined") return text;
  try {
    return decodeURIComponent(escape(atob(text)));
  } catch {
    return text;
  }
};

// Admin services
export const adminListPastQuizzes = async (params?: {
  ownerUserId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.ownerUserId) qs.set("ownerUserId", params.ownerUserId);
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const url = API_ENDPOINTS.QUIZZES.ADMIN_LIST_PAST(qs.toString());
  const res = await apiCallWithAuth(url);
  return res.json();
};

export const adminQuizDetails = async (quizId: string) => {
  const res = await apiCallWithAuth(
    API_ENDPOINTS.QUIZZES.ADMIN_DETAILS(quizId)
  );
  return res.json();
};

// List quizzes by current user
export const listUserQuizzes = async (params?: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<QuizListResponse> => {
  const qs = new URLSearchParams();
  if (params?.search) qs.set("search", params.search);
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  const url = `${API_ENDPOINTS.QUIZZES.LIST}${
    qs.toString() ? `?${qs.toString()}` : ""
  }`;
  console.log("Making API call to:", url);
  const res = await apiCallWithAuth(url);
  console.log("API response status:", res.status);
  const data = await res.json();
  console.log("API response data:", data);
  return data;
};
