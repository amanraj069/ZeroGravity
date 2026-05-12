"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Check, AlertCircle, Sparkles, RefreshCw, ChevronDown, ChevronUp, Settings2 } from "lucide-react";
import {
  dailyTasksService,
  StudyPlanTask,
  StudyPlanQuota,
} from "@/services/dailyTasksService";
import LoadingSpinner from "@/components/LoadingSpinner";

interface StudyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTasksCreated: () => Promise<void>;
}

// Helper function to get local date string in YYYY-MM-DD format
const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function StudyPlannerModal({
  isOpen,
  onClose,
  onTasksCreated,
}: StudyPlannerModalProps) {
  // Study Planner State
  const [spTopic, setSpTopic] = useState("");
  const [spStartDate, setSpStartDate] = useState(getLocalDateString());
  const [spEndDate, setSpEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return getLocalDateString(d);
  });
  const [spHoursPerDay, setSpHoursPerDay] = useState("2");
  const [spIsGenerating, setSpIsGenerating] = useState(false);
  const [spPlan, setSpPlan] = useState<StudyPlanTask[]>([]);
  const [spError, setSpError] = useState<string | null>(null);
  const [spNotice, setSpNotice] = useState<string | null>(null);
  const [spQuota, setSpQuota] = useState<StudyPlanQuota | null>(null);
  const [spIsCreating, setSpIsCreating] = useState(false);
  const [spCreatedCount, setSpCreatedCount] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const [spConfigExpanded, setSpConfigExpanded] = useState(false);
  
  // Rotating loading messages
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const loadingMessages = [
    "Calculating optimal study trajectories...",
    "Synthesizing knowledge nodes...",
    "Consulting the ZeroGravity AI core...",
    "Assembling your unique roadmap...",
    "Optimizing neural pathways...",
    "Bending space-time for your schedule...",
    "Mapping out your neural journey..."
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (spIsGenerating) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [spIsGenerating, loadingMessages.length]);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (spNotice) {
      timeout = setTimeout(() => {
        setSpNotice(null);
      }, 5000);
    }
    return () => clearTimeout(timeout);
  }, [spNotice]);

  // Fetch quota when modal opens
  useEffect(() => {
    if (isOpen && mounted) {
      dailyTasksService
        .getStudyPlanQuota()
        .then(setSpQuota)
        .catch(() => {});
    }
  }, [isOpen, mounted]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed top-[53px] sm:top-[64px] left-0 right-0 bottom-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 overflow-hidden">
      <div className="bg-white dark:bg-gray-900 w-full max-w-6xl shadow-xl flex flex-col max-h-full">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-2">
          <h2 className="text-base sm:text-xl font-light text-gray-900 dark:text-gray-100 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-gray-900 dark:text-gray-100 flex-shrink-0" />
            <span className="truncate">AI Study Planner</span>
          </h2>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {spQuota && (
              <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 sm:px-2 sm:py-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {spQuota.remaining} <span className="hidden sm:inline">plans </span>left
              </span>
            )}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors p-1 -mr-1"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-5 sm:p-6 min-h-0">
          {/* Notice Banner (for fallback) */}
          {spNotice && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-3 flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-top-1">
              <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex-1">
                {spNotice}
              </p>
              <button
                onClick={() => setSpNotice(null)}
                className="text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error Banner */}
          {spError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 p-3 flex items-start gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-red-800 dark:text-red-300 flex-1">
                {spError}
              </p>
              <button
                onClick={() => setSpError(null)}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Success Banner */}
          {spCreatedCount !== null && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50 p-3 flex items-start gap-3 mb-4">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-green-800 dark:text-green-300 flex-1">
                {spCreatedCount} study task{spCreatedCount === 1 ? "" : "s"} created successfully! They will appear in your daily tasks.
              </p>
              <button
                onClick={() => setSpCreatedCount(null)}
                className="text-green-400 hover:text-green-600 dark:hover:text-green-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input Form */}
          <div className="flex flex-col gap-4 flex-shrink-0">
            {/* Topic */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Topic / Subject
              </label>
              <textarea
                className="w-full p-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 transition-all duration-300 ease-in-out"
                  rows={
                    spPlan.length > 0 || spIsGenerating
                      ? Math.min(
                          3,
                          Math.max(
                            1,
                            spTopic
                              .split("\n")
                              .reduce(
                                (acc, line) =>
                                  acc + Math.max(1, Math.ceil(line.length / 80)),
                                0
                              )
                          )
                        )
                      : 8
                  }
                value={spTopic}
                onChange={(e) => setSpTopic(e.target.value)}
                placeholder={"Describe what you want to study...\ne.g. \"Binary Trees & BST for my DSA exam\""}
                disabled={spIsGenerating}
                maxLength={500}
              />
            </div>

            {/* Date & Hours Row — shown always when no plan, collapsible after plan generated */}
            {spPlan.length === 0 ? (
              /* Before generation: show config fields inline */
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={spStartDate}
                      min={getLocalDateString()}
                      onChange={(e) => setSpStartDate(e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="px-2 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 cursor-pointer dark:[color-scheme:dark]"
                      disabled={spIsGenerating}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={spEndDate}
                      min={getLocalDateString()}
                      onChange={(e) => setSpEndDate(e.target.value)}
                      onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                      className="px-2 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 cursor-pointer dark:[color-scheme:dark]"
                      disabled={spIsGenerating}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Hours/day
                    </label>
                    <select
                      value={spHoursPerDay}
                      onChange={(e) => setSpHoursPerDay(e.target.value)}
                      className="px-2 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500"
                      disabled={spIsGenerating}
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                        <option key={h} value={h}>
                          {h} hour{h > 1 ? "s" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1 justify-end">
                    <button
                      className="w-full px-4 py-2 text-sm bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 h-[38px]"
                      onClick={async () => {
                        if (!spTopic.trim()) {
                          setSpError("Please enter a topic.");
                          return;
                        }
                        if (spTopic.trim().length > 500) {
                          setSpError("Topic cannot exceed 500 characters.");
                          return;
                        }
                        setSpError(null);
                        setSpNotice(null);
                        setSpIsGenerating(true);
                        setSpPlan([]);
                        setSpCreatedCount(null);
                        try {
                          const result = await dailyTasksService.generateStudyPlan(
                            spTopic.trim(),
                            spStartDate,
                            spEndDate,
                            parseInt(spHoursPerDay, 10)
                          );
                          if (result.success && result.plan) {
                            setSpPlan(result.plan);
                            if (result.quota) setSpQuota(result.quota);
                            if (result.fallbackOccurred) {
                              setSpNotice("The primary model was busy. We've used our secondary AI to generate your plan without any delay.");
                            }
                          } else {
                              // Show the specific backend error if it's a limit/quota error, otherwise generic
                              const errorMsg = result.message?.includes("limit") 
                                ? result.message 
                                : "Study plan generation failed due to high AI traffic. Please try again later or contact the administrator.";
                              setSpError(errorMsg);
                              if (result.quota) setSpQuota(result.quota);
                          }
                        } catch {
                          setSpError("A system connection error occurred. Please contact the administrator.");
                        } finally {
                          setSpIsGenerating(false);
                        }
                      }}
                      disabled={spIsGenerating || !spTopic.trim() || !!(spQuota && spQuota.used >= spQuota.limit)}
                    >
                      {spQuota && spQuota.used >= spQuota.limit 
                        ? "Out of Credits" 
                        : spIsGenerating ? "Generating..." : "Generate"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* After generation: collapsible config section */
              !spIsGenerating && (
                <div className="border border-gray-200 dark:border-gray-700 transition-all">
                  <button
                    className="w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setSpConfigExpanded(!spConfigExpanded)}
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="w-3.5 h-3.5" />
                      Configure schedule & hours
                    </span>
                    {spConfigExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  {spConfigExpanded && (
                    <div className="px-3 pb-3 pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1 min-w-0">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={spStartDate}
                            min={getLocalDateString()}
                            onChange={(e) => setSpStartDate(e.target.value)}
                            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 cursor-pointer dark:[color-scheme:dark]"
                          />
                        </div>
                        <div className="flex flex-col gap-1 min-w-0">
                          <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={spEndDate}
                            min={getLocalDateString()}
                            onChange={(e) => setSpEndDate(e.target.value)}
                            onClick={(e) => (e.target as HTMLInputElement).showPicker?.()}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500 cursor-pointer dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                          Hours/day
                        </label>
                        <select
                          value={spHoursPerDay}
                          onChange={(e) => setSpHoursPerDay(e.target.value)}
                          className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-black dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-gray-500"
                        >
                          {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((h) => (
                            <option key={h} value={h}>
                              {h} hour{h > 1 ? "s" : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}
          </div>

          {/* Loading State */}
          {spIsGenerating && (
            <div className="flex flex-col items-center justify-center py-6 sm:py-8 gap-4 animate-in fade-in zoom-in duration-500">
              <LoadingSpinner size="lg" showText={false} />
              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {loadingMessages[loadingMsgIdx]}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  This may take a moment while the AI initializes your plan.
                </p>
              </div>
            </div>
          )}

          {/* Generated Plan */}
          {spPlan.length > 0 && !spIsGenerating && (
            <div className="mt-4 flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-3 flex-shrink-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Generated Plan ({spPlan.filter((t) => t.selected).length}/{spPlan.length} selected)
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors underline"
                    onClick={() => {
                      const allSelected = spPlan.every((t) => t.selected);
                      setSpPlan((prev) =>
                        prev.map((t) => ({ ...t, selected: !allSelected }))
                      );
                    }}
                  >
                    {spPlan.every((t) => t.selected)
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
              </div>

              <div className="space-y-2 overflow-y-auto flex-1 min-h-0 scrollbar-hide">
                {spPlan.map((task, idx) => {
                  const dateObj = new Date(task.date + "T00:00:00");
                  const dayName = dateObj.toLocaleDateString("en-US", {
                    weekday: "short",
                  });
                  const dateDisplay = dateObj.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });

                  const isTaskToday = task.date === getLocalDateString();
                  return (
                    <div
                      key={idx}
                      className={`border p-3 transition-all cursor-pointer ${
                        task.selected
                          ? isTaskToday
                            ? "border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20"
                            : "border-green-300 dark:border-green-700 bg-green-50/50 dark:bg-green-950/20"
                          : "border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 opacity-60"
                      }`}
                      onClick={() =>
                        setSpPlan((prev) =>
                          prev.map((t, i) =>
                            i === idx
                              ? { ...t, selected: !t.selected }
                              : t
                          )
                        )
                      }
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div
                          className={`flex-shrink-0 w-5 h-5 border-2 flex items-center justify-center mt-0.5 transition-colors ${
                            task.selected
                              ? isTaskToday
                                ? "bg-purple-600 dark:bg-purple-700 border-purple-600 dark:border-purple-700 text-white"
                                : "bg-green-600 dark:bg-green-700 border-green-600 dark:border-green-700 text-white"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        >
                          {task.selected && <Check className="w-3 h-3" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {task.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`px-1.5 py-0.5 text-[10px] font-medium ${
                                  task.priority === "high"
                                    ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                                    : task.priority === "medium"
                                    ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                    : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>
                          </div>
                          {task.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                              {task.description}
                            </p>
                          )}
                          <span
                            className={`text-[10px] font-medium flex items-center gap-1 ${
                              isTaskToday
                                ? "text-purple-500 dark:text-purple-400"
                                : "text-gray-400 dark:text-gray-500"
                            }`}
                          >
                            {isTaskToday ? "Today" : dayName}, {dateDisplay}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {spPlan.length > 0 && !spIsGenerating && (
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              {/* Generate New — left */}
              <button
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium truncate"
                onClick={() => {
                  setSpPlan([]);
                  setSpTopic("");
                  setSpError(null);
                  setSpCreatedCount(null);
                  setSpConfigExpanded(false);
                }}
                disabled={spIsCreating}
              >
                Generate New
              </button>

              {/* Regenerate — small icon button */}
              <button
                className="flex-shrink-0 w-9 h-9 sm:w-[38px] sm:h-[38px] flex items-center justify-center border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-black dark:hover:text-white transition-colors"
                title="Regenerate plan"
                onClick={async () => {
                  setSpError(null);
                  setSpNotice(null);
                  setSpIsGenerating(true);
                  setSpPlan([]);
                  setSpCreatedCount(null);
                  try {
                    const result = await dailyTasksService.generateStudyPlan(
                      spTopic.trim(),
                      spStartDate,
                      spEndDate,
                      parseInt(spHoursPerDay, 10)
                    );
                    if (result.success && result.plan) {
                      setSpPlan(result.plan);
                      if (result.quota) setSpQuota(result.quota);
                      if (result.fallbackOccurred) {
                        setSpNotice("The primary model was busy. We've used our secondary AI to generate your plan without any delay.");
                      }
                    } else {
                      // Show the specific backend error if it's a limit/quota error, otherwise generic
                      const errorMsg = result.message?.includes("limit") 
                        ? result.message 
                        : "Regeneration failed. Please try again later or contact the administrator.";
                      setSpError(errorMsg);
                      if (result.quota) setSpQuota(result.quota);
                    }
                  } catch {
                    setSpError("System communication failure. Please contact the administrator.");
                  } finally {
                    setSpIsGenerating(false);
                  }
                }}
                disabled={spIsGenerating || !!(spQuota && spQuota.used >= spQuota.limit)}
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              {/* Add Tasks — right, fills remaining space on mobile */}
              <button
                className="flex-1 sm:flex-none ml-auto px-3 sm:px-6 py-2 text-xs sm:text-sm bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 truncate"
                onClick={async () => {
                  const selected = spPlan.filter((t) => t.selected);
                  if (selected.length === 0) {
                    setSpError("Please select at least one task to add.");
                    return;
                  }
                  setSpIsCreating(true);
                  setSpError(null);
                  try {
                    await dailyTasksService.bulkCreateStudyTasks(
                      selected.map((t) => ({
                        date: t.date,
                        title: t.title,
                        description: t.description,
                        priority: t.priority,
                      }))
                    );
                    
                    // Reset state
                    setSpPlan([]);
                    setSpTopic("");
                    setSpConfigExpanded(false);
                    setSpCreatedCount(null);
                    
                    // Call parent callback to refresh data
                    await onTasksCreated();

                    // Close the popup automatically
                    onClose();
                  } catch (e) {
                    setSpError(
                      e instanceof Error ? e.message : "Failed to create tasks."
                    );
                  } finally {
                    setSpIsCreating(false);
                  }
                }}
                disabled={spIsCreating || spPlan.filter((t) => t.selected).length === 0}
              >
                {spIsCreating
                  ? "Creating..."
                  : `Add ${spPlan.filter((t) => t.selected).length} Task${spPlan.filter((t) => t.selected).length === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
