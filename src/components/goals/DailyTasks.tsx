"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  AlertCircle,
  Target,
  TrendingUp,
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
    dateStarted: new Date().toISOString().split("T")[0],
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
        dateStarted: new Date(editingTask.dateStarted)
          .toISOString()
          .split("T")[0],
        dateEnded: new Date(editingTask.dateEnded).toISOString().split("T")[0],
      });
    } else {
      const today = new Date().toISOString().split("T")[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dateStarted: today,
        dateEnded: nextWeek.toISOString().split("T")[0],
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

      if (startDate >= endDate) {
        newErrors.dateEnded = "End date must be after start date";
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
    <div className="bg-white dark:bg-gray-800 p-4 shadow-sm border-t border-gray-200 dark:border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {editingTask ? "Edit Daily Task" : "Add Daily Task"}
        </h3>
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
                className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none ${
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Right side: Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
              placeholder="Enter task description (optional)"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 text-black dark:text-white transition-colors focus:outline-none ${
                errors.dateStarted
                  ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
              }`}
              disabled={isSubmitting}
            />
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
              className={`w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 text-black dark:text-white transition-colors focus:outline-none ${
                errors.dateEnded
                  ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                  : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
              }`}
              disabled={isSubmitting}
            />
            {errors.dateEnded && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {errors.dateEnded}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm border-2 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
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
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [analytics, setAnalytics] = useState<DailyTasksAnalytics>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveTasks: 0,
    completedToday: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      // Show success message if all tasks are completed
      if (result.allTasksCompleted && result.isCompleted) {
        // You could show a toast notification here
        console.log("🎉 All daily tasks completed for today!");
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update task"
      );
    }
  };

  const isToday = (dateString: string): boolean => {
    return dateString === new Date().toISOString().split("T")[0];
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
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors inline-block"
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
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
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
      {/* Header with Analytics */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Daily Tasks
            </h1>
            <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {analytics.currentStreak} day streak
              </span>
              <span>•</span>
              <span>{analytics.completedToday} completed today</span>
              <span>•</span>
              <span>{analytics.totalActiveTasks} active tasks</span>
            </div>
          </div>
          <button
            onClick={() => setShowAddTask(true)}
            className="flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
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

      {/* Date Selector */}
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <label
              htmlFor="selectedDate"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Select Date
            </label>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              id="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md text-sm focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-colors"
            />
            {isToday(selectedDate) ? (
              <div className="text-xs text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-md">
                Today
              </div>
            ) : (
              <button
                onClick={() =>
                  setSelectedDate(new Date().toISOString().split("T")[0])
                }
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1 rounded-md transition-colors"
              >
                Go to Today
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tasks Display */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No daily tasks for this date
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first daily task to get started
            </p>
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Create Task
            </button>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task._id}
              className={`rounded-md shadow-sm border p-4 transition-all duration-200 ${
                task.isCompletedToday
                  ? "ring-1 ring-green-200 dark:ring-green-800 bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                  : task.priority === "high"
                  ? "bg-red-50/30 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 hover:bg-red-50/40 dark:hover:bg-red-950/30 hover:shadow-md"
                  : task.priority === "medium"
                  ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 hover:shadow-md"
                  : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:shadow-md"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleTaskCompletion(task._id)}
                  className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center mt-0.5 transition-all duration-200 ${
                    task.isCompletedToday
                      ? "bg-green-600 dark:bg-green-700 border-green-600 dark:border-green-700 text-white shadow-sm"
                      : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {task.isCompletedToday && <CheckCircle className="w-4 h-4" />}
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
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {new Date(task.dateStarted).toLocaleDateString()} -{" "}
                        {new Date(task.dateEnded).toLocaleDateString()}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-medium ${
                        task.priority === "high"
                          ? "bg-red-500 dark:bg-red-700 text-white dark:text-red-100 border border-red-600 dark:border-red-600"
                          : task.priority === "medium"
                          ? "bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100 border border-amber-600 dark:border-amber-600"
                          : "bg-emerald-500 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-600 dark:border-emerald-600"
                      }`}
                    >
                      {task.priority} priority
                    </span>
                    {task.lastCompletedDate && (
                      <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span>
                          Last completed:{" "}
                          {new Date(
                            task.lastCompletedDate
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {!task.isActive && (
                      <div className="text-orange-600 dark:text-orange-400 text-xs bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-md">
                        Inactive
                      </div>
                    )}
                  </div>
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
