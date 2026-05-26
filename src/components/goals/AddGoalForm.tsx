import React, { useState, useEffect } from "react";
import { CreateGoalData, Goal, UpdateGoalData } from "@/services/goalsService";

interface AddGoalFormProps {
  editingGoal?: Goal | null;
  onAddGoal: (goal: CreateGoalData) => void;
  onUpdateGoal?: (id: string, goal: UpdateGoalData) => void;
  onCancel: () => void;
  initialCategory?: "weekly" | "monthly" | "quarterly" | "yearly";
}

// Helper functions for date calculations
const getWeeksInYear = (year: number) => {
  const weeks = [];
  const firstDay = new Date(year, 0, 1);
  const firstMonday = new Date(firstDay);
  firstMonday.setDate(firstDay.getDate() + ((8 - firstDay.getDay()) % 7));

  const currentDate = new Date(firstMonday);
  let weekNum = 1;

  while (currentDate.getFullYear() <= year && weekNum <= 53) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    if (weekStart.getFullYear() === year || weekEnd.getFullYear() === year) {
      weeks.push({
        weekNum,
        start: weekStart.toISOString().split("T")[0],
        end: weekEnd.toISOString().split("T")[0],
        label: `Week ${weekNum} (${weekStart.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })} - ${weekEnd.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })})`,
      });
    }

    currentDate.setDate(currentDate.getDate() + 7);
    weekNum++;
  }
  return weeks;
};

const getMonthEndDate = (year: number, month: number) => {
  return new Date(year, month + 1, 0).toISOString().split("T")[0];
};

const getQuarterEndDate = (year: number, quarter: number) => {
  const quarterEndMonth = quarter * 3;
  return new Date(year, quarterEndMonth, 0).toISOString().split("T")[0];
};

