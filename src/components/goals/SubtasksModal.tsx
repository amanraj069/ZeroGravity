"use client";

import React, { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Goal, goalsService } from "@/services/goalsService";

interface SubtasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  milestoneId: string | null;
  onUpdateComplete: () => void; // Changed from onUpdateGoal to onUpdateComplete
}

const SubtasksModal: React.FC<SubtasksModalProps> = ({
  isOpen,
  onClose,
  goal,
  milestoneId,
  onUpdateComplete,
}) => {
  const [subtasks, setSubtasks] = useState<Array<{ title: string }>>([]);

  const milestone = goal?.milestones.find((m) => m.id === milestoneId);

  useEffect(() => {
    if (milestone) {
      setSubtasks(
        milestone.subtasks.map((subtask) => ({
          title: subtask.title,
        }))
      );
    } else {
      setSubtasks([]);
    }
  }, [milestone]);

  const addSubtask = () => {
    setSubtasks((prev) => [...prev, { title: "" }]);
  };

  const updateSubtask = (index: number, value: string) => {
    setSubtasks((prev) =>
      prev.map((subtask, i) =>
        i === index ? { ...subtask, title: value } : subtask
      )
    );
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!goal || !milestone) return;

    try {
      // Filter out empty subtasks and update via API
      const validSubtasks = subtasks.filter((s) => s.title.trim() !== "");

      await goalsService.updateSubtasks(goal._id, milestoneId!, validSubtasks);

      // Notify parent component to refresh
      onUpdateComplete();
      onClose();
    } catch (error) {
      console.error("Error updating subtasks:", error);
      // Could add error handling/notification here
    }
  };

  if (!isOpen || !milestone) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 shadow-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Manage Subtasks
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                For milestone: {milestone.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Subtasks list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Subtasks ({subtasks.length})
              </span>
            </div>

            {subtasks.map((subtask, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600" />
                <input
                  type="text"
                  value={subtask.title}
                  onChange={(e) => updateSubtask(index, e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm text-black dark:text-white bg-white dark:bg-gray-900"
                  placeholder="Subtask title"
                />
                <button
                  type="button"
                  onClick={() => removeSubtask(index)}
                  className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {subtasks.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">
                No subtasks yet. Click &quot;Add Subtask&quot; to get started.
              </p>
            )}
          </div>

          {/* Add subtask button */}
          <button
            type="button"
            onClick={addSubtask}
            className="w-full py-2 text-sm text-gray-600 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 -md hover:border-gray-400 dark:hover:border-gray-600 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Subtask
          </button>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 -md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-3 py-2 text-sm bg-black dark:bg-white text-white dark:text-black -md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Save Subtasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubtasksModal;
