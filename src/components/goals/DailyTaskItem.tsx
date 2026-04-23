"use client";

import React from "react";
import { CheckCircle, Edit2, Trash2, Calendar } from "lucide-react";
import { DailyTask } from "@/services/dailyTasksService";

interface DailyTaskItemProps {
  task: DailyTask;
  togglingTaskId: string | null;
  isToday: boolean;
  onToggleCompletion: (taskId: string) => void;
  onEdit: (task: DailyTask) => void;
  onDelete: (taskId: string) => void;
}

const DailyTaskItem: React.FC<DailyTaskItemProps> = ({
  task,
  togglingTaskId,
  isToday,
  onToggleCompletion,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      className={`shadow-sm border p-4 transition-all duration-200 relative ${
        togglingTaskId === task._id
          ? "opacity-75 pointer-events-none"
          : ""
      } ${
        task.isCompletedToday
          ? "ring-1 ring-green-200 dark:ring-green-800 bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-800"
          : task.priority === "high"
          ? "bg-red-50/30 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 hover:bg-red-50/40 dark:hover:bg-red-950/30 hover:shadow-md"
          : task.priority === "medium"
          ? "bg-amber-50/30 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 hover:shadow-md"
          : "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 hover:shadow-md"
      }`}
    >
      {togglingTaskId === task._id && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 dark:border-blue-400 border-t-transparent  animate-spin" />
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Updating...
            </span>
          </div>
        </div>
      )}
      <div className="flex items-start gap-3">
        <button
          onClick={() =>
            isToday && !togglingTaskId && onToggleCompletion(task._id)
          }
          disabled={
            !isToday || togglingTaskId === task._id || !!togglingTaskId
          }
          title={
            !isToday
              ? "You can only mark tasks for today"
              : togglingTaskId === task._id
              ? "Updating task..."
              : togglingTaskId
              ? "Please wait for the current update to complete"
              : undefined
          }
          className={`flex-shrink-0 w-6 h-6 border-2 flex items-center justify-center mt-0.5 transition-all duration-200 relative ${
            togglingTaskId === task._id
              ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30"
              : task.isCompletedToday
              ? "bg-green-600 dark:bg-green-700 border-green-600 dark:border-green-700 text-white shadow-sm"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
          } ${
            !isToday || togglingTaskId
              ? "opacity-70 cursor-not-allowed"
              : "cursor-pointer"
          }`}
        >
          {togglingTaskId === task._id ? (
            <div className="w-4 h-4 border-2 border-blue-500 dark:border-blue-400 border-t-transparent animate-spin" />
          ) : (
            task.isCompletedToday && <CheckCircle className="w-4 h-4" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3
                className={`font-medium text-sm sm:text-base ${
                  task.isCompletedToday
                    ? "line-through text-gray-500 dark:text-gray-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {task.title}
              </h3>
              {task.description && (
                <p
                  className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                    task.isCompletedToday
                      ? "text-gray-400 dark:text-gray-500"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  {task.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 ml-2">
              <button
                onClick={() => onEdit(task)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="Edit task"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(task._id)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                title="Delete task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Details */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(task.dateStarted).toLocaleDateString()} -{" "}
                  {new Date(task.dateEnded).toLocaleDateString()}
                </span>
              </div>
              {/* Desktop priority tag - original position and text */}
              <span
                className={`hidden md:inline-block px-2 py-0.5 text-xs font-medium ${
                  task.priority === "high"
                    ? "bg-red-500 dark:bg-red-700 text-white dark:text-red-100 border border-red-600 dark:border-red-600"
                    : task.priority === "medium"
                    ? "bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100 border border-amber-600 dark:border-amber-600"
                    : "bg-emerald-500 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-600 dark:border-emerald-600"
                }`}
              >
                {task.priority} priority
              </span>
              {!task.isActive && (
                <div className="text-orange-600 dark:text-orange-400 text-xs bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5">
                  Inactive
                </div>
              )}
            </div>
            {task.lastCompletedDate && (
              <span className="text-green-600 dark:text-green-400">
                Last completed:{" "}
                {new Date(task.lastCompletedDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* Mobile priority tag - bottom right, no rounded corners */}
          <span
            className={`md:hidden absolute bottom-4 right-4 px-2 py-0.5 text-xs font-medium ${
              task.priority === "high"
                ? "bg-red-500 dark:bg-red-700 text-white dark:text-red-100 border border-red-600 dark:border-red-600"
                : task.priority === "medium"
                ? "bg-amber-500 dark:bg-amber-700 text-white dark:text-amber-100 border border-amber-600 dark:border-amber-600"
                : "bg-emerald-500 dark:bg-emerald-700 text-white dark:text-emerald-100 border border-emerald-600 dark:border-emerald-600"
            }`}
          >
            {task.priority.charAt(0).toUpperCase() +
              task.priority.slice(1)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyTaskItem;