const AddGoalForm: React.FC<AddGoalFormProps> = ({
  editingGoal,
  onAddGoal,
  onUpdateGoal,
  onCancel,
  initialCategory,
}) => {
  const isEditing = !!editingGoal;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentQuarter = Math.floor(currentMonth / 3) + 1;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: (initialCategory || "monthly") as
      | "weekly"
      | "monthly"
      | "quarterly"
      | "yearly",
    priority: "medium" as "low" | "medium" | "high",
    targetDate: "",
  });

  // Category-specific date selection state
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedQuarter, setSelectedQuarter] = useState(currentQuarter);

  const [milestones, setMilestones] = useState<
    Array<{ title: string; description: string; targetDate: string }>
  >([]);
  const [milestoneErrors, setMilestoneErrors] = useState<string[]>([]);

  useEffect(() => {
    if (editingGoal) {
      const targetDate = new Date(editingGoal.targetDate);
      setFormData({
        title: editingGoal.title,
        description: editingGoal.description || "",
        category: editingGoal.category,
        priority: editingGoal.priority,
        targetDate: targetDate.toISOString().split("T")[0],
      });
      setSelectedYear(targetDate.getFullYear());
      setSelectedMonth(targetDate.getMonth());
      setSelectedQuarter(Math.floor(targetDate.getMonth() / 3) + 1);
      setMilestones(
        editingGoal.milestones.map((milestone) => ({
          title: milestone.title,
          description: milestone.description || "",
          targetDate: new Date(milestone.targetDate)
            .toISOString()
            .split("T")[0],
        }))
      );
    } else {
      // Set default target date based on category
      const category = initialCategory || "monthly";
      const defaultTargetDate = getMonthEndDate(currentYear, currentMonth);
      setFormData({
        title: "",
        description: "",
        category: category,
        priority: "medium",
        targetDate: defaultTargetDate,
      });
      setMilestones([]);
      setMilestoneErrors([]);
    }
  }, [editingGoal, currentYear, currentMonth, initialCategory]);

  // Track if user has interacted with date selectors during editing
  const [hasChangedDateSelectors, setHasChangedDateSelectors] = useState(false);

  // Reset the flag when switching between editing and creating
  useEffect(() => {
    setHasChangedDateSelectors(false);
  }, [editingGoal]);

  // Update target date when category or date selection changes
  useEffect(() => {
    let newTargetDate = "";
    switch (formData.category) {
      case "weekly":
        const weeks = getWeeksInYear(selectedYear);
        const selectedWeekData = weeks.find((w) => w.weekNum === selectedWeek);
        if (selectedWeekData) {
          newTargetDate = selectedWeekData.end;
        }
        break;
      case "monthly":
        newTargetDate = getMonthEndDate(selectedYear, selectedMonth);
        break;
      case "quarterly":
        newTargetDate = getQuarterEndDate(selectedYear, selectedQuarter);
        break;
      case "yearly":
        newTargetDate = `${selectedYear}-12-31`;
        break;
    }
    // Update target date if not editing, or if user has explicitly changed selectors
    if (newTargetDate && (!isEditing || hasChangedDateSelectors)) {
      setFormData((prev) => ({ ...prev, targetDate: newTargetDate }));
    }
  }, [
    formData.category,
    selectedYear,
    selectedMonth,
    selectedWeek,
    selectedQuarter,
    isEditing,
    hasChangedDateSelectors,
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate milestones before submitting
    if (!validateMilestones(milestones)) {
      return;
    }

    if (isEditing && editingGoal && onUpdateGoal) {
      const updateData: UpdateGoalData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        targetDate: formData.targetDate,
        milestones: milestones.map((milestone) => ({
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate,
        })),
      };
      onUpdateGoal(editingGoal._id, updateData);
    } else {
      const newGoal: CreateGoalData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        targetDate: formData.targetDate,
        milestones: milestones.map((milestone) => ({
          title: milestone.title,
          description: milestone.description,
          targetDate: milestone.targetDate,
        })),
      };
      onAddGoal(newGoal);
    }
    onCancel();
  };

  const validateMilestones = (
    updatedMilestones: Array<{
      title: string;
      description: string;
      targetDate: string;
    }>
  ) => {
    const errors: string[] = [];
    updatedMilestones.forEach((milestone, index) => {
      if (milestone.targetDate) {
        // Check if milestone date is after target date
        if (formData.targetDate && milestone.targetDate > formData.targetDate) {
          errors[index] = "Milestone date must be on or before target date";
        }
        // Check if milestone date is after previous milestone
        else if (index > 0) {
          const prevMilestone = updatedMilestones[index - 1];
          if (
            prevMilestone.targetDate &&
            milestone.targetDate < prevMilestone.targetDate
          ) {
            errors[index] =
              "Milestone date must be after the previous milestone";
          }
        }
      }
    });
    setMilestoneErrors(errors);
    return errors.filter(Boolean).length === 0;
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { title: "", description: "", targetDate: "" },
    ]);
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updatedMilestones = milestones.map((milestone, i) =>
      i === index ? { ...milestone, [field]: value } : milestone
    );
    setMilestones(updatedMilestones);
    if (field === "targetDate") {
      validateMilestones(updatedMilestones);
    }
  };

  const removeMilestone = (index: number) => {
    const updatedMilestones = milestones.filter((_, i) => i !== index);
    setMilestones(updatedMilestones);
    validateMilestones(updatedMilestones);
  };

  // Get minimum date for a milestone (must be after previous milestone)
  const getMinDateForMilestone = (index: number): string | undefined => {
    if (index === 0) return undefined;
    const prevMilestone = milestones[index - 1];
    return prevMilestone.targetDate || undefined;
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 p-4 shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl mt-4"
      style={{ position: "relative" }}
    >
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {isEditing ? "Edit Goal" : "Create Goal"}
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
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Goal Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full px-3 py-2 border rounded-lg text-sm bg-transparent text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                placeholder="Enter goal title"
                required
              />
            </div>
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
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={5}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors resize-none"
                placeholder="Enter description (optional)"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as
                      | "weekly"
                      | "monthly"
                      | "quarterly"
                      | "yearly",
                  }));
                  setHasChangedDateSelectors(true);
                }}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Date
              </label>
              {/* Category-specific date pickers */}
              <div className="space-y-2">
                {formData.category === "yearly" && (
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      setSelectedYear(parseInt(e.target.value));
                      setHasChangedDateSelectors(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                  >
                    {Array.from({ length: 5 }, (_, i) => currentYear + i).map(
                      (year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      )
                    )}
                  </select>
                )}

                {formData.category === "quarterly" && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        setHasChangedDateSelectors(true);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                      {Array.from({ length: 5 }, (_, i) => currentYear + i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      value={selectedQuarter}
                      onChange={(e) => {
                        setSelectedQuarter(parseInt(e.target.value));
                        setHasChangedDateSelectors(true);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                      <option value={1}>Q1 (Jan-Mar)</option>
                      <option value={2}>Q2 (Apr-Jun)</option>
                      <option value={3}>Q3 (Jul-Sep)</option>
                      <option value={4}>Q4 (Oct-Dec)</option>
                    </select>
                  </div>
                )}

                {formData.category === "monthly" && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        setHasChangedDateSelectors(true);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                      {Array.from({ length: 5 }, (_, i) => currentYear + i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(parseInt(e.target.value));
                        setHasChangedDateSelectors(true);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                      {[
                        "January",
                        "February",
                        "March",
                        "April",
                        "May",
                        "June",
                        "July",
                        "August",
                        "September",
                        "October",
                        "November",
                        "December",
                      ].map((month, idx) => (
                        <option key={idx} value={idx}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.category === "weekly" && (
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(parseInt(e.target.value));
                        setHasChangedDateSelectors(true);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                      {Array.from({ length: 3 }, (_, i) => currentYear + i).map(
                        (year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>
                    <select
                      value={selectedWeek}
                      onChange={(e) => {
                        setSelectedWeek(parseInt(e.target.value));
                        setHasChangedDateSelectors(true);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-700 bg-transparent text-black dark:text-white rounded-lg text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                    >
                      {getWeeksInYear(selectedYear).map((week) => (
                        <option key={week.weekNum} value={week.weekNum}>
                          {week.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Target: {new Date(formData.targetDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Milestones Section */}
        {milestones.length > 0 && (
          <div className="space-y-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Milestones
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Dates must be sequential and before target date
              </span>
            </div>
            {milestones.map((milestone, idx) => (
              <div
                key={idx}
                className={`border bg-transparent p-3 mb-2 flex flex-col gap-2 rounded-xl ${
                  milestoneErrors[idx]
                    ? "border-red-400 dark:border-red-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={(e) =>
                      updateMilestone(idx, "title", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-transparent text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                    placeholder="Milestone title"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(idx)}
                    className="text-gray-400 hover:text-red-500 text-xl font-bold flex-shrink-0"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                    aria-label="Remove milestone"
                  >
                    &times;
                  </button>
                </div>
                <input
                  type="date"
                  value={milestone.targetDate}
                  min={getMinDateForMilestone(idx)}
                  max={formData.targetDate || undefined}
                  onChange={(e) =>
                    updateMilestone(idx, "targetDate", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-transparent text-black dark:text-white focus:outline-none focus:ring-1 ${
                    milestoneErrors[idx]
                      ? "border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-black dark:focus:ring-white"
                  }`}
                />
                {milestoneErrors[idx] && (
                  <p className="text-xs text-red-500 dark:text-red-400">
                    {milestoneErrors[idx]}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addMilestone}
          className="w-full border border-dashed border-gray-400 dark:border-gray-600 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 rounded-lg"
        >
          + Add Milestone
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm border-2 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 rounded-lg"
          >
            {isEditing ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGoalForm;
