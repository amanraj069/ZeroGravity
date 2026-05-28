"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Target,
  CheckCircle,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import AddGoalForm from "./AddGoalForm";
import DailyTasks from "./DailyTasks";
import {
  goalsService,
  Goal,
  GoalsAnalytics,
  CreateGoalData,
  UpdateGoalData,
} from "@/services/goalsService";
import { dailyTasksService } from "@/services/dailyTasksService";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";

import GoalsSkeleton from "./GoalsSkeleton";

type FilterType =
  | "current"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "all";
type ViewType = "daily-tasks" | "goals"; // Daily tasks first, as it's now the default

// Helper function to check if a goal is overdue (past target date and not completed)
const isGoalOverdue = (goal: Goal): boolean => {
  if (goal.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(goal.targetDate);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate < today;
};

// Helper function to check if a goal is current (within the current period)
const isGoalCurrent = (goal: Goal): boolean => {
  const today = new Date();
  const targetDate = new Date(goal.targetDate);

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentQuarter = Math.floor(currentMonth / 3);

  // Get the start of the current week (Monday)
  const currentWeekStart = new Date(today);
  const dayOfWeek = today.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  currentWeekStart.setDate(today.getDate() + diff);
  currentWeekStart.setHours(0, 0, 0, 0);

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  switch (goal.category) {
    case "weekly":
      return targetDate >= currentWeekStart && targetDate <= currentWeekEnd;
    case "monthly":
      return (
        targetDate.getFullYear() === currentYear &&
        targetDate.getMonth() === currentMonth
      );
    case "quarterly":
      return (
        targetDate.getFullYear() === currentYear &&
        Math.floor(targetDate.getMonth() / 3) === currentQuarter
      );
    case "yearly":
      return targetDate.getFullYear() === currentYear;
    default:
      return false;
  }
};

const Goals: React.FC = () => {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const searchParams = useSearchParams();

  // Get tab from URL params, default to "daily"
  const getInitialView = (): ViewType => {
    const tab = searchParams.get("tab");
    if (tab === "all") return "goals";
    return "daily-tasks"; // Default to daily tasks
  };

  const [activeView, setActiveView] = useState<ViewType>(getInitialView());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("current");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [goalsAnalytics, setGoalsAnalytics] = useState<GoalsAnalytics>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
    totalGoals: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { showErrorToast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Update URL when activeView changes
  const updateURL = (view: ViewType) => {
    const tab = view === "goals" ? "all" : "daily";
    window.history.pushState(null, "", `/dashboard/goals?tab=${tab}`);
  };

  // Handle view change
  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
    updateURL(view);
  };

  // Update activeView when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    const newView: ViewType = tab === "all" ? "goals" : "daily-tasks";
    if (newView !== activeView) {
      setActiveView(newView);
    }
  }, [searchParams, activeView]);

  // Set initial URL if no tab parameter exists
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) {
      // Set default to daily tasks without triggering a full RSC fetch
      window.history.replaceState(null, "", "/dashboard/goals?tab=daily");
    }
  }, [searchParams]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load goals from API only when authenticated and viewing goals
  useEffect(() => {
    if (!authLoading && isLoggedIn && activeView === "goals") {
      loadGoals();
      loadAnalytics(); // Load daily tasks analytics for streak info
    } else if (!authLoading && !isLoggedIn) {
      setIsLoading(false);
      setError("Please log in to view your goals");
    }
  }, [authLoading, isLoggedIn, activeView]);

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { goals: fetchedGoals, analytics } = await goalsService.getGoals();
      setGoals(fetchedGoals);
      setGoalsAnalytics(analytics);
    } catch (error) {
      console.error("Error loading goals:", error);
      let errorMessage = "Failed to load goals";
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

  const loadAnalytics = async () => {
    try {
      await dailyTasksService.getStreakInfo();
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const calculateProgress = (goal: Goal): number => {
    if (goal.completed) return 100;
    if (goal.milestones.length === 0) return 0;

    const completedMilestones = goal.milestones.filter(
      (m) => m.completed,
    ).length;
    return Math.round((completedMilestones / goal.milestones.length) * 100);
  };

  const filteredGoals = goals.filter((goal) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "current") return isGoalCurrent(goal);
    return goal.category === activeFilter;
  });

  const toggleGoalExpansion = (goalId: string) => {
    setExpandedGoals((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(goalId)) {
        newSet.delete(goalId);
      } else {
        newSet.add(goalId);
      }
      return newSet;
    });
  };

  const addGoal = async (goalData: CreateGoalData) => {
    try {
      await goalsService.createGoal(goalData);
      await loadGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
      showErrorToast(error);
    }
  };

  const updateGoal = async (goalId: string, updateData: UpdateGoalData) => {
    try {
      await goalsService.updateGoal(goalId, updateData);
      await loadGoals();
      setEditingGoal(null);
    } catch (error) {
      console.error("Error updating goal:", error);
      showErrorToast(error);
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      await loadGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      showErrorToast(error);
    }
  };

  const toggleGoalCompletion = async (goalId: string) => {
    const previousGoals = [...goals];
    const previousAnalytics = { ...goalsAnalytics };

    // Optimistic update
    setGoals((currentGoals) =>
      currentGoals.map((goal) =>
        goal._id === goalId ? { ...goal, completed: !goal.completed } : goal
      )
    );

    try {
      await goalsService.toggleGoalCompletion(goalId);

      // Fetch in background to sync state
      goalsService.getGoals().then(({ goals: fetchedGoals, analytics }) => {
        setGoals(fetchedGoals);
        setGoalsAnalytics(analytics);
      }).catch(console.error);
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      // Revert optimistic update
      setGoals(previousGoals);
      setGoalsAnalytics(previousAnalytics);

      showErrorToast(error);
    }
  };

  const toggleMilestoneCompletion = async (
    goalId: string,
    milestoneId: string,
  ) => {
    const previousGoals = [...goals];
    const previousAnalytics = { ...goalsAnalytics };

    let goalStatusChanged = false;

    // Optimistic update
    setGoals((currentGoals) =>
      currentGoals.map((goal) => {
        if (goal._id !== goalId) return goal;

        const updatedMilestones = goal.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );

        let newCompleted = goal.completed;
        if (updatedMilestones.length > 0) {
          const allMilestonesCompleted = updatedMilestones.every((m) => m.completed);
          const anyMilestoneIncomplete = updatedMilestones.some((m) => !m.completed);

          if (allMilestonesCompleted && !goal.completed) {
            newCompleted = true;
            goalStatusChanged = true;
          } else if (anyMilestoneIncomplete && goal.completed) {
            newCompleted = false;
            goalStatusChanged = true;
          }
        }

        return {
          ...goal,
          milestones: updatedMilestones,
          completed: newCompleted,
        };
      })
    );

    try {
      await goalsService.toggleMilestoneCompletion(goalId, milestoneId);

      if (goalStatusChanged) {
        await goalsService.toggleGoalCompletion(goalId);
      }

      // Sync in background
      goalsService.getGoals().then(({ goals: fetchedGoals, analytics }) => {
        setGoals(fetchedGoals);
        setGoalsAnalytics(analytics);
      }).catch(console.error);

    } catch (error) {
      console.error("Error toggling milestone completion:", error);
      // Revert optimistic update
      setGoals(previousGoals);
      setGoalsAnalytics(previousAnalytics);

      showErrorToast(error);
    }
  };

  // If showing daily tasks, render the DailyTasks component inside the layout
  const renderContent = () => {
    if (activeView === "daily-tasks") {
      return <DailyTasks />;
    }

    if (authLoading || (activeView === "goals" && isLoading)) {
      return <GoalsSkeleton includeTabs={false} mode="goals" />;
    }

    if (error) {
      return (
        <div className="flex items-center justify-center py-24">
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
                onClick={loadGoals}
                className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      );
    }

    // Goals content
    return (
      <>
        <div className="bg-white dark:bg-gray-800 p-3 lg:p-4 shadow-sm rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex flex-col md:flex-row md:items-center md:gap-4">
              <div className="flex items-center gap-3">
                <BackButton />
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  Goals
                </h1>
              </div>

              {/* Desktop Stats */}
              {/* <div className="hidden md:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="whitespace-nowrap">
                  {goalsAnalytics?.totalCompleted || 0} completed
                </span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">{goals.length} total</span>
                <span className="flex-shrink-0">•</span>
                <span className="whitespace-nowrap">
                  {goalsAnalytics?.completionRate || 0}% completion rate
                </span>
              </div> */}
            </div>
            <button
              onClick={() => setShowAddGoal(true)}
              className="flex items-center justify-center gap-1.5 border border-black dark:border-white bg-transparent text-black dark:text-white h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Goal
            </button>
          </div>

          {/* Mobile Stats */}
          {/*
          <div className="flex md:hidden items-center gap-1.5 text-[11px] sm:text-sm text-gray-500 dark:text-gray-400 w-full mt-2">
            <span className="whitespace-nowrap">
              {goalsAnalytics?.totalCompleted || 0} completed
            </span>
            <span className="flex-shrink-0">•</span>
            <span className="whitespace-nowrap">{goals.length} total</span>
            <span className="flex-shrink-0">•</span>
            <span className="whitespace-nowrap">
              {goalsAnalytics?.completionRate || 0}% completion rate
            </span>
          </div> */}
        </div>

        {/* Inline Goal Form (like DailyTasks) - before filter */}
        {(showAddGoal || editingGoal) && (
          <AddGoalForm
            editingGoal={editingGoal}
            initialCategory={
              activeFilter === "weekly" ||
                activeFilter === "monthly" ||
                activeFilter === "quarterly" ||
                activeFilter === "yearly"
                ? activeFilter
                : undefined
            }
            onAddGoal={async (goalData) => {
              await addGoal(goalData);
              setShowAddGoal(false);
            }}
            onUpdateGoal={async (id, updateData) => {
              await updateGoal(id, updateData);
              setEditingGoal(null);
            }}
            onCancel={() => {
              setShowAddGoal(false);
              setEditingGoal(null);
            }}
          />
        )}

        {/* Mobile-optimized Filter */}
        <div className="bg-white dark:bg-gray-800 shadow-sm mt-2 rounded-lg overflow-hidden">
          <div className="flex overflow-x-auto sm:overflow-visible justify-start scrollbar-hide">
            {(
              [
                "current",
                "all",
                "weekly",
                "monthly",
                "quarterly",
                "yearly",
              ] as FilterType[]
            ).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 sm:flex-1 sm:flex-shrink ${activeFilter === filter
                  ? "border-black dark:border-white text-black dark:text-white bg-gray-50 dark:bg-gray-700"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile-optimized Goals Display */}
        <div className="space-y-4">
          {filteredGoals.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 flex flex-col items-center justify-center min-h-[calc(100dvh-300px)] py-12 pb-16 px-4 text-center shadow-sm relative mt-4 rounded-xl">
              {/* Dark mode hint - only show in light mode */}
              {theme === "light" && (
                <div className="absolute top-4 right-4 text-xs text-gray-400 flex items-center gap-1">
                  <span>🌙</span>
                  <span>Turn on dark mode to see the clouds</span>
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/goals/dGoals.png"
                alt="No goals yet"
                className="w-full max-w-[280px] sm:max-w-[380px] h-auto object-contain mx-auto mb-4"
                draggable={false}
              />
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                {activeFilter === "current"
                  ? "No current goals"
                  : "No goals created yet"}
              </h3>
              {!showAddGoal && (
                <button
                  onClick={() => setShowAddGoal(true)}
                  className="bg-black dark:bg-white text-white dark:text-black px-16 py-2 text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors rounded-lg"
                >
                  Create Goal
                </button>
              )}
            </div>
          ) : (
            [...filteredGoals]
              .sort((a, b) => {
                // Unfinished goals come first
                if (a.completed !== b.completed) {
                  return a.completed ? 1 : -1;
                }
                return 0;
              })
              .map((goal) => (
                <div
                  key={goal._id}
                  className={`rounded-xl shadow-sm overflow-hidden ${goal.completed
                    ? "bg-gray-50/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                    : mounted && isGoalOverdue(goal)
                      ? "bg-red-50/40 dark:bg-red-950/30 border-2 border-dashed border-red-400 dark:border-red-600"
                      : goal.priority === "high"
                        ? "bg-red-50/30 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50"
                        : goal.priority === "medium"
                          ? "bg-amber-50/30 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50"
                          : "bg-emerald-50/30 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50"
                    }`}
                >
                  {/* Goal Header - Mobile optimized */}
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleGoalCompletion(goal._id)}
                        className={`rounded-md flex-shrink-0 w-6 h-6  border-2 flex items-center justify-center mt-0.5 transition-colors ${goal.completed
                          ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          }`}
                      >
                        {goal.completed && <CheckCircle className="w-4 h-4" />}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`font-medium text-sm sm:text-base ${goal.completed
                                ? "line-through text-gray-500 dark:text-gray-400"
                                : "text-gray-900 dark:text-white"
                                }`}
                            >
                              {goal.title}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={() => setEditingGoal(goal)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteGoal(goal._id)}
                              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {goal.description && (
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                            {goal.description}
                          </p>
                        )}

                        {/* Progress Bar */}
                        {goal.milestones.length > 0 && (
                          <div className="mb-3 mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {
                                  goal.milestones.filter((m) => m.completed)
                                    .length
                                }
                                /{goal.milestones.length} milestones completed
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {calculateProgress(goal)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2">
                              <div
                                className="bg-black dark:bg-white h-2  transition-all duration-300"
                                style={{ width: `${calculateProgress(goal)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <span
                            className={`text-xs ${mounted && isGoalOverdue(goal)
                              ? "text-red-600 dark:text-red-400 font-medium"
                              : "text-gray-500 dark:text-gray-400"
                              }`}
                          >
                            {mounted && isGoalOverdue(goal) ? (
                              <>
                                ⚠️ Overdue (was due{" "}
                                {new Date(goal.targetDate).toLocaleDateString()}
                                )
                              </>
                            ) : (
                              <>
                                Due{" "}
                                {new Date(goal.targetDate).toLocaleDateString()}
                              </>
                            )}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className="rounded-full text-[10px] text-gray-500 dark:text-gray-400 capitalize bg-gray-100 dark:bg-gray-700 px-2 py-0.5 border border-gray-200 dark:border-gray-600">
                              {goal.category}
                            </span>
                            <span
                              className={`rounded-full text-[10px] px-2 py-0.5 font-medium ${goal.priority === "high"
                                ? "bg-red-500 dark:bg-red-700 text-white dark:text-red-100 border border-red-600 dark:border-red-600"
                                : goal.priority === "medium"
                                  ? "bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100 border border-amber-600 dark:border-amber-600"
                                  : "bg-emerald-500 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-600 dark:border-emerald-600"
                                }`}
                            >
                              {goal.priority}
                            </span>
                          </div>

                          {goal.milestones.length > 0 && (
                            <button
                              onClick={() => toggleGoalExpansion(goal._id)}
                              className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                            >
                              {expandedGoals.has(goal._id) ? (
                                <>
                                  <span>Hide details</span>
                                  <ChevronUp className="w-3 h-3" />
                                </>
                              ) : (
                                <>
                                  <span>Show details</span>
                                  <ChevronDown className="w-3 h-3" />
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestones - Collapsible on mobile with animation */}
                  {goal.milestones.length > 0 &&
                    expandedGoals.has(goal._id) && (
                      <div
                        className="px-4 pb-3 ml-9 animate-slideDown"
                        style={{
                          animation: "slideDown 0.3s ease-out forwards",
                        }}
                      >
                        <style jsx>{`
                          @keyframes slideDown {
                            from {
                              opacity: 0;
                              transform: translateY(-10px);
                            }
                            to {
                              opacity: 1;
                              transform: translateY(0);
                            }
                          }
                        `}</style>
                        <div className="divide-y divide-gray-200 dark:divide-gray-600">
                          {goal.milestones.map((milestone, idx) => (
                            <div
                              key={milestone.id}
                              className="flex items-center gap-3 py-2.5 transition-all"
                              style={{
                                animation: `slideDown 0.3s ease-out ${idx * 0.05
                                  }s forwards`,
                                opacity: 0,
                              }}
                            >
                              <button
                                onClick={() =>
                                  toggleMilestoneCompletion(
                                    goal._id,
                                    milestone.id,
                                  )
                                }
                                className={`rounded-md flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center transition-colors ${milestone.completed
                                  ? "bg-black dark:bg-white border-black dark:border-white text-white dark:text-black"
                                  : "border-gray-300 dark:border-gray-500 hover:border-gray-400 dark:hover:border-gray-400"
                                  }`}
                              >
                                {milestone.completed && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0 flex items-center justify-between">
                                <span
                                  className={`text-sm font-medium ${milestone.completed
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-gray-800 dark:text-gray-200"
                                    }`}
                                >
                                  {milestone.title}
                                </span>
                                {milestone.targetDate && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-4 flex-shrink-0">
                                    Due:{" "}
                                    {new Date(
                                      milestone.targetDate,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ))
          )}
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 space-y-2 sm:space-y-4">
        {/* Main Navigation - Always visible */}
        <div className="bg-white dark:bg-gray-800 shadow-sm overflow-hidden rounded-lg">
          <div className="flex ">
            <button
              onClick={() => handleViewChange("daily-tasks")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${(activeView as ViewType) === "daily-tasks"
                ? "border-black dark:border-white text-black dark:text-white bg-gray-50 dark:bg-gray-700"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Daily Tasks
            </button>
            <button
              onClick={() => handleViewChange("goals")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${(activeView as ViewType) === "goals"
                ? "border-black dark:border-white text-black dark:text-white bg-gray-50 dark:bg-gray-700"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              Goals
            </button>
          </div>
        </div>

        {/* Dynamic Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Goals;
