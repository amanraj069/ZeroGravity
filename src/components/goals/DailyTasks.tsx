"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, AlertCircle, Sparkles, Brain, ChevronDown } from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { useAuth } from "@/contexts/AuthContext";
import { CurrencyIcon } from "@/components/CurrencyIcon";
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
  const [isMobile, setIsMobile] = useState(false);
  const { showErrorToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showStudyPlanner, setShowStudyPlanner] = useState(false);
  const [initialPlannerPrompt, setInitialPlannerPrompt] = useState("");
  const [initialPlannerStyle, setInitialPlannerStyle] = useState("balanced");
  const [mounted, setMounted] = useState(false);

  const [showQuizDropdown, setShowQuizDropdown] = useState(false);
  const [selectedQuizTasks, setSelectedQuizTasks] = useState<string[] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowQuizDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const shouldOpenPlanner = searchParams.get("aiPlanner") === "true";
    if (shouldOpenPlanner) {
      setInitialPlannerPrompt(searchParams.get("prompt") || "");
      setInitialPlannerStyle(searchParams.get("style") || "balanced");
      setShowStudyPlanner(true);
      // Clean up URL so refresh doesn't reopen it
      router.replace("/dashboard/goals?tab=daily");
    }
  }, [searchParams, router]);

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

  const handleAddSelectedTasks = useCallback(
    async (
      tasksToCreate: Omit<
        DailyTask,
        "_id" | "userId" | "createdAt" | "updatedAt" | "isCompletedToday"
      >[],
    ) => {
      try {
        setIsLoading(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await dailyTasksService.bulkCreateStudyTasks(tasksToCreate as any);
        await handleTasksCreated();
      } catch (error) {
        console.error("Error creating study tasks:", error);
        showErrorToast(error);
      } finally {
        setIsLoading(false);
      }
    },
    [handleTasksCreated, showErrorToast],
  );

  const handleGiveQuiz = () => {
    const tasksToUse = selectedQuizTasks !== null 
      ? tasks.filter(t => selectedQuizTasks.includes(t._id))
      : tasks;

    if (tasksToUse.length === 0) {
      showErrorToast("No tasks available to generate a quiz for this day.");
      return;
    }
    const topic = tasksToUse.map((t) => {
      const desc = t.description ? ` - ${t.description}` : "";
      return `${t.title}${desc}`;
    }).join(", ");

    // Extract categories from titles (e.g., "OS: History" -> "OS")
    const extractedCategories = new Set<string>();
    extractedCategories.add("General");
    tasksToUse.forEach(t => {
      const match = t.title.match(/^([^:]+):/);
      if (match && match[1]) {
        extractedCategories.add(match[1].trim());
      }
    });

    const categoriesParams = Array.from(extractedCategories)
      .map(c => `&category=${encodeURIComponent(c)}`)
      .join("");

    const [year, month, day] = selectedDate.split("-");
    const formattedDate = `${day}/${month}/${year.slice(2)}`;
    const quizName = `Daily Quiz ${formattedDate}`;
    
    router.push(`/dashboard/quizzes/practice/generate?topic=${encodeURIComponent(topic)}&quizName=${encodeURIComponent(quizName)}${categoriesParams}&numQuestions=15`);
  };

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
        if (!(error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("too many requests")))) {
          console.error("Error loading daily tasks:", error);
        }
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
        if (!(error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("too many requests")))) {
          console.error("Error loading analytics:", error);
        }
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
                      if (!(error instanceof Error && (error.message.includes("429") || error.message.toLowerCase().includes("too many requests")))) {
                        console.error("Error loading daily tasks:", error);
                      }
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
            className={`px-6 py-3 rounded-xl shadow-lg ${
              pointsAnimation.isDeduction
                ? "bg-red-600 text-white"
                : "bg-black dark:bg-white text-white dark:text-black"
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold">
                {pointsAnimation.isDeduction ? "-" : "+"}
                {pointsAnimation.points}
              </span>
              <CurrencyIcon size={16} className="shrink-0 !ml-1.5" />
            </div>
          </div>
        </div>
      )}

      {/* Header with Analytics */}
      <div className="bg-white dark:bg-gray-800 p-3 lg:p-4 shadow-sm rounded-lg">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-3">
              <BackButton />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Daily Tasks
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {selectedDate === getLocalDateString() && (
              <div className="relative group hidden sm:block" ref={dropdownRef}>
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 transition duration-500 rounded-lg"></div>
                <div className="relative flex items-stretch bg-white dark:bg-gray-800 rounded-lg h-9 sm:h-10">
                  <button
                    onClick={handleGiveQuiz}
                    className="flex items-center justify-center gap-1.5 border-y border-l border-black dark:border-white text-black dark:text-white px-3 sm:px-4 text-xs sm:text-sm font-semibold hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0 rounded-l-lg z-10"
                    title="Give Quiz from Tasks"
                  >
                    <Brain className="w-4 h-4" />
                    <span>Give Quiz</span>
                  </button>
                  <div className="w-[1px] bg-black dark:bg-white z-10"></div>
                  <button
                    onClick={() => setShowQuizDropdown(!showQuizDropdown)}
                    className="flex items-center justify-center border-y border-r border-black dark:border-white text-black dark:text-white px-1.5 sm:px-2 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out flex-shrink-0 rounded-r-lg z-10"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                {showQuizDropdown && (
                  <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-[#121216] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 p-2 backdrop-blur-xl">
                    <div className="mb-2 px-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Select Topics</span>
                      {selectedQuizTasks === null || selectedQuizTasks.length === tasks.length ? (
                        <button onClick={() => setSelectedQuizTasks([])} className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">Deselect All</button>
                      ) : (
                        <button onClick={() => setSelectedQuizTasks(null)} className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">Select All</button>
                      )}
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                      {tasks.map(t => (
                        <label key={t._id} className="flex items-start gap-2 p-2 hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedQuizTasks === null || selectedQuizTasks.includes(t._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                if (selectedQuizTasks !== null) {
                                  setSelectedQuizTasks([...selectedQuizTasks, t._id]);
                                }
                              } else {
                                if (selectedQuizTasks === null) {
                                  setSelectedQuizTasks(tasks.map(task => task._id).filter(id => id !== t._id));
                                } else {
                                  setSelectedQuizTasks(selectedQuizTasks.filter(id => id !== t._id));
                                }
                              }
                            }}
                            className="mt-0.5 rounded border-gray-300 text-black dark:text-white focus:ring-black dark:focus:ring-white bg-white dark:bg-gray-800 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2 leading-tight">{t.title}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="relative group hidden sm:block">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 transition duration-500"></div>
              <button
                onClick={() => setShowStudyPlanner(true)}
                className="relative flex items-center justify-center gap-1.5 bg-black dark:bg-white text-white dark:text-black h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-medium hover:bg-gray-900 dark:hover:bg-gray-100 transition-colors whitespace-nowrap flex-shrink-0 rounded-lg"
                title="AI Study Planner"
              >
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">AI Planner</span>
                <span className="sm:hidden">AI Plan</span>
              </button>
            </div>
            <button
              onClick={() => setShowAddTask(true)}
              className="flex items-center justify-center gap-1.5 border border-black dark:border-white bg-transparent text-black dark:text-white h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0 rounded-lg"
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
            {/* Give Quiz Mobile Button */}
            {selectedDate === getLocalDateString() && (
              <div className="relative group sm:hidden shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 transition duration-500"></div>
                <button
                  onClick={handleGiveQuiz}
                  className="relative flex items-center justify-center w-[38px] h-[38px] border border-black dark:border-white bg-white dark:bg-gray-800 text-black dark:text-white hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out rounded-lg shrink-0"
                  title="Give Quiz from Tasks"
                >
                  <Brain className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* AI Plan Button - Mobile Only */}
            <div className="relative group sm:hidden flex-1">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 opacity-50 blur group-hover:opacity-80 transition duration-500"></div>
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
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-700 bg-transparent text-gray-900 dark:text-gray-100 text-sm focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-colors cursor-pointer dark:[color-scheme:dark] min-w-0 rounded-lg"
            />
          </div>
          {/* Upcoming Days - full width */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto pb-1">
            {mounted && getUpcomingDays().map((day) => {
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
                  className={`flex flex-col items-center px-2 py-2 flex-1 min-w-0 transition-all ${borderClass} ${
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
      {mounted && !isToday && (
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
                className="bg-white dark:bg-gray-800 p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800/50 flex items-stretch gap-3 sm:gap-4 animate-pulse min-h-[90px] sm:min-h-[110px] rounded-lg relative"
              >
                <div className="flex flex-col justify-between items-center shrink-0">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-300 dark:border-gray-600 mt-0.5 rounded-md" />
                  {/* Mobile Edit/Delete Buttons Skeleton */}
                  <div className="md:hidden flex flex-col gap-1 mt-auto pb-0.5">
                    <div className="w-7 h-7 bg-gray-50/50 dark:bg-gray-800/40 rounded-md" />
                    <div className="w-7 h-7 bg-gray-50/50 dark:bg-gray-800/40 rounded-md" />
                  </div>
                </div>
                <div className="flex-1 space-y-3 sm:space-y-4 py-0.5">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 sm:space-y-2.5 flex-1 min-w-0">
                      <div className="h-3.5 sm:h-5 w-[60%] sm:w-[40%] bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="space-y-1 sm:space-y-1.5 mt-1">
                        <div className="h-2.5 sm:h-4 w-[90%] sm:w-[85%] bg-gray-100 dark:bg-gray-800/60 rounded" />
                        <div className="h-2.5 sm:h-4 w-[75%] sm:w-[65%] bg-gray-100 dark:bg-gray-800/60 rounded" />
                      </div>
                    </div>
                    {/* Desktop Edit/Delete Buttons Skeleton */}
                    <div className="hidden md:flex items-center gap-1 ml-2 shrink-0">
                      <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg" />
                      <div className="w-8 h-8 bg-gray-50/50 dark:bg-gray-800/40 rounded-lg" />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-3 sm:h-3.5 w-32 sm:w-40 bg-gray-100 dark:bg-gray-800/50 rounded" />
                      <div className="absolute bottom-4 right-4 md:static md:bottom-auto md:right-auto h-4 sm:h-5 w-14 sm:w-20 bg-gray-100 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-full" />
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
        onAddSelectedTasks={handleAddSelectedTasks}
        initialPrompt={initialPlannerPrompt}
        initialStyle={initialPlannerStyle}
      />
    </>
  );
};

export default DailyTasks;
