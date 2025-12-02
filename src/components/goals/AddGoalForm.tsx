import React, { useState, useEffect } from "react";
import { CreateGoalData, Goal, UpdateGoalData } from "@/services/goalsService";

interface AddGoalFormProps {
  editingGoal?: Goal | null;
  onAddGoal: (goal: CreateGoalData) => void;
  onUpdateGoal?: (id: string, goal: UpdateGoalData) => void;
  onCancel: () => void;
}

const AddGoalForm: React.FC<AddGoalFormProps> = ({
  editingGoal,
  onAddGoal,
  onUpdateGoal,
  onCancel,
}) => {
  const isEditing = !!editingGoal;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "monthly" as "weekly" | "monthly" | "quarterly" | "yearly",
    priority: "medium" as "low" | "medium" | "high",
    targetDate: "",
  });
  const [milestones, setMilestones] = useState<
    Array<{ title: string; description: string; targetDate: string }>
  >([]);

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        title: editingGoal.title,
        description: editingGoal.description || "",
        category: editingGoal.category,
        priority: editingGoal.priority,
        targetDate: editingGoal.targetDate.toISOString().split("T")[0],
      });
      setMilestones(
        editingGoal.milestones.map((milestone) => ({
          title: milestone.title,
          description: milestone.description || "",
          targetDate: milestone.targetDate.toISOString().split("T")[0],
        }))
      );
    } else {
      setFormData({
        title: "",
        description: "",
        category: "monthly",
        priority: "medium",
        targetDate: "",
      });
      setMilestones([]);
    }
  }, [editingGoal]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      { title: "", description: "", targetDate: "" },
    ]);
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    setMilestones((prev) =>
      prev.map((milestone, i) =>
        i === index ? { ...milestone, [field]: value } : milestone
      )
    );
  };

  const removeMilestone = (index: number) => {
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 p-4 shadow-sm border-t border-gray-200 dark:border-gray-700"
      style={{ borderRadius: 0, position: "relative" }}
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
                className="w-full px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors resize-none"
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
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    category: e.target.value as
                      | "weekly"
                      | "monthly"
                      | "quarterly"
                      | "yearly",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="targetDate"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Target Date
              </label>
              <input
                type="date"
                id="targetDate"
                name="targetDate"
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white rounded-md text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                required
              />
            </div>
          </div>
        </div>
        {/* Milestones Section */}
        {milestones.length > 0 && (
          <div className="space-y-4 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Milestones
              </div>
            </div>
            {milestones.map((milestone, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 mb-2 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <input
                    type="text"
                    value={milestone.title}
                    onChange={(e) =>
                      updateMilestone(idx, "title", e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
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
                  max={formData.targetDate || undefined}
                  onChange={(e) =>
                    updateMilestone(idx, "targetDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={addMilestone}
          className="w-full border border-dashed border-gray-400 dark:border-gray-600 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
        >
          + Add Milestone
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm border-2 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
          >
            {isEditing ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGoalForm;
