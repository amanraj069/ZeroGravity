"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import {
  academiaService,
  type Semester,
  type Course,
  GRADE_OPTIONS,
} from "@/services/academiaService";
import { BackButton } from "@/components/BackButton";
import SemesterDetailSkeleton from "@/components/academia/SemesterDetailSkeleton";

export default function SemesterDetailPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const semesterId = params?.semesterId as string;

  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set(),
  );

  // New course form
  const [addingCourse, setAddingCourse] = useState(false);
  const [showAddCoursePrompt, setShowAddCoursePrompt] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseGrade, setNewCourseGrade] = useState("");
  const [newCourseCredits, setNewCourseCredits] = useState(4);
  const [newCourseAdditionalInfo, setNewCourseAdditionalInfo] = useState("");
  const [newCourseAbsents, setNewCourseAbsents] = useState(0);

  // Editing states
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseGrade, setEditCourseGrade] = useState("");
  const [editCourseCredits, setEditCourseCredits] = useState(4);
  const [editCourseAdditionalInfo, setEditCourseAdditionalInfo] = useState("");
  const [editCourseAbsents, setEditCourseAbsents] = useState(0);

  const fetchSemester = useCallback(async () => {
    if (!semesterId) return;
    try {
      setLoading(true);
      setError("");
      const data = await academiaService.getSemester(semesterId);
      setSemester(data);
    } catch (err: unknown) {
      console.error("Error fetching semester:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load semester";
      setError(errorMessage);
      if (errorMessage.includes("not found")) {
        router.push("/academia");
      }
    } finally {
      setLoading(false);
    }
  }, [semesterId, router]);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn && semesterId) {
      fetchSemester();
    }
  }, [isLoggedIn, authLoading, semesterId, router, fetchSemester]);

  const handleAddCourseClick = () => {
    setShowAddCoursePrompt(true);
    setNewCourseName("");
    setNewCourseGrade("");
    setNewCourseCredits(4);
    setNewCourseAdditionalInfo("");
    setNewCourseAbsents(0);
  };

  const handleAddCourse = async () => {
    if (!newCourseName.trim()) {
      setError("Please enter a course name");
      return;
    }

    try {
      setAddingCourse(true);
      setError("");
      const newCourse = await academiaService.addCourse(semesterId, {
        name: newCourseName.trim(),
        grade: newCourseGrade.trim() || undefined,
        credits: newCourseCredits,
        additionalInfo: newCourseAdditionalInfo.trim() || undefined,
        absents: newCourseAbsents,
      });
      setSemester((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: [...prev.courses, newCourse],
        };
      });
      setNewCourseName("");
      setNewCourseGrade("");
      setNewCourseCredits(4);
      setNewCourseAdditionalInfo("");
      setNewCourseAbsents(0);
      setShowAddCoursePrompt(false);
    } catch (err: unknown) {
      console.error("Error adding course:", err);
      setError(err instanceof Error ? err.message : "Failed to add course");
    } finally {
      setAddingCourse(false);
    }
  };

  const handleCancelAddCourse = () => {
    setShowAddCoursePrompt(false);
    setNewCourseName("");
    setNewCourseGrade("");
    setNewCourseCredits(4);
    setNewCourseAdditionalInfo("");
    setNewCourseAbsents(0);
  };

  const handleUpdateCourse = async (courseId: string) => {
    try {
      setError("");
      const updatedCourse = await academiaService.updateCourse(
        semesterId,
        courseId,
        {
          name: editCourseName.trim(),
          grade: editCourseGrade.trim(),
          credits: editCourseCredits,
          additionalInfo: editCourseAdditionalInfo.trim(),
          absents: editCourseAbsents,
        },
      );
      setSemester((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: prev.courses.map((c) =>
            c.courseId === courseId ? updatedCourse : c,
          ),
        };
      });
      setEditingCourse(null);
      setEditCourseName("");
      setEditCourseGrade("");
      setEditCourseCredits(4);
      setEditCourseAdditionalInfo("");
      setEditCourseAbsents(0);
    } catch (err: unknown) {
      console.error("Error updating course:", err);
      setError(err instanceof Error ? err.message : "Failed to update course");
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) {
      return;
    }

    try {
      setError("");
      await academiaService.deleteCourse(semesterId, courseId);
      setSemester((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: prev.courses.filter((c) => c.courseId !== courseId),
        };
      });
      setExpandedCourses((prev) => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    } catch (err: unknown) {
      console.error("Error deleting course:", err);
      setError(err instanceof Error ? err.message : "Failed to delete course");
    }
  };

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(courseId)) {
        newSet.delete(courseId);
      } else {
        newSet.add(courseId);
      }
      return newSet;
    });
  };

  const startEditing = (course: Course) => {
    setEditingCourse(course.courseId);
    setEditCourseName(course.name);
    setEditCourseGrade(course.grade || "");
    setEditCourseCredits(course.credits || 4);
    setEditCourseAdditionalInfo(course.additionalInfo || "");
    setEditCourseAbsents(course.absents || 0);
  };

  const cancelEditing = () => {
    setEditingCourse(null);
    setEditCourseName("");
    setEditCourseGrade("");
    setEditCourseCredits(4);
    setEditCourseAdditionalInfo("");
    setEditCourseAbsents(0);
  };

  if (authLoading || loading) {
    return <SemesterDetailSkeleton />;
  }

  if (!isLoggedIn) {
    return (
      <ZeroGravityLoading
        title="Redirecting"
        subtitle="Redirecting to login..."
        showNavigation={false}
      />
    );
  }

  if (!semester) {
    return (
      <DashboardLayout>
        <div className="mt-4">
          <div className="flex items-center gap-2 sm:gap-4 mb-8">
            <BackButton
              href="/academia"
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
            />
            <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white">
              Semester Not Found
            </h1>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mt-2 sm:mt-4">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-4 mb-2">
            <BackButton
              href="/academia"
              className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white mb-0.5 sm:mb-1">
                {semester.name}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Manage your Courses
              </p>
            </div>
            <button
              onClick={handleAddCourseClick}
              disabled={addingCourse || showAddCoursePrompt}
              className="group relative inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 font-medium tracking-wide text-white dark:text-black transition-all duration-300 rounded-lg overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-black dark:bg-white transition-all duration-300 group-hover:opacity-90" />
              <span className="relative text-lg sm:text-xl">+</span>
              <span className="relative text-[10px] sm:text-xs font-bold uppercase tracking-widest hidden sm:inline">Add Course</span>
              <span className="relative text-[10px] font-bold uppercase tracking-widest sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Add Course Prompt Modal */}
        {showAddCoursePrompt && (
          <div className="mb-3 sm:mb-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] shadow-sm dark:shadow-[0_12px_25px_rgba(0,0,0,0.45)] p-4 sm:p-6 rounded-xl">
            <h3 className="text-base sm:text-lg font-semibold text-black dark:text-white mb-3 sm:mb-4">
              Add New Course
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Enter course name"
                    className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                    autoFocus
                  />
                </div>
                <div className="sm:col-span-5">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Grade
                  </label>
                  <select
                    value={newCourseGrade}
                    onChange={(e) => setNewCourseGrade(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                    style={{
                      paddingRight: "2rem",
                      minHeight: "2.5rem",
                    }}
                  >
                    <option value="" className="text-sm sm:text-base">
                      Select Grade
                    </option>
                    {GRADE_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                        className="text-sm sm:text-base"
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={newCourseCredits}
                    onChange={(e) =>
                      setNewCourseCredits(Number(e.target.value))
                    }
                    className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                <div className="sm:col-span-12">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    Absents
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newCourseAbsents}
                    onChange={(e) =>
                      setNewCourseAbsents(Number(e.target.value))
                    }
                    className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                  Additional Info
                </label>
                <textarea
                  value={newCourseAdditionalInfo}
                  onChange={(e) => setNewCourseAdditionalInfo(e.target.value)}
                  placeholder={`e.g., Mid1: 19/20
Mid1 Evaluation: 13/15
Assignment: 8/10
...`}
                  rows={4}
                  className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 font-mono text-xs sm:text-sm rounded-lg transition-all"
                />
                <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                  Write additional information like evaluations, assignments,
                  etc.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                <button
                  onClick={handleAddCourse}
                  disabled={addingCourse}
                  className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm rounded-lg font-bold uppercase tracking-wider shadow-sm"
                >
                  {addingCourse ? "Adding..." : "Add"}
                </button>
                <button
                  onClick={handleCancelAddCourse}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-xs sm:text-sm rounded-lg font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-3 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Courses List */}
        {semester.courses.length === 0 ? (
          <div className="text-center border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] shadow-sm dark:shadow-[0_12px_25px_rgba(0,0,0,0.45)] rounded-xl h-[70dvh] flex flex-col items-center justify-center gap-2">
            <h2 className="text-xl sm:text-2xl font-light text-black dark:text-white px-4">
              No courses yet.
            </h2>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 px-4">
              Click &quot;Add Course&quot; to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {semester.courses.map((course) => (
              <div
                key={course.courseId}
                className="group/card border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#050710] hover:border-purple-300/20 dark:hover:border-purple-200/40 hover:bg-gray-50 dark:hover:bg-[#0a0e17] shadow-sm transition-all duration-300 rounded-xl p-4 sm:p-6"
              >
                {editingCourse === course.courseId ? (
                  /* Edit Mode */
                  <div className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                      <div className="sm:col-span-5">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                          Course Name
                        </label>
                        <input
                          type="text"
                          value={editCourseName}
                          onChange={(e) => setEditCourseName(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                          Grade
                        </label>
                        <select
                          value={editCourseGrade}
                          onChange={(e) => setEditCourseGrade(e.target.value)}
                          className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                          style={{
                            paddingRight: "2rem",
                            minHeight: "2.5rem",
                          }}
                        >
                          <option value="" className="text-sm sm:text-base">
                            Select Grade
                          </option>
                          {GRADE_OPTIONS.map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                              className="text-sm sm:text-base"
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                          Credits
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="20"
                          value={editCourseCredits}
                          onChange={(e) =>
                            setEditCourseCredits(Number(e.target.value))
                          }
                          className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                      <div className="sm:col-span-12">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                          Absents
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editCourseAbsents}
                          onChange={(e) =>
                            setEditCourseAbsents(Number(e.target.value))
                          }
                          className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 text-sm sm:text-base rounded-lg transition-all"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                        Additional Info
                      </label>
                      <textarea
                        value={editCourseAdditionalInfo}
                        onChange={(e) =>
                          setEditCourseAdditionalInfo(e.target.value)
                        }
                        placeholder={`e.g., Mid1: 19/20
Mid1 Evaluation: 13/15
Assignment: 8/10
...`}
                        rows={6}
                        className="w-full px-3 sm:px-4 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 font-mono text-sm rounded-lg transition-all"
                      />
                      <p className="mt-1 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                        Write additional information like evaluations,
                        assignments, etc.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
                      <button
                        onClick={() => handleUpdateCourse(course.courseId)}
                        className="w-full py-3 bg-black dark:bg-white text-white dark:text-black hover:opacity-90 transition-all text-xs sm:text-sm rounded-lg font-bold uppercase tracking-wider shadow-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all text-xs sm:text-sm rounded-lg font-bold uppercase tracking-wider border border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div
                      className="flex items-start justify-between mb-3 sm:mb-4 cursor-pointer"
                      onClick={() => toggleCourseExpand(course.courseId)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white transition-colors truncate">
                            {course.name}
                          </h3>
                        </div>
                          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                            {course.grade && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                                  Grade
                                </span>
                                <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-bold">
                                  {course.grade}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                                Credits
                               </span>
                              <span className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-bold">
                                {course.credits || 4}
                              </span>
                            </div>
                            {course.absents > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                                  Absents
                                </span>
                                <span className="text-sm sm:text-base text-red-500 dark:text-red-400 font-bold">
                                  {course.absents}
                                </span>
                              </div>
                            )}
                          </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCourseExpand(course.courseId);
                          }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                          title="Toggle additional info"
                        >
                          {expandedCourses.has(course.courseId) ? (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(course);
                          }}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                          title="Edit course"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(course.courseId);
                          }}
                          className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                          title="Delete course"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Additional Info */}
                    {expandedCourses.has(course.courseId) && (
                      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Additional Information
                        </h4>
                        {course.additionalInfo ? (
                          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-gray-800 rounded-lg">
                            <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-mono">
                              {course.additionalInfo}
                            </pre>
                          </div>
                        ) : (
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
                            No additional information added yet. Click edit to
                            add details like evaluations, assignments, etc.
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
