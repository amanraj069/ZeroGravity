"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  dailyTasksService,
  DailyTask,
  CreateDailyTaskData,
  UpdateDailyTaskData,
  DailyTasksAnalytics,
} from "@/services/dailyTasksService";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PointsAnimation {
  points: number;
  isDeduction: boolean;
  taskId: string;
}

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper function to get upcoming days (today + next 6 days = 1 week)
const getUpcomingDays = (): {
  date: string;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}[] => {
  const days: {
    date: string;
    dayName: string;
    dayNumber: number;
    isToday: boolean;
  }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    days.push({
      date: getLocalDateString(date),
      dayName: dayNames[date.getDay()],
      dayNumber: date.getDate(),
      isToday: i === 0,
    });
  }

  return days;
};

interface AddTaskFormProps {
  editingTask: DailyTask | null;
  onAddTask: (taskData: CreateDailyTaskData) => Promise<void>;
  onUpdateTask?: (
    taskId: string,
    updateData: UpdateDailyTaskData
  ) => Promise<void>;
  onCancel: () => void;
}

const AddTaskForm: React.FC<AddTaskFormProps> = ({
  editingTask,
  onAddTask,
  onUpdateTask,
  onCancel,
}) => {
  const [formData, setFormData] = useState<CreateDailyTaskData>({
    title: "",
    description: "",
    priority: "medium",
    dateStarted: getLocalDateString(),
    dateEnded: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<
    Partial<Record<keyof CreateDailyTaskData, string>>
  >({});

  useEffect(() => {
    if (editingTask) {
      setFormData({
        title: editingTask.title,
        description: editingTask.description || "",
        priority: editingTask.priority || "medium",
        dateStarted: getLocalDateString(new Date(editingTask.dateStarted)),
        dateEnded: getLocalDateString(new Date(editingTask.dateEnded)),
      });
    } else {
      const today = getLocalDateString();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dateStarted: today,
        dateEnded: getLocalDateString(nextWeek),
      });
    }
    setErrors({});
    setIsSubmitting(false);
  }, [editingTask]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof CreateDailyTaskData]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateDailyTaskData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.dateStarted) {
      newErrors.dateStarted = "Start date is required";
    }

    if (!formData.dateEnded) {
      newErrors.dateEnded = "End date is required";
    }

    if (formData.dateStarted && formData.dateEnded) {
      const startDate = new Date(formData.dateStarted);
      const endDate = new Date(formData.dateEnded);

      if (startDate > endDate) {
        newErrors.dateEnded = "End date must be on or after start date";
      }

      // When editing, end date must be after today
      if (editingTask) {
        const today = new Date(getLocalDateString());
        if (endDate <= today) {
          newErrors.dateEnded = "End date must be after today";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const taskData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim(),
      };

      if (editingTask && onUpdateTask) {
        await onUpdateTask(editingTask._id, taskData);
      } else {
        await onAddTask(taskData);
      }
    } catch (error) {
      console.error("Error saving daily task:", error);
      setErrors({
        title: error instanceof Error ? error.message : "Failed to save task",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 p-4 shadow-sm border-t border-gray-200 dark:border-gray-700"
      style={{ borderRadius: 0, position: "relative" }}
    >
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {editingTask ? "Edit Daily Task" : "Add Daily Task"}
        </h3>
        <button
          type="button"
          aria-label="Cancel"
          className="text-gray-400 hover:text-red-500 text-2xl font-bold"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            position: "absolute",
            top: 16,
            right: 16,
          }}
          onClick={onCancel}
        >
          &times;
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left side: Title and Priority */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border text-sm bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none ${
                  errors.title
                    ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                    : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                }`}
                placeholder="Enter task title"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                  {errors.title}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Right side: Description (single line) and Date Range */}
          <div className="space-y-4">
            {/* Description - single line */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                placeholder="Enter task description (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* Date Range - side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="dateStarted"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  Start Date *
                </label>
                <input
                  type="date"
                  id="dateStarted"
                  name="dateStarted"
                  value={formData.dateStarted}
                  onChange={handleInputChange}
                  onClick={(e) =>
                    !editingTask &&
                    (e.target as HTMLInputElement).showPicker?.()
                  }
                  className={`w-full px-3 py-2 border text-sm bg-white dark:bg-gray-900 text-black dark:text-white transition-colors focus:outline-none dark:[color-scheme:dark] ${
                    errors.dateStarted
                      ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                  } ${
                    editingTask
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                      : "cursor-pointer"
                  }`}
                  disabled={isSubmitting || !!editingTask}
                  title={
                    editingTask ? "Start date cannot be changed" : undefined
                  }
                />
                {editingTask && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Start date cannot be changed
                  </p>
                )}
                {errors.dateStarted && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.dateStarted}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dateEnded"
                  className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  <Calendar className="w-4 h-4 mr-1.5" />
                  End Date *
                </label>
                <input
                  type="date"
                  id="dateEnded"
                  name="dateEnded"
                  value={formData.dateEnded}
                  onChange={handleInputChange}
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  min={
                    editingTask
                      ? (() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return getLocalDateString(tomorrow);
                        })()
                      : undefined
                  }
                  className={`w-full px-3 py-2 border text-sm bg-white dark:bg-gray-900 text-black dark:text-white transition-colors focus:outline-none cursor-pointer dark:[color-scheme:dark] ${
                    errors.dateEnded
                      ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                  }`}
                  disabled={isSubmitting}
                />
                {editingTask && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    End date must be after today
                  </p>
                )}
                {errors.dateEnded && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.dateEnded}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm border-2 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Saving..."
              : editingTask
              ? "Update Task"
              : "Add Task"}
          </button>
        </div>
      </form>
    </div>
  );
};

const DailyTasks: React.FC = () => {
  const router = useRouter();
  const { isLoggedIn, isLoading: authLoading, refreshPoints } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    getLocalDateString()
  );
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [analytics, setAnalytics] = useState<DailyTasksAnalytics>({
    currentStreak: 0,
    longestStreak: 0,
    streakLast: null,
    totalActiveTasks: 0,
    completedToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsAnimation, setPointsAnimation] =
    useState<PointsAnimation | null>(null);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if selected date is today
  const isToday = selectedDate === getLocalDateString();

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load tasks and analytics
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedTasks = await dailyTasksService.getDailyTasks(
          selectedDate
        );
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error loading daily tasks:", error);
        setError(
          error instanceof Error ? error.message : "Failed to load daily tasks"
        );
      } finally {
        setIsLoading(false);
      }
    };

    const loadAnalytics = async () => {
      try {
        const analyticsData = await dailyTasksService.getStreakInfo();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Error loading analytics:", error);
      }
    };

    if (!authLoading && isLoggedIn) {
      loadTasks();
      loadAnalytics();
    } else if (!authLoading && !isLoggedIn) {
      setIsLoading(false);
      setError("Please log in to view your daily tasks");
    }
  }, [authLoading, isLoggedIn, selectedDate]);

  const addTask = async (taskData: CreateDailyTaskData) => {
    try {
      await dailyTasksService.createDailyTask(taskData);
      // Reload tasks and analytics
      const fetchedTasks = await dailyTasksService.getDailyTasks(selectedDate);
      setTasks(fetchedTasks);
      const analyticsData = await dailyTasksService.getStreakInfo();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error creating daily task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create task"
      );
    }
  };

  const updateTask = async (
    taskId: string,
    updateData: UpdateDailyTaskData
  ) => {
    try {
      await dailyTasksService.updateDailyTask(taskId, updateData);
      // Reload tasks and analytics
      const fetchedTasks = await dailyTasksService.getDailyTasks(selectedDate);
      setTasks(fetchedTasks);
      const analyticsData = await dailyTasksService.getStreakInfo();
      setAnalytics(analyticsData);
      setEditingTask(null);
    } catch (error) {
      console.error("Error updating daily task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update task"
      );
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      await dailyTasksService.deleteDailyTask(taskId);
      // Reload tasks and analytics
      const fetchedTasks = await dailyTasksService.getDailyTasks(selectedDate);
      setTasks(fetchedTasks);
      const analyticsData = await dailyTasksService.getStreakInfo();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error("Error deleting daily task:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete task"
      );
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    setTogglingTaskId(taskId);
    try {
      const result = await dailyTasksService.toggleTaskCompletion(
        taskId,
        selectedDate
      );
      // Reload tasks and analytics
      const fetchedTasks = await dailyTasksService.getDailyTasks(selectedDate);
      setTasks(fetchedTasks);
      const analyticsData = await dailyTasksService.getStreakInfo();
      setAnalytics(analyticsData);

      // Show points animation if points were awarded
      if (result.pointsAwarded && result.pointsAwarded > 0) {
        setPointsAnimation({
          points: result.pointsAwarded,
          isDeduction: false,
          taskId,
        });
        // Clear animation after 2 seconds (matches CSS animation)
        setTimeout(() => setPointsAnimation(null), 2000);
      }

      // Show points deduction animation if points were deducted
      if (result.pointsDeducted && result.pointsDeducted > 0) {
        setPointsAnimation({
          points: result.pointsDeducted,
          isDeduction: true,
          taskId,
        });
        // Clear animation after 2 seconds (matches CSS animation)
        setTimeout(() => setPointsAnimation(null), 2000);
      }

      // Refresh user points in context
      await refreshPoints();

      // Show success message if all tasks are completed
      if (result.allTasksCompleted && result.isCompleted) {
        console.log("All daily tasks completed for today!");
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update task"
      );
    } finally {
      setTogglingTaskId(null);
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <LoadingSpinner
        size="lg"
        text={
          authLoading ? "Checking authentication..." : "Loading daily tasks..."
        }
        fullScreen
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400 mx-auto mb-3" />
              <p className="text-red-600 dark:text-red-400 mb-3">{error}</p>
              {!isLoggedIn ? (
                <a
                  href="/login"
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors inline-block"
                >
                  Go to Login
                </a>
              ) : (
                <button
                  onClick={async () => {
                    try {
                      setIsLoading(true);
                      setError(null);
                      const fetchedTasks =
                        await dailyTasksService.getDailyTasks(selectedDate);
                      setTasks(fetchedTasks);
                    } catch (error) {
                      console.error("Error loading daily tasks:", error);
                      setError(
                        error instanceof Error
                          ? error.message
                          : "Failed to load daily tasks"
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Points Animation - Top Center Popup */}
      {pointsAnimation && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-fade-in-down">
          <div
            className={`px-6 py-3 shadow-lg ${
              pointsAnimation.isDeduction
                ? "bg-red-600 text-white"
                : "bg-black dark:bg-white text-white dark:text-black"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">
                {pointsAnimation.isDeduction ? "-" : "+"}
                {pointsAnimation.points}
              </span>
              <span className="text-sm">points</span>
            </div>
          </div>
        </div>
      )}

      {/* Header with Analytics */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Daily Tasks
            </h1>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center justify-center gap-1 sm:gap-1.5 bg-black dark:bg-white text-white dark:text-black px-2 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0"
            style={{ borderRadius: 0 }}
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Add Task</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 w-full">
          <span className="flex items-center gap-1 whitespace-nowrap">
            <TrendingUp className="w-3 h-3 flex-shrink-0" />
            {analytics.currentStreak} day streak
          </span>
          <span className="flex-shrink-0">•</span>
          <span className="whitespace-nowrap">
            {analytics.completedToday} completed today
          </span>
          <span className="flex-shrink-0">•</span>
          <span className="whitespace-nowrap">
            {analytics.totalActiveTasks} active tasks
          </span>
        </div>
      </div>

      {/* Expandable Add/Edit Task Form */}
      {(showAddTask || editingTask) && (
        <AddTaskForm
          editingTask={editingTask}
          onAddTask={async (taskData) => {
            await addTask(taskData);
            setShowAddTask(false);
          }}
          onUpdateTask={async (taskId, updateData) => {
            await updateTask(taskId, updateData);
            setEditingTask(null);
          }}
          onCancel={() => {
            setShowAddTask(false);
            setEditingTask(null);
          }}
        />
      )}

      {/* Date Selector with Upcoming Days */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm mt-2 sm:mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Date Picker */}
          <input
            type="date"
            id="selectedDate"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
            className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-colors cursor-pointer dark:[color-scheme:dark]"
          />
          {/* Upcoming Days - full width */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
            {getUpcomingDays().map((day) => {
              const isSelected = selectedDate === day.date;
              // Format as 'Fri (3rd Dec)'
              const dateObj = new Date(day.date);
              const dayName = day.dayName;
              const dayNumber = dateObj.getDate();
              const monthName = dateObj.toLocaleString("default", {
                month: "short",
              });
              const suffix = (n: number) => {
                if (n >= 11 && n <= 13) return "th";
                switch (n % 10) {
                  case 1:
                    return "st";
                  case 2:
                    return "nd";
                  case 3:
                    return "rd";
                  default:
                    return "th";
                }
              };
              // Mobile format: "Sat (13D)", Desktop format: "Sat (13th Dec)"
              const formatted = isMobile
                ? `${dayName} (${dayNumber}D)`
                : `${dayName} (${dayNumber}${suffix(dayNumber)} ${monthName})`;
              // Border logic: match the Daily Tasks/Goals toggle style
              // Selected days get white bottom border, unselected days have transparent border
              const borderClass = isSelected
                ? "border-b-2 border-black dark:border-white"
                : "border-b-2 border-transparent";
              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex flex-col items-center px-3 py-2 flex-1 min-w-0 transition-colors ${borderClass} ${
                    isSelected
                      ? "bg-gray-50 dark:bg-gray-700 text-black dark:text-white"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="text-xs font-medium">{formatted}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Read-only indicator for non-today dates */}
      {!isToday && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2 mt-2 sm:mt-4">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            You are viewing tasks for a{" "}
            {selectedDate < getLocalDateString() ? "past" : "future"} date. You
            can only mark tasks as complete for today.
          </p>
        </div>
      )}

      {/* Tasks Display */}
      <div className="space-y-2 sm:space-y-4 mt-2 sm:mt-4">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 text-center shadow-sm flex flex-col justify-center items-center min-h-[calc(100dvh-360px)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goals/dTasks.png"
              alt="Goals Art"
              className="w-128 h-72 mx-auto object-contain"
            />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No daily tasks for this date
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first daily task to get started
            </p>
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-black dark:bg-white text-white dark:text-black px-16 py-2 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Create Task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`shadow-sm border p-4 transition-all duration-200 relative ${
                togglingTaskId === task._id
                  ? "opacity-75 pointer-events-none"
                  : ""
              } ${
                task.isCompletedToday
                  ? "ring-1 ring-green-200 dark:ring-green-800 bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : task.priority === "high"
                  ? "bg-red-50/30 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 hover:bg-red-50/40 dark:hover:bg-red-950/30 hover:shadow-md"
                  : task.priority === "medium"
                  ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 hover:shadow-md"
                  : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:shadow-md"
              }`}
            >
              {togglingTaskId === task._id && (
                <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-6 h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent  animate-spin" />
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      Updating...
                    </span>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <button
                  onClick={() =>
                    isToday && !togglingTaskId && toggleTaskCompletion(task._id)
                  }
                  disabled={
                    !isToday || togglingTaskId === task._id || !!togglingTaskId
                  }
                  title={
                    !isToday
                      ? "You can only mark tasks for today"
                      : togglingTaskId === task._id
                      ? "Updating task..."
                      : togglingTaskId
                      ? "Please wait for the current update to complete"
                      : undefined
                  }
                  className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center mt-0.5 transition-all duration-200 relative ${
                    togglingTaskId === task._id
                      ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
                      : task.isCompletedToday
                      ? "bg-green-600 dark:bg-green-700 border-green-600 dark:border-green-700 text-white shadow-sm"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                  } ${
                    !isToday || togglingTaskId
                      ? "opacity-70 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  {togglingTaskId === task._id ? (
                    <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent animate-spin" />
                  ) : (
                    task.isCompletedToday && <CheckCircle className="w-4 h-4" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3
                        className={`font-medium text-sm sm:text-base ${
                          task.isCompletedToday
                            ? "line-through text-gray-500 dark:text-gray-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p
                          className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                            task.isCompletedToday
                              ? "text-gray-400 dark:text-gray-500"
                              : "text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={() => setEditingTask(task)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTask(task._id)}
                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Task Details */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(task.dateStarted).toLocaleDateString()} -{" "}
                          {new Date(task.dateEnded).toLocaleDateString()}
                        </span>
                      </div>
                      {/* Desktop priority tag - original position and text */}
                      <span
                        className={`hidden md:inline-block px-2 py-0.5 text-xs font-medium ${
                          task.priority === "high"
                            ? "bg-red-500 dark:bg-red-700 text-white dark:text-red-100 border border-red-600 dark:border-red-600"
                            : task.priority === "medium"
                            ? "bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100 border border-amber-600 dark:border-amber-600"
                            : "bg-emerald-500 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-600 dark:border-emerald-600"
                        }`}
                      >
                        {task.priority} priority
                      </span>
                      {!task.isActive && (
                        <div className="text-orange-600 dark:text-orange-400 text-xs bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5">
                          Inactive
                        </div>
                      )}
                    </div>
                    {task.lastCompletedDate && (
                      <span className="text-green-600 dark:text-green-400">
                        Last completed:{" "}
                        {new Date(task.lastCompletedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Mobile priority tag - bottom right, no rounded corners */}
                  <span
                    className={`md:hidden absolute bottom-4 right-4 px-2 py-0.5 text-xs font-medium ${
                      task.priority === "high"
                        ? "bg-red-500 dark:bg-red-700 text-white dark:text-red-100 border border-red-600 dark:border-red-600"
                        : task.priority === "medium"
                        ? "bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100 border border-amber-600 dark:border-amber-600"
                        : "bg-emerald-500 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-600 dark:border-emerald-600"
                    }`}
                  >
                    {task.priority.charAt(0).toUpperCase() +
                      task.priority.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default DailyTasks;
