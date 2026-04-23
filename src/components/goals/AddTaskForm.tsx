"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import {
  DailyTask,
  CreateDailyTaskData,
  UpdateDailyTaskData,
} from "@/services/dailyTasksService";

interface AddTaskFormProps {
  editingTask: DailyTask | null;
  onAddTask: (taskData: CreateDailyTaskData) => Promise<void>;
  onUpdateTask?: (
    taskId: string,
    updateData: UpdateDailyTaskData
  ) => Promise<void>;
  onCancel: () => void;
}

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

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
    dateStarted: getLocalDateString(),
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
        dateStarted: getLocalDateString(new Date(editingTask.dateStarted)),
        dateEnded: getLocalDateString(new Date(editingTask.dateEnded)),
      });
    } else {
      const today = getLocalDateString();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      setFormData({
        title: "",
        description: "",
        priority: "medium",
        dateStarted: today,
        dateEnded: getLocalDateString(nextWeek),
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

      if (startDate > endDate) {
        newErrors.dateEnded = "End date must be on or after start date";
      }

      // When editing, end date must be after today
      if (editingTask) {
        const today = new Date(getLocalDateString());
        if (endDate <= today) {
          newErrors.dateEnded = "End date must be after today";
        }
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
    <div
      className="bg-white dark:bg-gray-800 p-4 shadow-sm border-t border-gray-200 dark:border-gray-700"
      style={{ borderRadius: 0, position: "relative" }}
    >
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {editingTask ? "Edit Daily Task" : "Add Daily Task"}
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
                className={`w-full px-3 py-2 border text-sm bg-white dark:bg-gray-900 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-colors focus:outline-none ${
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
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                disabled={isSubmitting}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          {/* Right side: Description (single line) and Date Range */}
          <div className="space-y-4">
            {/* Description - single line */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Description
              </label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white transition-colors"
                placeholder="Enter task description (optional)"
                disabled={isSubmitting}
              />
            </div>

            {/* Date Range - side by side */}
            <div className="grid grid-cols-2 gap-3">
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
                  onClick={(e) =>
                    !editingTask &&
                    (e.target as HTMLInputElement).showPicker?.()
                  }
                  className={`w-full px-3 py-2 border text-sm bg-white dark:bg-gray-900 text-black dark:text-white transition-colors focus:outline-none dark:[color-scheme:dark] ${
                    errors.dateStarted
                      ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                  } ${
                    editingTask
                      ? "opacity-60 cursor-not-allowed bg-gray-100 dark:bg-gray-800"
                      : "cursor-pointer"
                  }`}
                  disabled={isSubmitting || !!editingTask}
                  title={
                    editingTask ? "Start date cannot be changed" : undefined
                  }
                />
                {editingTask && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Start date cannot be changed
                  </p>
                )}
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
                  onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                  min={
                    editingTask
                      ? (() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return getLocalDateString(tomorrow);
                        })()
                      : undefined
                  }
                  className={`w-full px-3 py-2 border text-sm bg-white dark:bg-gray-900 text-black dark:text-white transition-colors focus:outline-none cursor-pointer dark:[color-scheme:dark] ${
                    errors.dateEnded
                      ? "border-red-300 dark:border-red-700 focus:border-red-500 dark:focus:border-red-400 focus:ring-1 focus:ring-red-500 dark:focus:ring-red-400"
                      : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-gray-500 focus:ring-1 focus:ring-black dark:focus:ring-white"
                  }`}
                  disabled={isSubmitting}
                />
                {editingTask && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    End date must be after today
                  </p>
                )}
                {errors.dateEnded && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {errors.dateEnded}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 text-sm border-2 border-red-500 dark:border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
            style={{ borderRadius: 0 }}
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

export default AddTaskForm;
