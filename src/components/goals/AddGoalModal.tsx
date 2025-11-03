"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { CreateGoalData, Goal, UpdateGoalData } from "@/services/goalsService";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: CreateGoalData) => void;
  onUpdateGoal?: (id: string, goal: UpdateGoalData) => void;
  editingGoal?: Goal | null;
}

const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal,
  onUpdateGoal,
  editingGoal,
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
    Array<{
      title: string;
      description: string;
      targetDate: string;
    }>
  >([]);

  // Populate form when editing
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
      // Reset form for new goal
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
          subtasks: [], // Start with empty subtasks
        })),
      };

      onAddGoal(newGoal);
    }

    onClose();

    // Reset form
    setFormData({
      title: "",
      description: "",
      category: "monthly",
      priority: "medium",
      targetDate: "",
    });
    setMilestones([]);
  };

  const addMilestone = () => {
    setMilestones((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        targetDate: "",
      },
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              {isEditing ? "Edit Goal" : "New Goal"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 -md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-gray-500 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
              placeholder="Goal title"
            />
          </div>

          <div>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 -md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-gray-500 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
              rows={2}
              placeholder="Description (optional)"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <select
                required
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 -md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-gray-500 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <select
                required
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 -md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-gray-500 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                required
                value={formData.targetDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetDate: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 -md focus:ring-1 focus:ring-black dark:focus:ring-white focus:border-black dark:focus:border-gray-500 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
              />
            </div>
          </div>

          {/* Milestones section - Available for both adding and editing */}
          {milestones.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Milestones
                </span>
              </div>
              {milestones.map((milestone, milestoneIndex) => (
                <div
                  key={milestoneIndex}
                  className="p-3 border border-gray-100 dark:border-gray-700 -md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) =>
                        updateMilestone(milestoneIndex, "title", e.target.value)
                      }
                      className="flex-1 px-2 py-1 border border-gray-200 dark:border-gray-700 text-sm mr-2 text-black dark:text-white bg-white dark:bg-gray-900"
                      placeholder="Milestone title"
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestoneIndex)}
                      className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="date"
                    value={milestone.targetDate}
                    onChange={(e) =>
                      updateMilestone(
                        milestoneIndex,
                        "targetDate",
                        e.target.value
                      )
                    }
                    className="w-full px-2 py-1 border border-gray-200 dark:border-gray-700 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addMilestone}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 -md hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            + Add Milestone
          </button>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 -md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black -md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              {isEditing ? "Update Goal" : "Create Goal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGoalModal;
