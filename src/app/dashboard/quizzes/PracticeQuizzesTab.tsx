import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPracticeQuizzes, deletePracticeQuiz, PracticeQuiz } from "@/services/practiceQuizService";
import { Plus, Brain, Clock, Folder, Trash2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { QuizCardsSkeleton } from "@/components/quizzes/QuizzesSkeleton";

export default function PracticeQuizzesTab({ searchTerm }: { searchTerm: string }) {
  const [quizzes, setQuizzes] = useState<PracticeQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredQuizzes, setFilteredQuizzes] = useState<PracticeQuiz[]>([]);
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { showToast, showDialog } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredQuizzes(quizzes);
      return;
    }
    const filtered = quizzes.filter(q => {
      const displayName = (q.name || q.topic).toLowerCase();
      const term = searchTerm.toLowerCase();
      return displayName.includes(term) || q.topic.toLowerCase().includes(term);
    });
    setFilteredQuizzes(filtered);
  }, [searchTerm, quizzes]);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await getPracticeQuizzes();
      if (response.success) {
        setQuizzes(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching practice quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (quizId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const confirmed = await showDialog({
      title: "Delete Practice Quiz",
      message: "Are you sure you want to delete this practice quiz? This action cannot be undone.",
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) return;

    setDeletingQuizId(quizId);
    try {
      const response = await deletePracticeQuiz(quizId);
      if (response.success) {
        setQuizzes((prev) => prev.filter((q) => q.quizId !== quizId));
        showToast("Practice quiz deleted.", "success");
      } else {
        showToast(response.message || "Failed to delete quiz", "error");
      }
    } catch (error) {
      console.error("Error deleting practice quiz:", error);
      showToast("Failed to delete quiz", "error");
    } finally {
      setDeletingQuizId(null);
    }
  };

  const handleNavigate = (path: string) => {
    setNavigatingTo(path);
    router.push(path);
  };

  if (loading) return <QuizCardsSkeleton type="practice" />;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <motion.button
          onClick={() => handleNavigate("/dashboard/quizzes/practice/generate")}
          onMouseEnter={() => router.prefetch("/dashboard/quizzes/practice/generate")}
          whileHover={{ y: -2 }}
          className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-[#15151a]/40 hover:border-gray-400 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 p-8 rounded-xl group"
          style={{ minHeight: "180px" }}
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 group-hover:border-gray-400 transition-colors mb-3">
            {navigatingTo === "/dashboard/quizzes/practice/generate" ? (
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-gray-400 dark:border-gray-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Plus className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors" />
            )}
          </div>
          <span className="text-[10px] sm:text-sm font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">
            {navigatingTo === "/dashboard/quizzes/practice/generate" ? "PREPARING..." : "GENERATE AI QUIZ"}
          </span>
        </motion.button>

        <AnimatePresence mode="popLayout">
          {filteredQuizzes.map((quiz) => (
            <motion.div
              key={quiz.quizId}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              onClick={() => handleNavigate(`/dashboard/quizzes/practice/${quiz.quizId}`)}
              onMouseEnter={() => router.prefetch(`/dashboard/quizzes/practice/${quiz.quizId}`)}
              className="relative flex flex-col h-full bg-white dark:bg-[#15151a] shadow-sm p-5 sm:p-6 transition-all duration-300 ease-out cursor-pointer border border-gray-100 dark:border-gray-800 hover:shadow-xl dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.8)] hover:border-gray-200 dark:hover:border-gray-700/80 group rounded-xl"
              style={{ minHeight: "180px" }}
            >
              {/* Header: Title and Actions */}
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl sm:text-2xl font-light text-black dark:text-white line-clamp-2 leading-snug">
                  {quiz.name || quiz.topic}
                </h3>
                <div className="flex flex-col items-end gap-2 shrink-0 mt-1">
                  {navigatingTo === `/dashboard/quizzes/practice/${quiz.quizId}` && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-[#15151a]/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10 transition-all">
                      <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button
                    onClick={(e) => handleDelete(quiz.quizId, e)}
                    disabled={deletingQuizId === quiz.quizId || navigatingTo !== null}
                    className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/50 relative z-20"
                    title="Delete practice quiz"
                  >
                    {deletingQuizId === quiz.quizId ? (
                      <div className="w-4 h-4 border-2 border-red-500 dark:border-red-400 border-t-transparent animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Categories */}
              {quiz.categories && quiz.categories.length > 0 && (
                <div className="flex flex-row flex-wrap items-center gap-1.5 mt-3 mb-auto">
                  {quiz.categories.slice(0, 3).map((cat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium px-2 py-1 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800/80">
                      <Folder className="w-3 h-3" />
                      {cat}
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom: Stats and Badges */}
              <div className="flex items-end justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Brain className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-xs sm:text-sm">{quiz.numberOfQuestions} Qs</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-xs sm:text-sm">{quiz.timePerQuestion}s / Q</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border border-transparent ${
                    quiz.difficulty === "god" ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40" :
                    quiz.difficulty === "hard" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                    quiz.difficulty === "medium" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}>
                    {quiz.difficulty}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
