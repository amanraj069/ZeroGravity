"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { CreateGoalData, Goal, UpdateGoalData } from "@/services/goalsService";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGoal: (goal: CreateGoalData) => void;
  onUpdateGoal?: (id: string, goal: UpdateGoalData) => void;
  editingGoal?: Goal | null;
}

const createStarfield = (count = 90) =>
  Array.from({ length: count }).map(() => ({
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: 1 + Math.random() * 2,
    opacity: 0.2 + Math.random() * 0.6,
    delay: Math.random() * 5,
    twinkleDuration: 3 + Math.random() * 4,
    twinkleDelay: Math.random() * 4,
    moveX: Math.random() * 8 - 4,
    moveY: Math.random() * 8 - 4,
  }));

const AddGoalModal: React.FC<AddGoalModalProps> = ({
  isOpen,
  onClose,
  onAddGoal,
  onUpdateGoal,
  editingGoal,
}) => {
  const isEditing = !!editingGoal;
  const modalStars = useMemo(() => createStarfield(110), []);
  const buttonStars = useMemo(() => createStarfield(40), []);

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
    <div className="fixed inset-0 bg-[#020410]/90 backdrop-blur-lg flex items-center justify-center z-50 p-4 transition-all">
      <div className="goal-modal-shell relative w-full max-w-2xl max-h-[85vh] overflow-y-auto border border-white/20 bg-[#01020a]/95 shadow-[0_0_45px_rgba(26,110,255,0.35)] overflow-hidden">
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @keyframes goalModalStarTwinkle {
                0%, 100% { opacity: 0.2; }
                50% { opacity: 1; }
              }
              @keyframes goalModalStarFadeIn {
                0% { opacity: 0; transform: scale(0); }
                100% { opacity: var(--goal-star-opacity); transform: scale(1); }
              }
              .goal-modal-star {
                animation: goalModalStarFadeIn 0.6s ease-out forwards, goalModalStarTwinkle var(--goal-star-twinkle-duration) ease-in-out infinite;
                animation-delay: var(--goal-star-appear-delay), var(--goal-star-twinkle-delay);
                opacity: 0;
                transform: translate(0, 0);
                transition: transform 0.3s ease-out;
              }
              .goal-modal-shell:hover .goal-modal-star {
                transform: translate(var(--goal-star-move-x), var(--goal-star-move-y));
              }
              .goal-modal-cta-star {
                animation: goalModalStarFadeIn 0.5s ease-out forwards, goalModalStarTwinkle var(--goal-star-twinkle-duration) ease-in-out infinite;
                animation-delay: var(--goal-star-appear-delay), var(--goal-star-twinkle-delay);
                opacity: 0;
                transform: translate(0, 0);
              }
              .goal-modal-cta:hover .goal-modal-cta-star {
                transform: translate(var(--goal-star-move-x), var(--goal-star-move-y));
              }
            `,
          }}
        />
        <div className="absolute inset-0 bg-black">
          {modalStars.map((star, index) => (
            <div
              key={index}
              className="goal-modal-star absolute rounded-full bg-white/90"
              style={
                {
                  left: star.left,
                  top: star.top,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  "--goal-star-opacity": `${star.opacity}`,
                  "--goal-star-appear-delay": `${star.delay * 0.1}s`,
                  "--goal-star-twinkle-duration": `${star.twinkleDuration}s`,
                  "--goal-star-twinkle-delay": `${star.twinkleDelay}s`,
                  "--goal-star-move-x": `${star.moveX}px`,
                  "--goal-star-move-y": `${star.moveY}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="relative z-10 bg-gradient-to-b from-[#050a1b]/95 via-[#040919]/95 to-[#01020b]/95 backdrop-blur-sm p-8 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-blue-200/70">
                {isEditing ? "Update your mission" : "Let’s set a new mission"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">
                {isEditing ? "Edit Goal" : "Create Goal"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="border border-white/15 bg-[#04071c] p-2 text-slate-200 transition hover:scale-105 hover:border-blue-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                className="w-full rounded-none border border-white/15 bg-[#03112c] px-4 py-3 text-base text-white shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-[#020312]"
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
              className="w-full rounded-none border border-white/15 bg-[#03112c] px-4 py-3 text-base text-white shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-[#020312]"
              rows={3}
              placeholder="Description (optional)"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
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
                className="w-full rounded-none border border-white/15 bg-[#03112c] px-4 py-3 text-base text-white shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-[#020312]"
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
                className="w-full rounded-none border border-white/15 bg-[#03112c] px-4 py-3 text-base text-white shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-[#020312]"
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
                className="w-full rounded-none border border-white/15 bg-[#03112c] px-4 py-3 text-base text-white shadow-sm transition focus:border-blue-400 focus:ring-2 focus:ring-blue-900 focus:ring-offset-2 focus:ring-offset-[#020312]"
              />
            </div>
          </div>

          {/* Milestones section - Available for both adding and editing */}
          {milestones.length > 0 && (
            <div className="space-y-4 rounded-none border border-white/10 bg-[#030a1f]/80 p-4 shadow-inner">
              <div className="flex items-center justify-between text-sm font-medium text-blue-100">
                <span>
                  Milestones
                </span>
              </div>
              {milestones.map((milestone, milestoneIndex) => (
                <div
                  key={milestoneIndex}
                  className="rounded-none border border-white/10 bg-[#04102a] p-3 shadow-sm transition hover:border-blue-400"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={milestone.title}
                      onChange={(e) =>
                        updateMilestone(milestoneIndex, "title", e.target.value)
                      }
                      className="mr-2 flex-1 rounded-none border border-white/15 bg-[#020b1f] px-3 py-2 text-sm text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-800"
                      placeholder="Milestone title"
                    />
                    <button
                      type="button"
                      onClick={() => removeMilestone(milestoneIndex)}
                      className="p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
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
                    className="mt-2 w-full rounded-none border border-white/15 bg-[#020b1f] px-3 py-2 text-sm text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-800"
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={addMilestone}
            className="w-full rounded-none border border-dashed border-white/15 py-3 text-sm font-medium text-blue-100 transition hover:border-blue-400 hover:text-blue-200"
          >
            + Add Milestone
          </button>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-none border border-white/15 px-4 py-3 text-sm font-medium text-blue-100 transition hover:border-blue-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="goal-modal-cta relative flex-1 overflow-hidden rounded-none border border-white/20 bg-gradient-to-r from-[#050505] via-[#0b0b12] to-black px-4 py-3 text-sm font-semibold text-white shadow-[0_0_25px_rgba(0,0,0,0.6)] transition hover:brightness-115 hover:shadow-[0_0_35px_rgba(72,94,255,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <div className="absolute inset-0 bg-black/40">
                {buttonStars.map((star, index) => (
                  <div
                    key={index}
                    className="goal-modal-cta-star absolute rounded-full bg-white/90"
                    style={
                      {
                        left: star.left,
                        top: star.top,
                        width: `${star.size}px`,
                        height: `${star.size}px`,
                        "--goal-star-opacity": `${star.opacity}`,
                        "--goal-star-appear-delay": `${star.delay * 0.1}s`,
                        "--goal-star-twinkle-duration": `${star.twinkleDuration}s`,
                        "--goal-star-twinkle-delay": `${star.twinkleDelay}s`,
                        "--goal-star-move-x": `${star.moveX}px`,
                        "--goal-star-move-y": `${star.moveY}px`,
                      } as React.CSSProperties
                    }
                  />
                ))}
              </div>
              <span className="relative z-10">
                {isEditing ? "Update Goal" : "Create Goal"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  );
};

export default AddGoalModal;
