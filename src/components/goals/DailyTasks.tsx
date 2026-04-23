"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  AlertCircle,
  TrendingUp,
  ChevronLeft,
  Sparkles,
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
import StudyPlannerModal from "./StudyPlannerModal";
import AddTaskForm from "./AddTaskForm";
import DailyTaskItem from "./DailyTaskItem";

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

  const [showStudyPlanner, setShowStudyPlanner] = useState(false);

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
          <div className="flex items-center gap-2">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 animate-pulse transition duration-500"></div>
                <button
                  onClick={() => setShowStudyPlanner(true)}
                  className="relative flex items-center justify-center gap-1 sm:gap-1.5 bg-black dark:bg-white text-white dark:text-black px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs md:text-sm hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0"
                  style={{ borderRadius: 0 }}
                  title="AI Study Planner"
                >
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">AI Study Planner</span>
                  <span className="sm:hidden">AI Plan</span>
                </button>
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
                ? day.isToday
                  ? "Today"
                  : `${dayName} (${dayNumber}D)`
                : day.isToday
                ? `Today (${dayNumber}${suffix(dayNumber)} ${monthName})`
                : `${dayName} (${dayNumber}${suffix(dayNumber)} ${monthName})`;

              // Border logic: match the Daily Tasks/Goals toggle style
              // Selected days get black/white bottom border, today gets purple border, others transparent
              const borderClass = isSelected
                ? "border-b-2 border-black dark:border-white"
                : day.isToday
                ? "border-b-2 border-purple-500"
                : "border-b-2 border-transparent";

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex flex-col items-center px-3 py-2 flex-1 min-w-0 transition-all ${borderClass} ${
                    isSelected
                      ? "bg-gray-50 dark:bg-gray-700 text-black dark:text-white"
                      : day.isToday
                      ? "bg-purple-50/30 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${
                      day.isToday && !isSelected
                        ? "text-purple-600 dark:text-purple-400"
                        : ""
                    }`}
                  >
                    {formatted}
                  </span>
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
            <DailyTaskItem
              key={task._id}
              task={task}
              togglingTaskId={togglingTaskId}
              isToday={isToday}
              onToggleCompletion={toggleTaskCompletion}
              onEdit={setEditingTask}
              onDelete={deleteTask}
            />
          ))
        )}
      </div>
      <StudyPlannerModal 
        isOpen={showStudyPlanner}
        onClose={() => setShowStudyPlanner(false)}
        selectedDate={selectedDate}
        onTasksCreated={async () => {
          const fetchedTasks = await dailyTasksService.getDailyTasks(selectedDate);
          setTasks(fetchedTasks);
          const analyticsData = await dailyTasksService.getStreakInfo();
          setAnalytics(analyticsData);
        }}
      />
    </>
  );
};

export default DailyTasks;
