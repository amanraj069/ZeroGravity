"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/dashboard";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";
import { motion, AnimatePresence } from "framer-motion";
import {
  academiaService,
  type Semester,
  calculateSGPA,
  calculateCGPA,
} from "@/services/academiaService";
import { ChevronLeft } from "lucide-react";

export default function AcademiaPage() {
  const { isLoggedIn, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingSemester, setAddingSemester] = useState(false);
  const [editingSemesterId, setEditingSemesterId] = useState<string | null>(
    null
  );
  const [editSemesterName, setEditSemesterName] = useState("");
  const [showCGPAError, setShowCGPAError] = useState(false);
  const [deletingSemesterId, setDeletingSemesterId] = useState<string | null>(
    null
  );
  const [draggedSemesterId, setDraggedSemesterId] = useState<string | null>(
    null
  );
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [justSwapped, setJustSwapped] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      router.push("/login");
    } else if (isLoggedIn) {
      fetchSemesters();
    }
  }, [isLoggedIn, authLoading, router]);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await academiaService.getSemesters();
      setSemesters(data);
    } catch (err: unknown) {
      console.error("Error fetching semesters:", err);
      setError(err instanceof Error ? err.message : "Failed to load semesters");
    } finally {
      setLoading(false);
    }
  };

  const handleAddSemester = async () => {
    try {
      setAddingSemester(true);
      setError("");
      const semesterNumber = semesters.length + 1;
      const name = `Semester ${semesterNumber}`;

      // Check if semester name already exists
      const existingSemester = semesters.find(
        (s) => s.name.toLowerCase() === name.toLowerCase()
      );

      if (existingSemester) {
        // If name exists, try with next number
        let newNumber = semesterNumber + 1;
        while (
          semesters.find(
            (s) =>
              s.name.toLowerCase() === `Semester ${newNumber}`.toLowerCase()
          )
        ) {
          newNumber++;
        }
        const newName = `Semester ${newNumber}`;
        const newSemester = await academiaService.createSemester({
          name: newName,
        });
        setSemesters([...semesters, newSemester]);
      } else {
        const newSemester = await academiaService.createSemester({ name });
        setSemesters([...semesters, newSemester]);
      }
    } catch (err: unknown) {
      console.error("Error adding semester:", err);
      setError(err instanceof Error ? err.message : "Failed to add semester");
    } finally {
      setAddingSemester(false);
    }
  };

  const handleEditSemester = (semester: Semester) => {
    setEditingSemesterId(semester.semesterId);
    setEditSemesterName(semester.name);
  };

  const handleSaveEdit = async (semesterId: string) => {
    if (!editSemesterName.trim()) {
      setError("Semester name cannot be empty");
      return;
    }

    // Check if semester name already exists
    const existingSemester = semesters.find(
      (s) =>
        s.semesterId !== semesterId &&
        s.name.toLowerCase() === editSemesterName.trim().toLowerCase()
    );

    if (existingSemester) {
      setError("A semester with this name already exists");
      return;
    }

    try {
      setError("");
      const updatedSemester = await academiaService.updateSemester(semesterId, {
        name: editSemesterName.trim(),
      });
      setSemesters(
        semesters.map((s) =>
          s.semesterId === semesterId ? updatedSemester : s
        )
      );
      setEditingSemesterId(null);
      setEditSemesterName("");
    } catch (err: unknown) {
      console.error("Error updating semester:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update semester"
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingSemesterId(null);
    setEditSemesterName("");
  };

  const handleDeleteSemester = async (semesterId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this semester? This will delete all courses in this semester."
      )
    ) {
      return;
    }

    try {
      setDeletingSemesterId(semesterId);
      setError("");
      await academiaService.deleteSemester(semesterId);
      setSemesters(semesters.filter((s) => s.semesterId !== semesterId));
    } catch (err: unknown) {
      console.error("Error deleting semester:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete semester"
      );
    } finally {
      setDeletingSemesterId(null);
    }
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    semesterId: string
  ) => {
    setDraggedSemesterId(semesterId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragEnd = () => {
    // Small delay to let the swap animation complete
    setTimeout(() => {
      setDraggedSemesterId(null);
      setDragOverIndex(null);
    }, 100);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number
  ) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number
  ) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (!draggedSemesterId) return;

    const draggedIndex = semesters.findIndex(
      (s) => s.semesterId === draggedSemesterId
    );

    if (draggedIndex === dropIndex || draggedIndex === -1) {
      setDraggedSemesterId(null);
      return;
    }

    // Swap the two semesters
    const newSemesters = [...semesters];
    const draggedSemester = newSemesters[draggedIndex];
    const dropSemester = newSemesters[dropIndex];
    const temp = draggedSemester;
    newSemesters[draggedIndex] = dropSemester;
    newSemesters[dropIndex] = temp;

    // Mark both semesters as just swapped for animation
    setJustSwapped(`${draggedSemester.semesterId}-${dropSemester.semesterId}`);
    setTimeout(() => setJustSwapped(null), 600);

    // Optimistically update UI
    setSemesters(newSemesters);

    // Update backend
    try {
      const semesterIds = newSemesters.map((s) => s.semesterId);
      await academiaService.reorderSemesters(semesterIds);
    } catch (err: unknown) {
      console.error("Error reordering semesters:", err);
      setError(
        err instanceof Error ? err.message : "Failed to reorder semesters"
      );
      // Revert on error
      fetchSemesters();
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  if (authLoading) {
    return (
      <ZeroGravityLoading
        title="Loading Academia"
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

  return (
    <DashboardLayout>
      <div className="mt-2 sm:mt-4">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="mb-2">
            {/* Title and CGPA on same row on mobile */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => router.back()}
                  className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors shrink-0"
                  title="Go back"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-2xl sm:text-4xl font-light text-black dark:text-white">
                  Academia
                </h1>
              </div>
              {(() => {
                const cgpaResult = calculateCGPA(semesters);
                return (
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => {
                        if (cgpaResult.cgpa === null) {
                          setShowCGPAError(true);
                          setTimeout(() => setShowCGPAError(false), 3000);
                        }
                      }}
                      className="text-right"
                    >
                      <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 leading-tight mb-0.5">
                        CGPA
                      </p>
                      <p className="text-lg sm:text-2xl font-semibold text-black dark:text-white leading-tight">
                        {cgpaResult.cgpa !== null
                          ? cgpaResult.cgpa.toFixed(2)
                          : "—"}
                      </p>
                    </button>
                  </div>
                );
              })()}
            </div>
            {/* Description below */}
            <p className="text-xs sm:text-base text-gray-600 dark:text-gray-400 mb-2">
              Store your academics in encrypted format
            </p>
            {/* CGPA error message */}
            {showCGPAError && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                You need grades in all courses of one sem to see CGPA
              </p>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-3 sm:mb-6 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 shadow-sm">
            <p className="text-red-600 dark:text-red-400 text-xs sm:text-sm">
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              Loading semesters...
            </div>
          </div>
        ) : (
          <>
            {/* Semesters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
              <AnimatePresence mode="popLayout">
                {semesters.map((semester, index) => (
                  <motion.div
                    key={semester.semesterId}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: 1,
                      scale:
                        draggedSemesterId === semester.semesterId ? 0.95 : 1,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{
                      layout: {
                        type: "spring",
                        stiffness: 350,
                        damping: 25,
                        mass: 0.7,
                      },
                      opacity: { duration: 0.15, ease: "easeOut" },
                      scale: {
                        duration: 0.2,
                        ease: "easeOut",
                      },
                    }}
                    draggable
                    onDragStart={(e) => {
                      if ("dataTransfer" in e && e.dataTransfer) {
                        handleDragStart(
                          e as unknown as React.DragEvent<HTMLDivElement>,
                          semester.semesterId
                        );
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => {
                      if ("dataTransfer" in e && e.dataTransfer) {
                        handleDragOver(
                          e as unknown as React.DragEvent<HTMLDivElement>,
                          index
                        );
                      }
                    }}
                    onDrop={(e) => {
                      if ("dataTransfer" in e && e.dataTransfer) {
                        handleDrop(
                          e as unknown as React.DragEvent<HTMLDivElement>,
                          index
                        );
                      }
                    }}
                    onDragLeave={handleDragLeave}
                    className={`group border-2 border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 hover:border-black dark:hover:border-white hover:bg-gray-100 dark:hover:bg-gray-750 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 p-4 sm:p-6 relative cursor-move ${
                      draggedSemesterId === semester.semesterId
                        ? "opacity-90 z-50"
                        : ""
                    } ${
                      dragOverIndex === index &&
                      draggedSemesterId !== semester.semesterId
                        ? "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-300 dark:ring-blue-600"
                        : ""
                    } ${
                      justSwapped && justSwapped.includes(semester.semesterId)
                        ? "ring-2 ring-green-400 dark:ring-green-500"
                        : ""
                    }`}
                  >
                    {editingSemesterId === semester.semesterId ? (
                      /* Edit Mode */
                      <div className="space-y-3 sm:space-y-4">
                        <input
                          type="text"
                          value={editSemesterName}
                          onChange={(e) => setEditSemesterName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleSaveEdit(semester.semesterId);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          className="w-full px-3 py-2 border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent text-lg sm:text-xl font-semibold"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(semester.semesterId)}
                            className="px-3 sm:px-4 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 sm:px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs sm:text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <>
                        {/* Current Badge */}
                        {index === semesters.length - 1 && (
                          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 opacity-100 group-hover:opacity-0 transition-opacity duration-200 pointer-events-none">
                            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700">
                              Current
                            </span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex gap-1 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleEditSemester(semester);
                            }}
                            className="p-2 text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                            title="Edit semester name"
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
                              e.preventDefault();
                              handleDeleteSemester(semester.semesterId);
                            }}
                            disabled={
                              deletingSemesterId === semester.semesterId
                            }
                            className="p-2 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete semester"
                          >
                            {deletingSemesterId === semester.semesterId ? (
                              <div className="w-5 h-5 border-2 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin"></div>
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            )}
                          </button>
                        </div>

                        <Link
                          href={`/academia/${semester.semesterId}`}
                          onClick={(e) => {
                            // Prevent navigation when dragging
                            if (draggedSemesterId) {
                              e.preventDefault();
                            }
                          }}
                        >
                          <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-1 sm:mb-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors pr-16 sm:pr-20">
                            {semester.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">
                            {semester.courses.length} course
                            {semester.courses.length !== 1 ? "s" : ""}
                          </p>
                          {(() => {
                            const sgpa = calculateSGPA(semester.courses);
                            return (
                              sgpa !== null && (
                                <p className="text-base sm:text-lg font-semibold text-black dark:text-white mb-2 sm:mb-4">
                                  SGPA: {sgpa.toFixed(2)}
                                </p>
                              )
                            );
                          })()}
                          <div className="flex items-center text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                            <span className="mr-2">View Details</span>
                            <span className="transform group-hover:translate-x-1 transition-transform duration-300">
                              →
                            </span>
                          </div>
                        </Link>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Add Semester Button */}
              <button
                onClick={handleAddSemester}
                disabled={addingSemester}
                className="border-2 border-dotted border-gray-400 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 hover:border-black dark:hover:border-white hover:bg-gray-100 dark:hover:bg-gray-750 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 p-4 sm:p-6 flex items-center justify-center min-h-[120px] sm:min-h-[140px] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingSemester ? (
                  <div className="text-gray-500 dark:text-gray-400">
                    Adding...
                  </div>
                ) : (
                  <div className="text-3xl sm:text-4xl text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white transition-colors">
                    +
                  </div>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
