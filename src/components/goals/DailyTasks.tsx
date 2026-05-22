"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, AlertCircle, Sparkles } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import {
  dailyTasksService,
  DailyTask,
  CreateDailyTaskData,
  UpdateDailyTaskData,
  DailyTasksAnalytics,
} from "@/services/dailyTasksService";
import { useToast } from "@/contexts/ToastContext";

import StudyPlannerModal from "./StudyPlannerModal";
import AddTaskForm from "./AddTaskForm";
import DailyTaskItem from "./DailyTaskItem";
import GoalsSkeleton from "./GoalsSkeleton";

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
  const { isLoggedIn, isLoading: authLoading, refreshPoints } = useAuth();
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [selectedDate, setSelectedDate] =
    useState<string>(getLocalDateString());
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
  const { showErrorToast } = useToast();

  const [showStudyPlanner, setShowStudyPlanner] = useState(false);

  // Stable callbacks for the StudyPlannerModal to prevent re-renders
  const handleCloseStudyPlanner = useCallback(
    () => setShowStudyPlanner(false),
    [],
  );
  const handleTasksCreated = useCallback(async () => {
    const fetchedTasks = await dailyTasksService.getDailyTasks(selectedDate);
    setTasks(fetchedTasks);
    const analyticsData = await dailyTasksService.getStreakInfo();
    setAnalytics(analyticsData);
  }, [selectedDate]);

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

  // Load tasks when date or auth changes
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedTasks =
          await dailyTasksService.getDailyTasks(selectedDate);
        setTasks(fetchedTasks);
      } catch (error) {
        console.error("Error loading daily tasks:", error);
        let errorMessage = "Failed to load daily tasks";
        if (error instanceof Error) {
          if (
            error.message.includes("Failed to fetch") ||
            error.message.includes("fetch") ||
            error.message.includes("Failed to connect to backend server")
          ) {
            errorMessage = "Failed to connect to the backend server.";
          } else if (
            error.message.includes("http") ||
            error.message.includes("api/")
          ) {
            errorMessage = "The API request failed.";
          } else {
            errorMessage = error.message;
          }
        }
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isLoggedIn) {
      loadTasks();
    } else if (!authLoading && !isLoggedIn) {
      setIsLoading(false);
      setError("Please log in to view your daily tasks");
    }
  }, [authLoading, isLoggedIn, selectedDate]);

  // Load analytics (streak info) only on initial load or auth change
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const analyticsData = await dailyTasksService.getStreakInfo();
        setAnalytics(analyticsData);
      } catch (error) {
        console.error("Error loading analytics:", error);
      }
    };

    if (!authLoading && isLoggedIn) {
      loadAnalytics();
    }
  }, [authLoading, isLoggedIn]);

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
      showErrorToast(error);
    }
  };

  const updateTask = async (
    taskId: string,
    updateData: UpdateDailyTaskData,
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
      showErrorToast(error);
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
      showErrorToast(error);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    setTogglingTaskId(taskId);

    // Optimistic Update
    const previousTasks = [...tasks];
    const previousAnalytics = { ...analytics };

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task._id === taskId
          ? { ...task, isCompletedToday: !task.isCompletedToday }
          : task,
      ),
    );

    try {
      const result = await dailyTasksService.toggleTaskCompletion(
        taskId,
        selectedDate,
      );

      // Fetch in background to sync state
      dailyTasksService
        .getDailyTasks(selectedDate)
        .then(setTasks)
        .catch(console.error);
      dailyTasksService.getStreakInfo().then(setAnalytics).catch(console.error);

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

      // Notify StreakIcon in navbar to refresh immediately
      window.dispatchEvent(new Event("streak-updated"));

      // Show success message if all tasks are completed
      if (result.allTasksCompleted && result.isCompleted) {
        if (process.env.NODE_ENV === "development") {
          console.log("All daily tasks completed for today!");
        }
      }
    } catch (error) {
      console.error("Error toggling task completion:", error);
      // Revert optimistic update
      setTasks(previousTasks);
      setAnalytics(previousAnalytics);

      showErrorToast(error);
    } finally {
      setTogglingTaskId((currentTaskId) =>
        currentTaskId === taskId ? null : currentTaskId,
      );
    }
  };

  // Show full page loading state only on initial auth load
  if (authLoading) {
    return <GoalsSkeleton includeTabs={false} mode="daily" />;
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
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors inline-block"
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
                      let errorMessage = "Failed to load daily tasks";
                      if (error instanceof Error) {
                        if (
                          error.message.includes("Failed to fetch") ||
                          error.message.includes("fetch") ||
                          error.message.includes("Failed to connect")
                        ) {
                          errorMessage =
                            "Failed to connect to the backend server.";
                        } else if (
                          error.message.includes("http") ||
                          error.message.includes("api/")
                        ) {
                          errorMessage = "The API request failed.";
                        } else {
                          errorMessage = error.message;
                        }
                      }
                      setError(errorMessage);
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
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
            className={`px-6 py-3 rounded-lg shadow-lg ${pointsAnimation.isDeduction
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
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm rounded-lg">
        <div className="flex items-center justify-between gap-2 sm:gap-4 mb-2 md:mb-0">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-3">
              <BackButton />
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                Daily Tasks
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group hidden sm:block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 animate-pulse transition duration-500"></div>
              <button
                onClick={() => setShowStudyPlanner(true)}
                className="relative flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 rounded-lg"
                title="AI Study Planner"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Study Planner</span>
                <span className="sm:hidden">AI Plan</span>
              </button>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black px-4 py-2.5 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors whitespace-nowrap flex-shrink-0 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
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
      <div className="bg-white dark:bg-gray-800 p-4 shadow-sm mt-2 sm:mt-4 rounded-lg">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* AI Plan Button - Mobile Only */}
            <div className="relative group sm:hidden flex-1">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 animate-pulse transition duration-500"></div>
              <button
                onClick={() => setShowStudyPlanner(true)}
                className="relative w-full flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black py-2 text-[13px] hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors whitespace-nowrap rounded-lg"
                title="AI Study Planner"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Planner</span>
              </button>
            </div>

            {/* Date Picker */}
            <input
              type="date"
              id="selectedDate"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-colors cursor-pointer dark:[color-scheme:dark] min-w-0 rounded-lg"
            />
          </div>
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
                  className={`flex flex-col items-center px-2 py-2 flex-1 min-w-0 transition-all ${borderClass} ${isSelected
                    ? "bg-gray-50 dark:bg-gray-700 text-black dark:text-white"
                    : day.isToday
                      ? "bg-purple-50/30 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                >
                  <span
                    className={`text-xs font-medium flex items-center gap-1 ${day.isToday && !isSelected
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
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 p-3 flex items-center gap-2 mt-2 sm:mt-4 rounded-xl">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-[13px] sm:text-sm text-amber-700 dark:text-amber-300">
            <span>
              You are viewing tasks for a{" "}
              {selectedDate < getLocalDateString() ? "past" : "future"} date.
            </span>
            <span className="hidden sm:inline">
              {" "}
              You can only mark tasks as complete for today.
            </span>
          </p>
        </div>
      )}

      {/* Tasks Display */}
      <div className="space-y-2 sm:space-y-4 mt-2 sm:mt-4">
        {isLoading ? (
          <div className="space-y-2 sm:space-y-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800/50 flex items-start gap-3 sm:gap-4 animate-pulse min-h-[90px] sm:min-h-[110px] rounded-lg"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 dark:border-gray-600 shrink-0 mt-0.5 rounded-md" />
                <div className="flex-1 space-y-3 sm:space-y-4">
                  <div className="space-y-2 sm:space-y-2.5">
                    <div className="h-4 sm:h-5 w-[60%] sm:w-[40%] bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-3 sm:h-4 w-[90%] sm:w-[85%] bg-gray-100 dark:bg-gray-800/60 rounded" />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-3 sm:h-3.5 w-20 sm:w-24 bg-gray-100 dark:bg-gray-800/50 rounded" />
                      <div className="h-4 sm:h-5 w-12 sm:w-20 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-full" />
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg" />
                      <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-8 text-center shadow-sm flex flex-col justify-center items-center min-h-[calc(100dvh-320px)] rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/goals/dTasks.png"
              alt="Goals Art"
              className="w-full max-w-[280px] sm:max-w-[380px] h-auto mx-auto object-contain mb-4"
            />
            <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
              No daily tasks for this date
            </h3>
            <button
              onClick={() => setShowAddTask(true)}
              className="bg-black dark:bg-white text-white dark:text-black px-16 py-2 mb-8 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
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
        onClose={handleCloseStudyPlanner}
        onTasksCreated={handleTasksCreated}
      />
    </>
  );
};

export default DailyTasks;
