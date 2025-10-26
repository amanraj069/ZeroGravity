"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import AddGoalModal from "./AddGoalModal";
import SubtasksModal from "./SubtasksModal";
import DailyTasks from "./DailyTasks";
import {
  goalsService,
  Goal,
  GoalsAnalytics,
  CreateGoalData,
  UpdateGoalData,
} from "@/services/goalsService";
import {
  dailyTasksService,
  DailyTasksAnalytics,
} from "@/services/dailyTasksService";
import { useAuth } from "@/contexts/AuthContext";

type FilterType = "weekly" | "monthly" | "quarterly" | "yearly" | "all";
type ViewType = "daily-tasks" | "goals"; // Daily tasks first, as it's now the default

const Goals: React.FC = () => {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get tab from URL params, default to "daily"
  const getInitialView = (): ViewType => {
    const tab = searchParams.get("tab");
    if (tab === "all") return "goals";
    return "daily-tasks"; // Default to daily tasks
  };

  const [activeView, setActiveView] = useState<ViewType>(getInitialView());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editingSubtasks, setEditingSubtasks] = useState<{
    goalId: string;
    milestoneId: string;
  } | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [streakData, setStreakData] = useState<DailyTasksAnalytics>({
    currentStreak: 0,
    longestStreak: 0,
    totalActiveTasks: 0,
    completedToday: 0,
  });
  const [goalsAnalytics, setGoalsAnalytics] = useState<GoalsAnalytics>({
    currentStreak: 0,
    longestStreak: 0,
    totalCompleted: 0,
    totalGoals: 0,
    completionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update URL when activeView changes
  const updateURL = (view: ViewType) => {
    const tab = view === "goals" ? "all" : "daily";
    router.push(`/goals?tab=${tab}`, { scroll: false });
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
      // Set default to daily tasks
      router.replace("/goals?tab=daily", { scroll: false });
    }
  }, [searchParams, router]);

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
      setError(error instanceof Error ? error.message : "Failed to load goals");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await dailyTasksService.getStreakInfo();
      setStreakData(analyticsData);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  };

  const calculateProgress = (goal: Goal): number => {
    if (goal.completed) return 100;
    if (goal.milestones.length === 0) return 0;

    const completedMilestones = goal.milestones.filter(
      (m) => m.completed
    ).length;
    return Math.round((completedMilestones / goal.milestones.length) * 100);
  };

  const filteredGoals = goals.filter(
    (goal) => activeFilter === "all" || goal.category === activeFilter
  );

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
      setError(
        error instanceof Error ? error.message : "Failed to create goal"
      );
    }
  };

  const updateGoal = async (goalId: string, updateData: UpdateGoalData) => {
    try {
      await goalsService.updateGoal(goalId, updateData);
      await loadGoals();
      setEditingGoal(null);
    } catch (error) {
      console.error("Error updating goal:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update goal"
      );
    }
  };

  const deleteGoal = async (goalId: string) => {
    try {
      await goalsService.deleteGoal(goalId);
      await loadGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete goal"
      );
    }
  };

  const toggleGoalCompletion = async (goalId: string) => {
    try {
      await goalsService.toggleGoalCompletion(goalId);
      await loadGoals();
    } catch (error) {
      console.error("Error toggling goal completion:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update goal"
      );
    }
  };

  const toggleMilestoneCompletion = async (
    goalId: string,
    milestoneId: string
  ) => {
    try {
      await goalsService.toggleMilestoneCompletion(goalId, milestoneId);
      await loadGoals();

      const goal = goals.find((g) => g._id === goalId);
      if (goal && goal.milestones.length > 0) {
        const { goals: updatedGoals } = await goalsService.getGoals();
        const updatedGoal = updatedGoals.find((g) => g._id === goalId);

        if (updatedGoal && !updatedGoal.completed) {
          const allMilestonesCompleted = updatedGoal.milestones.every(
            (m) => m.completed
          );
          if (allMilestonesCompleted) {
            await goalsService.toggleGoalCompletion(goalId);
            await loadGoals();
          }
        }
      }
    } catch (error) {
      console.error("Error toggling milestone completion:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update milestone"
      );
    }
  };

  const toggleSubtaskCompletion = async (
    goalId: string,
    milestoneId: string,
    subtaskId: string
  ) => {
    try {
      await goalsService.toggleSubtaskCompletion(
        goalId,
        milestoneId,
        subtaskId
      );
      await loadGoals();

      const goal = goals.find((g) => g._id === goalId);
      if (goal) {
        const milestone = goal.milestones.find((m) => m.id === milestoneId);
        if (milestone && milestone.subtasks.length > 0) {
          const { goals: updatedGoals } = await goalsService.getGoals();
          const updatedGoal = updatedGoals.find((g) => g._id === goalId);
          const updatedMilestone = updatedGoal?.milestones.find(
            (m) => m.id === milestoneId
          );

          if (updatedMilestone && !updatedMilestone.completed) {
            const allSubtasksCompleted = updatedMilestone.subtasks.every(
              (s) => s.completed
            );
            if (allSubtasksCompleted) {
              await goalsService.toggleMilestoneCompletion(goalId, milestoneId);
              await loadGoals();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error toggling subtask completion:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update subtask"
      );
    }
  };

  // If showing daily tasks, render the DailyTasks component inside the layout
  const renderContent = () => {
    if (activeView === "daily-tasks") {
      return <DailyTasks />;
    }

    // Goals content
    return (
      <>
        {/* Mobile-optimized Header */}
        <div className="bg-white  p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
                Goals
              </h1>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-gray-500 mt-1">
                <span>{goalsAnalytics?.totalCompleted || 0} completed</span>
                <span>•</span>
                <span>{streakData.currentStreak} day streak</span>
                <span>•</span>
                <span>
                  {goalsAnalytics?.completionRate || 0}% completion rate
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowAddGoal(true)}
              className="flex items-center justify-center gap-2 bg-black text-white px-4 py-2 -md text-sm hover:bg-gray-800 transition-colors w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>
        </div>

        {/* Mobile-optimized Filter */}
        <div className="bg-white  shadow-sm overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {(
              [
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
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeFilter === filter
                    ? "border-black text-black bg-gray-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
            <div className="bg-white  p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-gray-100  flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No goals yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first goal to get started
              </p>
              <button
                onClick={() => setShowAddGoal(true)}
                className="bg-black text-white px-4 py-2 -md text-sm hover:bg-gray-800 transition-colors"
              >
                Create Goal
              </button>
            </div>
          ) : (
            filteredGoals.map((goal) => (
              <div
                key={goal._id}
                className={` shadow-sm border overflow-hidden ${
                  goal.completed
                    ? "bg-gray-50/50 border-gray-200"
                    : goal.priority === "high"
                    ? "bg-red-50/30 border-red-100"
                    : goal.priority === "medium"
                    ? "bg-amber-50/30 border-amber-100"
                    : "bg-emerald-50/30 border-emerald-100"
                }`}
              >
                {/* Goal Header - Mobile optimized */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleGoalCompletion(goal._id)}
                      className={`flex-shrink-0 w-6 h-6  border-2 flex items-center justify-center mt-0.5 transition-colors ${
                        goal.completed
                          ? "bg-black border-black text-white"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                    >
                      {goal.completed && <CheckCircle className="w-4 h-4" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3
                            className={`font-medium text-sm sm:text-base ${
                              goal.completed
                                ? "line-through text-gray-500"
                                : "text-gray-900"
                            }`}
                          >
                            {goal.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 capitalize bg-gray-100 px-2 py-0.5 ">
                              {goal.category}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5  font-medium ${
                                goal.priority === "high"
                                  ? "bg-red-50 text-red-500 border border-red-200"
                                  : goal.priority === "medium"
                                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                              }`}
                            >
                              {goal.priority}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => setEditingGoal(goal)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteGoal(goal._id)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">
                          {goal.description}
                        </p>
                      )}

                      {/* Progress Bar */}
                      {goal.milestones.length > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-500">
                              {
                                goal.milestones.filter((m) => m.completed)
                                  .length
                              }
                              /{goal.milestones.length} milestones completed
                            </span>
                            <span className="text-xs text-gray-500 font-medium">
                              {calculateProgress(goal)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200  h-2">
                            <div
                              className="bg-black h-2  transition-all duration-300"
                              style={{ width: `${calculateProgress(goal)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          Due {new Date(goal.targetDate).toLocaleDateString()}
                        </span>

                        {goal.milestones.length > 0 && (
                          <button
                            onClick={() => toggleGoalExpansion(goal._id)}
                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
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

                {/* Milestones - Collapsible on mobile */}
                {goal.milestones.length > 0 && expandedGoals.has(goal._id) && (
                  <div className="border-t border-gray-100 bg-gray-50 p-4">
                    <div className="space-y-4">
                      {goal.milestones.map((milestone) => (
                        <div
                          key={milestone.id}
                          className="bg-white  p-3 shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <button
                                onClick={() =>
                                  toggleMilestoneCompletion(
                                    goal._id,
                                    milestone.id
                                  )
                                }
                                className={`flex-shrink-0 w-4 h-4  border flex items-center justify-center transition-colors ${
                                  milestone.completed
                                    ? "bg-gray-600 border-gray-600 text-white"
                                    : "border-gray-300 hover:border-gray-400"
                                }`}
                              >
                                {milestone.completed && (
                                  <CheckCircle className="w-3 h-3" />
                                )}
                              </button>
                              <span
                                className={`text-sm font-medium ${
                                  milestone.completed
                                    ? "line-through text-gray-400"
                                    : "text-gray-700"
                                }`}
                              >
                                {milestone.title}
                              </span>
                              {milestone.subtasks.length > 0 && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 ">
                                  {
                                    milestone.subtasks.filter(
                                      (s) => s.completed
                                    ).length
                                  }
                                  /{milestone.subtasks.length}
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() =>
                                setEditingSubtasks({
                                  goalId: goal._id,
                                  milestoneId: milestone.id,
                                })
                              }
                              className="flex-shrink-0 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 px-2 py-1  transition-colors"
                            >
                              + Subtasks
                            </button>
                          </div>

                          {/* Subtasks */}
                          {milestone.subtasks.length > 0 && (
                            <div className="ml-6 space-y-2">
                              {milestone.subtasks.map((subtask) => (
                                <div
                                  key={subtask.id}
                                  className="flex items-center gap-2"
                                >
                                  <button
                                    onClick={() =>
                                      toggleSubtaskCompletion(
                                        goal._id,
                                        milestone.id,
                                        subtask.id
                                      )
                                    }
                                    className={`flex-shrink-0 w-3 h-3  border flex items-center justify-center transition-colors ${
                                      subtask.completed
                                        ? "bg-gray-500 border-gray-500"
                                        : "border-gray-300 hover:border-gray-400"
                                    }`}
                                  >
                                    {subtask.completed && (
                                      <div className="w-1.5 h-1.5 bg-white " />
                                    )}
                                  </button>
                                  <span
                                    className={`text-sm ${
                                      subtask.completed
                                        ? "line-through text-gray-400"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {subtask.title}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Modals */}
        <AddGoalModal
          isOpen={showAddGoal || !!editingGoal}
          onClose={() => {
            setShowAddGoal(false);
            setEditingGoal(null);
          }}
          onAddGoal={addGoal}
          onUpdateGoal={updateGoal}
          editingGoal={editingGoal}
        />

        <SubtasksModal
          isOpen={!!editingSubtasks}
          onClose={() => setEditingSubtasks(null)}
          goal={
            editingSubtasks
              ? goals.find((g) => g._id === editingSubtasks.goalId) || null
              : null
          }
          milestoneId={editingSubtasks?.milestoneId || null}
          onUpdateComplete={loadGoals}
        />
      </>
    );
  };

  // Show loading state
  if (authLoading || (activeView === "goals" && isLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin  h-8 w-8 border-b-2 border-black"></div>
            <span className="ml-3 text-gray-600">
              {authLoading ? "Checking authentication..." : "Loading goals..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <p className="text-red-600 mb-3">{error}</p>
              {!isLoggedIn ? (
                <a
                  href="/login"
                  className="bg-black text-white px-4 py-2 -md text-sm hover:bg-gray-800 transition-colors inline-block"
                >
                  Go to Login
                </a>
              ) : (
                <button
                  onClick={loadGoals}
                  className="bg-black text-white px-4 py-2 -md text-sm hover:bg-gray-800 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Main Navigation - Always visible */}
        <div className="bg-white  shadow-sm overflow-hidden">
          <div className="flex">
            <button
              onClick={() => handleViewChange("daily-tasks")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                (activeView as ViewType) === "daily-tasks"
                  ? "border-black text-black bg-gray-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-2" />
              Daily Tasks
            </button>
            <button
              onClick={() => handleViewChange("goals")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                (activeView as ViewType) === "goals"
                  ? "border-black text-black bg-gray-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
