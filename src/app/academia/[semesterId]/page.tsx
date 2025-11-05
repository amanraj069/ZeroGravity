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

export default function SemesterDetailPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const semesterId = params?.semesterId as string;

  const [semester, setSemester] = useState<Semester | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(
    new Set()
  );

  // New course form
  const [addingCourse, setAddingCourse] = useState(false);
  const [showAddCoursePrompt, setShowAddCoursePrompt] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseGrade, setNewCourseGrade] = useState("");
  const [newCourseCredits, setNewCourseCredits] = useState(4);
  const [newCourseAdditionalInfo, setNewCourseAdditionalInfo] = useState("");

  // Editing states
  const [editingCourse, setEditingCourse] = useState<string | null>(null);
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseGrade, setEditCourseGrade] = useState("");
  const [editCourseCredits, setEditCourseCredits] = useState(4);
  const [editCourseAdditionalInfo, setEditCourseAdditionalInfo] = useState("");

  const fetchSemester = useCallback(async () => {
    if (!semesterId) return;
    try {
      setLoading(true);
      setError("");
      const data = await academiaService.getSemester(semesterId);
      setSemester(data);
    } catch (err: unknown) {
      console.error("Error fetching semester:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load semester";
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
        }
      );
      setSemester((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          courses: prev.courses.map((c) =>
            c.courseId === courseId ? updatedCourse : c
          ),
        };
      });
      setEditingCourse(null);
      setEditCourseName("");
      setEditCourseGrade("");
      setEditCourseCredits(4);
      setEditCourseAdditionalInfo("");
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
  };

  const cancelEditing = () => {
    setEditingCourse(null);
    setEditCourseName("");
    setEditCourseGrade("");
    setEditCourseCredits(4);
    setEditCourseAdditionalInfo("");
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Semester"
        subtitle="Preparing your academic records..."
        showNavigation={false}
      />
    );
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mt-4">
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              Loading semester...
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!semester) {
    return (
      <DashboardLayout>
        <div className="mt-4">
          <div className="mb-8">
            <Link
              href="/academia"
              className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
            >
              <span className="mr-2">←</span>
              Back to Academia
            </Link>
            <h1 className="text-4xl font-light text-black dark:text-white mb-2">
              Semester Not Found
            </h1>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mt-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/academia"
            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-4"
          >
            <span className="mr-2">←</span>
            Back to Academia
          </Link>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-4xl font-light text-black dark:text-white mb-2">
                {semester.name}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your courses and grades
              </p>
            </div>
            <button
              onClick={handleAddCourseClick}
              disabled={addingCourse || showAddCoursePrompt}
              className="border-2 border-dotted border-gray-300 dark:border-gray-600 px-6 py-3 bg-white dark:bg-gray-800 hover:border-black dark:hover:border-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-black dark:text-white font-medium"
            >
              {addingCourse ? "Adding..." : "+ Add Course"}
            </button>
          </div>
        </div>

        {/* Add Course Prompt Modal */}
        {showAddCoursePrompt && (
          <div className="mb-6 border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-md p-6">
            <h3 className="text-lg font-semibold text-black dark:text-white mb-4">
              Add New Course
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Name
                  </label>
                  <input
                    type="text"
                    value={newCourseName}
                    onChange={(e) => setNewCourseName(e.target.value)}
                    placeholder="Enter course name"
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    autoFocus
                  />
                </div>
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Grade
                  </label>
                  <select
                    value={newCourseGrade}
                    onChange={(e) => setNewCourseGrade(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                    style={{ 
                      paddingRight: '2rem',
                      minHeight: '2.5rem'
                    }}
                  >
                    <option value="">Select Grade</option>
                    {GRADE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={newCourseCredits}
                    onChange={(e) => setNewCourseCredits(Number(e.target.value))}
                    className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                  className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-mono text-sm"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Write additional information like evaluations, assignments, etc.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleAddCourse}
                  disabled={addingCourse}
                  className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingCourse ? "Adding..." : "Add"}
                </button>
                <button
                  onClick={handleCancelAddCourse}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Courses List */}
        {semester.courses.length === 0 ? (
          <div className="text-center py-12 border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shadow-md">
            <p className="text-gray-500 dark:text-gray-400">
              No courses yet. Click &quot;Add Course&quot; to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {semester.courses.map((course) => (
              <div
                key={course.courseId}
                className="border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 shadow-md hover:shadow-lg transition-all duration-200 p-6"
              >
                {editingCourse === course.courseId ? (
                  /* Edit Mode */
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Course Name
                        </label>
                        <input
                          type="text"
                          value={editCourseName}
                          onChange={(e) => setEditCourseName(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-5">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Grade
                        </label>
                        <select
                          value={editCourseGrade}
                          onChange={(e) => setEditCourseGrade(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                          style={{ 
                            paddingRight: '2rem',
                            minHeight: '2.5rem'
                          }}
                        >
                          <option value="">Select Grade</option>
                          {GRADE_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent font-mono text-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Write additional information like evaluations, assignments, etc.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleUpdateCourse(course.courseId)}
                        className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <>
                    <div 
                      className="flex items-start justify-between mb-4 cursor-pointer"
                      onClick={() => toggleCourseExpand(course.courseId)}
                    >
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                          {course.name}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          {course.grade && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 shadow-sm">
                              <span className="text-sm text-gray-600 dark:text-gray-400">Grade</span>
                              <span className="font-bold text-lg text-black dark:text-white">{course.grade}</span>
                            </div>
                          )}
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 shadow-sm">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Credits</span>
                            <span className="font-bold text-lg text-black dark:text-white">{course.credits || 4}</span>
                          </div>
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
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Additional Information
                        </h4>
                        {course.additionalInfo ? (
                          <div className="p-4 bg-gray-100 dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 shadow-sm">
                            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                              {course.additionalInfo}
                            </pre>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                            No additional information added yet. Click edit to add
                            details like evaluations, assignments, etc.
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

