import API_BASE_URL, { apiCallWithAuth } from "@/config/api";

export interface PracticeQuizOption {
  key: string;
  text: string;
}

export interface PracticeQuizQuestion {
  questionId: string;
  text: string;
  options: PracticeQuizOption[];
  // correctKey and explanation are only available if the quiz is given up, or fetched via attempt insights.
  // For GOD difficulty, correctKey is a comma-joined sorted string of keys e.g. "A,C".
  correctKey?: string;
  explanation?: string;
  // Per-question timer set by AI for Hard/GOD mode. Null/absent for Easy/Medium.
  timePerQuestion?: number | null;
  isMultiSelect?: boolean;
}

export interface PracticeQuiz {
  quizId: string;
  name?: string;
  topic: string;
  categories: string[];
  difficulty: string;
  timePerQuestion: number;
  numberOfQuestions: number;
  questions?: PracticeQuizQuestion[];
  createdAt: string;
  isGivenUp: boolean;
  maxTrials: number;
}

export interface PracticeAttempt {
  attemptId: string;
  quizId: string;
  trialNumber: number;
  score: number;
  totalQuestions: number;
  pointsEarned: number;
  userAnswers: Record<string, string>;
  completedAt: string;
}

export interface QuotaData {
  used: number;
  limit: number;
  remaining: number;
}

export const generatePracticeQuiz = async (
  topic: string,
  categories: string[],
  difficulty: string,
  timePerQuestion: number,
  numberOfQuestions: number,
  name: string = "",
  useAgent: boolean = false,
) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/generate`,
    {
      method: "POST",
      body: JSON.stringify({
        topic,
        name,
        categories,
        difficulty,
        timePerQuestion,
        numberOfQuestions,
        useAgent,
      }),
    },
  );
  return response.json();
};

export const getPracticeQuizzes = async () => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes`,
  );
  return response.json();
};

export const getPracticeQuizById = async (quizId: string) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}`,
  );
  return response.json();
};

export const submitPracticeAttempt = async (
  quizId: string,
  userAnswers: Record<string, string>,
) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}/attempt`,
    {
      method: "POST",
      body: JSON.stringify({ userAnswers }),
    },
  );
  return response.json();
};

export const giveUpPracticeQuiz = async (quizId: string) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}/give-up`,
    {
      method: "POST",
    },
  );
  return response.json();
};

export const getPracticeAttemptInsights = async (
  quizId: string,
  attemptId: string,
) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}/attempts/${attemptId}`,
  );
  return response.json();
};

export const getPracticeQuizQuota = async () => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/quota`,
  );
  return response.json();
};

export const deletePracticeQuiz = async (quizId: string) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}`,
    {
      method: "DELETE",
    },
  );
  return response.json();
};

export const listDeletedPracticeQuizzes = async () => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/deleted/all`,
  );
  return response.json();
};

export const restorePracticeQuiz = async (quizId: string) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}/restore`,
    {
      method: "POST",
    },
  );
  return response.json();
};

export const getPracticeAnalytics = async () => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/analytics`,
  );
  return response.json();
};

export const getCategoryInsights = async (
  category: string,
  forceRefresh: boolean = false,
) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/analytics/category-insight`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, forceRefresh }),
    },
  );
  const data = await response.json();
  // Include status code in response for rate limit handling
  return { ...data, status: response.status };
};

export const permanentlyDeletePracticeQuiz = async (quizId: string) => {
  const response = await apiCallWithAuth(
    `${API_BASE_URL}/api/practice-quizzes/${quizId}/permanent`,
    {
      method: "DELETE",
    },
  );
  return response.json();
};
