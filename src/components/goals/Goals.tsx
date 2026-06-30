"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Sparkles,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { BackButton } from "@/components/BackButton";
import AddGoalForm from "./AddGoalForm";
import DailyTasks from "./DailyTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/contexts/ToastContext";
import { useGoals, useToggleGoalCompletion, useToggleMilestoneCompletion, useDeleteGoal, useCreateGoal, useUpdateGoal, useDecomposeGoal } from "@/hooks/useGoals";
import { Goal, CreateGoalData, UpdateGoalData } from "@/services/goalsService";
import GoalsSkeleton from "./GoalsSkeleton";

type FilterType =
  | "current"
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "all";
type ViewType = "daily-tasks" | "goals";

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
  const router = useRouter();
  const { showErrorToast } = useToast();

  // Get tab from URL params, default to "daily"
  const getInitialView = (): ViewType => {
    const tab = searchParams.get("tab");
    if (tab === "all") return "goals";
    return "daily-tasks"; // Default to daily tasks
  };

  const [activeView, setActiveView] = useState<ViewType>(getInitialView());
  const [activeFilter, setActiveFilter] = useState<FilterType>("current");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [decomposingGoalId, setDecomposingGoalId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // TanStack Query hooks
  const { data: goalsData, isLoading, error, refetch } = useGoals({
    enabled: isLoggedIn && activeView === "goals",
  });


  // Mutations
  const createGoalMutation = useCreateGoal({
    onError: (error) => showErrorToast(error),
  });
  const updateGoalMutation = useUpdateGoal({
    onError: (error) => showErrorToast(error),
  });
  const deleteGoalMutation = useDeleteGoal({
    onError: (error) => showErrorToast(error),
  });
  const toggleGoalCompletionMutation = useToggleGoalCompletion({
    onError: (error) => showErrorToast(error),
  });
  const toggleMilestoneCompletionMutation = useToggleMilestoneCompletion({
    onError: (error) => showErrorToast(error),
  });
  const decomposeGoalMutation = useDecomposeGoal({
    onError: (error) => showErrorToast(error),
    onSuccess: (data) => {
      router.push(`/dashboard/orbit-board?boardId=${data.boardId}`);
    },
  });

  // Extract data from query


  // Derived state
  const filteredGoals = useMemo(() => {
    const currentGoals = goalsData?.goals ?? [];
    return currentGoals
      .filter((goal) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "current") return isGoalCurrent(goal);
        return goal.category === activeFilter;
      })
      .sort((a, b) => {
        // Unfinished goals come first
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }
        return 0;
      });
  }, [goalsData?.goals, activeFilter]);

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
      window.history.replaceState(null, "", "/dashboard/goals?tab=daily");
    }
  }, [searchParams]);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Calculate progress
  const calculateProgress = (goal: Goal): number => {
    if (goal.completed) return 100;
    if (goal.progress !== undefined) return goal.progress;
    if (goal.milestones.length === 0) return 0;

    const completedMilestones = goal.milestones.filter(
      (m) => m.completed,
    ).length;
    return Math.round((completedMilestones / goal.milestones.length) * 100);
  };

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

  const handleAddGoal = async (goalData: CreateGoalData) => {
    await createGoalMutation.mutateAsync(goalData);
  };

  const handleUpdateGoal = async (goalId: string, updateData: UpdateGoalData) => {
    await updateGoalMutation.mutateAsync({ id: goalId, data: updateData });
  };

  const handleDeleteGoal = async (goalId: string) => {
    await deleteGoalMutation.mutateAsync(goalId);
  };

  const handleToggleGoalCompletion = async (goalId: string) => {
    await toggleGoalCompletionMutation.mutateAsync(goalId);
  };

  const handleToggleMilestoneCompletion = async (
    goalId: string,
    milestoneId: string,
  ) => {
    await toggleMilestoneCompletionMutation.mutateAsync({ goalId, milestoneId });
  };

  const handleDecomposeGoal = async (goalId: string) => {
    setDecomposingGoalId(goalId);
    try {
      await decomposeGoalMutation.mutateAsync(goalId);
    } finally {
      setDecomposingGoalId(null);
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
            <p className="text-red-600 dark:text-red-400 mb-3">{error.message}</p>
            {!isLoggedIn ? (
              <a
                href="/login"
                className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors inline-block"
              >
                Go to Login
              </a>
            ) : (
              <button
                onClick={() => refetch()}
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
            </div>
            <button
              onClick={() => setShowAddGoal(true)}
              className="flex items-center justify-center gap-1.5 border border-black dark:border-white bg-transparent text-black dark:text-white h-9 sm:h-10 px-3 sm:px-4 text-xs sm:text-sm font-semibold hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 ease-out whitespace-nowrap flex-shrink-0 rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Goal
            </button>
          </div>
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
              await handleAddGoal(goalData);
              setShowAddGoal(false);
            }}
            onUpdateGoal={async (id, updateData) => {
              await handleUpdateGoal(id, updateData);
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
            filteredGoals.map((goal) => (
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
                      onClick={() => handleToggleGoalCompletion(goal._id)}
                      disabled={toggleGoalCompletionMutation.isPending}
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
                            disabled={updateGoalMutation.isPending}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal._id)}
                            disabled={deleteGoalMutation.isPending}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDecomposeGoal(goal._id)}
                            disabled={
                              decomposingGoalId === goal._id ||
                              decomposeGoalMutation.isPending
                            }
                            className="flex items-center gap-1 p-1.5 ml-1 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors disabled:opacity-50"
                            title="Break into tasks with AI"
                          >
                            {decomposingGoalId === goal._id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Tasks</span>
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
                                handleToggleMilestoneCompletion(
                                  goal._id,
                                  milestone.id,
                                )
                              }
                              disabled={toggleMilestoneCompletionMutation.isPending}
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
        <div className="flex bg-gray-100/80 dark:bg-[#121216]/80 backdrop-blur-xl p-1.5 rounded-xl border border-gray-200/50 dark:border-white/5 overflow-hidden relative z-0 w-full">
          {(["daily-tasks", "goals"] as const).map((tab) => {
            const isActive = activeView === tab;
            return (
              <button
                key={tab}
                onClick={() => handleViewChange(tab)}
                className={`flex-1 relative flex items-center justify-center gap-2 px-5 py-2 sm:px-8 sm:py-2.5 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-colors z-10 ${
                  isActive
                    ? "text-black dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-goals-tab"
                    className="absolute inset-0 bg-white dark:bg-[#202028] shadow-[0_4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.2)] border border-gray-200/50 dark:border-white/10 rounded-xl"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                {tab === "daily-tasks" ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Daily Tasks</span>
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    <span>Goals</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content */}
        {renderContent()}
      </div>
    </div>
  );
};

export default Goals;