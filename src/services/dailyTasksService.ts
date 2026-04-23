import { apiCallWithAuth, API_ENDPOINTS } from "@/config/api";

export interface DailyTask {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dateStarted: string;
  dateEnded: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  lastCompletedDate?: string;
  isActive: boolean;
  isCompletedToday?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyTaskData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dateStarted: string;
  dateEnded: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
}

export interface UpdateDailyTaskData extends Partial<CreateDailyTaskData> {
  isActive?: boolean;
}

export interface DailyTasksAnalytics {
  currentStreak: number;
  longestStreak: number;
  streakLast: string | null;
  totalActiveTasks: number;
  completedToday: number;
}

export interface CompletionHistory {
  [date: string]: Array<{
    _id: string;
    taskId: string;
    completedDate: string;
    completedAt: string;
  }>;
}

// ─── Study Planner Types ───────────────────────────────────────────────────

export interface StudyPlanTask {
  date: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  selected: boolean;
}

export interface StudyPlanQuota {
  used: number;
  limit: number;
  remaining: number;
}

export interface GenerateStudyPlanResponse {
  success: boolean;
  plan?: StudyPlanTask[];
  topic?: string;
  startDate?: string;
  endDate?: string;
  hoursPerDay?: number;
  quota?: StudyPlanQuota;
  message?: string;
  fallbackOccurred?: boolean;
  modelUsed?: string;
}

export interface BulkCreateResponse {
  success: boolean;
  data?: DailyTask[];
  count?: number;
  message?: string;
}

class DailyTasksService {
  // Get all daily tasks for a user (optionally for a specific date)
  async getDailyTasks(date?: string): Promise<DailyTask[]> {
    const url = date
      ? `${API_ENDPOINTS.DAILY_TASKS.LIST}?date=${encodeURIComponent(date)}`
      : API_ENDPOINTS.DAILY_TASKS.LIST;

    const response = await apiCallWithAuth(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Get a specific daily task by ID
  async getDailyTask(taskId: string): Promise<DailyTask> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.DAILY_TASKS.GET(taskId)
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Create a new daily task
  async createDailyTask(taskData: CreateDailyTaskData): Promise<DailyTask> {
    const response = await apiCallWithAuth(API_ENDPOINTS.DAILY_TASKS.CREATE, {
      method: "POST",
      body: JSON.stringify(taskData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Update a daily task
  async updateDailyTask(
    taskId: string,
    updateData: UpdateDailyTaskData
  ): Promise<DailyTask> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.DAILY_TASKS.UPDATE(taskId),
      {
        method: "PUT",
        body: JSON.stringify(updateData),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Toggle task completion for today (or specified date)
  async toggleTaskCompletion(
    taskId: string,
    date?: string
  ): Promise<{
    taskId: string;
    isCompleted: boolean;
    allTasksCompleted: boolean;
    pointsAwarded?: number;
    pointsDeducted?: number;
    pointsBreakdown?: { reason: string; points: number }[];
    totalPoints?: number;
  }> {
    const body = date ? JSON.stringify({ date }) : JSON.stringify({});
    const response = await apiCallWithAuth(
      API_ENDPOINTS.DAILY_TASKS.TOGGLE_COMPLETION(taskId),
      {
        method: "PATCH",
        body,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Delete a daily task
  async deleteDailyTask(taskId: string): Promise<void> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.DAILY_TASKS.DELETE(taskId),
      {
        method: "DELETE",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }
  }

  // Get streak information
  async getStreakInfo(): Promise<DailyTasksAnalytics> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.DAILY_TASKS.STREAK_INFO
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // Get completion history
  async getCompletionHistory(
    startDate?: string,
    endDate?: string
  ): Promise<{
    stats: CompletionHistory;
    totalCompletions: number;
  }> {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);

    const queryString = params.toString();
    const url = queryString
      ? `${API_ENDPOINTS.DAILY_TASKS.COMPLETION_HISTORY}?${queryString}`
      : API_ENDPOINTS.DAILY_TASKS.COMPLETION_HISTORY;

    const response = await apiCallWithAuth(url);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.data;
  }

  // ─── Study Planner Methods ───────────────────────────────────────────────

  // Generate an AI study plan
  async generateStudyPlan(
    topic: string,
    startDate: string,
    endDate: string,
    hoursPerDay: number = 2
  ): Promise<GenerateStudyPlanResponse> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.STUDY_PLANNER.GENERATE,
      {
        method: "POST",
        body: JSON.stringify({ topic, startDate, endDate, hoursPerDay }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // Return the error with quota info for the UI to display
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
        quota: data.quota,
      };
    }

    return data;
  }

  // Bulk create study tasks from a generated plan
  async bulkCreateStudyTasks(
    tasks: Array<{ date: string; title: string; description: string; priority: string }>
  ): Promise<BulkCreateResponse> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.STUDY_PLANNER.BULK_CREATE,
      {
        method: "POST",
        body: JSON.stringify({ tasks }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data;
  }

  // Get study plan generation quota
  async getStudyPlanQuota(): Promise<StudyPlanQuota> {
    const response = await apiCallWithAuth(
      API_ENDPOINTS.STUDY_PLANNER.QUOTA
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || `Request failed with status ${response.status}`
      );
    }

    if (!data.success) {
      throw new Error(data.message || "Request was not successful");
    }

    return data.quota;
  }

  // Helper method to format time for display
  static formatTime(time: string): string {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  // Helper method to get today's date string
  static getTodayDateString(): string {
    return new Date().toISOString().split("T")[0];
  }

  // Helper method to check if a date is today
  static isToday(dateString: string): boolean {
    return dateString === this.getTodayDateString();
  }
}

export const dailyTasksService = new DailyTasksService();
export default dailyTasksService;
