// API configuration
const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://localhost:9000";

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    SESSION_STATUS: `${API_BASE_URL}/api/auth/session-status`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    SIGNUP_STATUS: `${API_BASE_URL}/api/auth/signup-status`,
    TOGGLE_SIGNUP: `${API_BASE_URL}/api/auth/toggle-signup`,
    DEBUG: `${API_BASE_URL}/api/auth/debug`,
  },
  // Waitlist endpoints
  WAITLIST: {
    LIST: `${API_BASE_URL}/api/waitlist/list`,
    COUNT: `${API_BASE_URL}/api/waitlist/count`,
    JOIN: `${API_BASE_URL}/api/waitlist/join`,
  },
  // Goals endpoints
  GOALS: {
    LIST: `${API_BASE_URL}/api/goals`,
    CREATE: `${API_BASE_URL}/api/goals`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/goals/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/goals/${id}`,
    GET: (id: string) => `${API_BASE_URL}/api/goals/${id}`,
    TOGGLE_COMPLETION: (id: string) =>
      `${API_BASE_URL}/api/goals/${id}/toggle-completion`,
    TOGGLE_MILESTONE: (goalId: string, milestoneId: string) =>
      `${API_BASE_URL}/api/goals/${goalId}/milestones/${milestoneId}/toggle-completion`,
    TOGGLE_SUBTASK: (goalId: string, milestoneId: string, subtaskId: string) =>
      `${API_BASE_URL}/api/goals/${goalId}/milestones/${milestoneId}/subtasks/${subtaskId}/toggle-completion`,
    // New subtask management endpoints
    ADD_SUBTASKS: (goalId: string, milestoneId: string) =>
      `${API_BASE_URL}/api/goals/${goalId}/milestones/${milestoneId}/subtasks`,
    UPDATE_SUBTASKS: (goalId: string, milestoneId: string) =>
      `${API_BASE_URL}/api/goals/${goalId}/milestones/${milestoneId}/subtasks`,
    DELETE_SUBTASK: (goalId: string, milestoneId: string, subtaskId: string) =>
      `${API_BASE_URL}/api/goals/${goalId}/milestones/${milestoneId}/subtasks/${subtaskId}`,
    BY_CATEGORY: (category: string) =>
      `${API_BASE_URL}/api/goals/category/${category}`,
  },
  // Daily Tasks endpoints
  DAILY_TASKS: {
    LIST: `${API_BASE_URL}/api/daily-tasks`,
    CREATE: `${API_BASE_URL}/api/daily-tasks`,
    GET: (id: string) => `${API_BASE_URL}/api/daily-tasks/${id}`,
    UPDATE: (id: string) => `${API_BASE_URL}/api/daily-tasks/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/api/daily-tasks/${id}`,
    TOGGLE_COMPLETION: (id: string) =>
      `${API_BASE_URL}/api/daily-tasks/${id}/toggle-completion`,
    STREAK_INFO: `${API_BASE_URL}/api/daily-tasks/streak/info`,
    COMPLETION_HISTORY: `${API_BASE_URL}/api/daily-tasks/stats/history`,
  },
  // Quiz endpoints
  QUIZZES: {
    LIST: `${API_BASE_URL}/api/quizzes`,
    CREATE: `${API_BASE_URL}/api/quizzes`,
    PUBLISH: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/publish`,
    GET: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
    JOIN: `${API_BASE_URL}/api/quizzes/join`,
    LEAVE: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}/leave`,
    PARTICIPANTS: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/participants`,
    START: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}/start`,
    PUSH: (quizId: string, index: number) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/push/${index}`,
    ANSWER: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}/answer`,
    CURRENT: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/current`,
    LEADERBOARD: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/leaderboard`,
    END: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}/end`,
    END_QUESTION: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/end-question`,
    UNHOST: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}/unhost`,
    DELETE: (quizId: string) => `${API_BASE_URL}/api/quizzes/${quizId}`,
    LIST_DELETED: `${API_BASE_URL}/api/quizzes/deleted`,
    RESTORE: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/restore`,
    DELETE_PERMANENT: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/${quizId}/permanent`,
    ADMIN_LIST_PAST: (params?: string) =>
      `${API_BASE_URL}/api/quizzes/admin/past${params ? `?${params}` : ""}`,
    ADMIN_DETAILS: (quizId: string) =>
      `${API_BASE_URL}/api/quizzes/admin/${quizId}`,
  },
};

// Helper function for making API calls with consistent error handling
export const apiCall = async (url: string, options: RequestInit = {}) => {
  const defaultOptions: RequestInit = {
    credentials: "include", // This is crucial for sending cookies cross-origin
    mode: "cors", // Explicitly set CORS mode
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    console.log(`Making API call to: ${url}`, {
      method: defaultOptions.method || "GET",
      credentials: defaultOptions.credentials,
      headers: defaultOptions.headers,
    });

    const response = await fetch(url, defaultOptions);

    console.log(`API response status: ${response.status}`, {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    return response;
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
};

// Helper function for making API calls with token in header as fallback
export const apiCallWithAuth = async (
  url: string,
  options: RequestInit = {}
) => {
  // First try with cookies
  let response = await apiCall(url, options);

  // If we get 401 and we have a token in localStorage, try with Authorization header
  if (response.status === 401) {
    const token = localStorage.getItem("authToken");
    if (token) {
      console.log("Retrying with Authorization header...");
      const authOptions = {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      };
      response = await apiCall(url, authOptions);
    }
  }

  return response;
};

export default API_BASE_URL;
