"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import {
  createQuiz,
  publishQuiz,
  QuizQuestion,
  updateDraft,
  getQuiz,
} from "@/services/quizzesService";
import { useAuth } from "@/contexts/AuthContext";
import ZeroGravityLoading from "@/components/ZeroGravityLoading";

const emptyQuestion = (): QuizQuestion => ({
  text: "",
  options: [
    { key: "1", text: "" },
    { key: "2", text: "" },
  ],
  timeLimitSeconds: 60,
  maxMarks: 10,
});

interface CreateQuizPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function CreateQuizContent({ searchParams }: CreateQuizPageProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([emptyQuestion()]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  const isPro = user?.subscription === "pro";

  // Load existing quiz or prefill from /createQuiz
  useEffect(() => {
    const loadSearchParams = async () => {
      const params = await searchParams;
      // Support both 'edit' and 'quizId' parameters for editing
      const existingQuizId = (params?.edit || params?.quizId) as string;
      const initTitle = params?.title as string;
      const initDesc = params?.desc as string;

      if (existingQuizId && !isLoading && user) {
        // Load existing quiz data
        setLoadingExisting(true);
        setQuizId(existingQuizId);
        getQuiz(existingQuizId)
          .then((response) => {
            if (response?.success && response?.quiz) {
              const quiz = response.quiz;
              setTitle(quiz.title || "");
              setDescription(quiz.description || "");
              if (quiz.questions && quiz.questions.length > 0) {
                setQuestions(quiz.questions);
                setCurrentIndex(0);
              }
            } else {
              console.error("Failed to load quiz:", response?.message);
            }
          })
          .catch((error) => {
            console.error("Error loading quiz:", error);
          })
          .finally(() => {
            setLoadingExisting(false);
          });
      } else {
        // Prefill from /createQuiz
        if (initTitle) setTitle(initTitle);
        if (initDesc) setDescription(initDesc);
      }
    };

    loadSearchParams();
  }, [searchParams, user, isLoading]);

  const addQuestion = () => {
    if (questions.length >= 100) return;
    setQuestions((q) => [...q, emptyQuestion()]);
    setCurrentIndex(questions.length);
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)),
    );
  };

  const updateOption = (
    qIdx: number,
    oIdx: number,
    text: string,
    isCorrect?: boolean,
  ) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const options = q.options.map((o, j) =>
          j === oIdx ? { ...o, text, isCorrect: isCorrect ?? o.isCorrect } : o,
        );
        return { ...q, options };
      }),
    );
  };

  const addOption = (qIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const nextKey = String(q.options.length + 1);
        return { ...q, options: [...q.options, { key: nextKey, text: "" }] };
      }),
    );
  };

  const deleteOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (q.options.length <= 2) return q;

        const newOptions = q.options.filter((_, j) => j !== oIdx);
        const updatedOptions = newOptions.map((option, index) => ({
          ...option,
          key: String(index + 1),
        }));

        return { ...q, options: updatedOptions };
      }),
    );
  };

  const markCorrect = (qIdx: number, key: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        return {
          ...q,
          options: q.options.map((o) => ({ ...o, isCorrect: o.key === key })),
        };
      }),
    );
  };

  const deleteQuestion = (qIdx: number) => {
    if (questions.length <= 1) return; // Don't delete if it's the only question

    setQuestions((prev) => prev.filter((_, i) => i !== qIdx));

    // Navigate to previous question or stay at index 0
    const newIndex = qIdx > 0 ? qIdx - 1 : 0;
    setCurrentIndex(Math.min(newIndex, questions.length - 2)); // -2 because we're removing one question
  };

  const validateCurrentQuestion = () => {
    const q = questions[currentIndex];
    if (!q) return { isValid: false, message: "No question found" };

    if (!q.text || q.text.trim() === "") {
      return { isValid: false, message: "Please add a question title" };
    }

    // Check if any options have no content
    const emptyOptions = q.options?.filter(
      (o) => !o.text || o.text.trim() === "",
    );
    if (emptyOptions && emptyOptions.length > 0) {
      return {
        isValid: false,
        message: "Please add content to all answer options",
      };
    }

    // Check if at least one correct answer is marked
    const correctOptions = q.options?.filter((o) => o.isCorrect);
    if (!correctOptions || correctOptions.length === 0) {
      return {
        isValid: false,
        message: "Please mark at least one answer as correct",
      };
    }

    // Check if correct answers have content
    const hasCorrectOptionWithContent =
      q.options &&
      q.options.some((o) => o.isCorrect && o.text && o.text.trim() !== "");
    if (!hasCorrectOptionWithContent) {
      return {
        isValid: false,
        message: "Correct answer options must have content",
      };
    }

    return { isValid: true, message: "" };
  };

  const saveCurrent = async () => {
    try {
      setSaving(true);

      // Validate current question
      const validation = validateCurrentQuestion();
      if (!validation.isValid) {
        alert(validation.message);
        setSaving(false);
        return;
      }

      if (!quizId) {
        const created = await createQuiz({
          title: title || "Untitled Quiz",
          description,
          questions,
        });
        if (!created?.success)
          throw new Error(created?.message || "Create failed");
        setQuizId(created.quiz.quizId);
        return;
      }
      const result = await updateDraft(quizId, {
        title,
        description,
        questions,
      });
      if (!result?.success) throw new Error(result?.message || "Save failed");
    } catch (e) {
      alert((e as Error)?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const onPublish = async () => {
    try {
      setPublishing(true);
      let id = quizId;
      if (!id) {
        const created = await createQuiz({
          title: title || "Untitled Quiz",
          description,
          questions,
        });
        if (!created?.success)
          throw new Error(created?.message || "Create failed");
        id = created.quiz.quizId;
        setQuizId(id);
      }
      const pub = await publishQuiz(id!);
      if (!pub?.success) throw new Error(pub?.message || "Publish failed");
      router.push(`/quizzes/host/${id}?code=${pub.joinCode}`);
    } catch (e) {
      alert((e as Error)?.message || "Failed to publish quiz");
    } finally {
      setPublishing(false);
    }
  };

  if (isLoading || loadingExisting)
    return (
      <ZeroGravityLoading
        title="Loading Quiz Creator"
        subtitle="Preparing your quiz..."
        showNavigation={false}
      />
    );
  if (!isPro)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="text-lg text-black dark:text-white">
            Pro subscription required to create quizzes.
          </p>
        </div>
      </div>
    );

  const q = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Full-width header matching website design theme */}
      <div className="bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <input
                type="text"
                className="text-2xl sm:text-3xl font-light text-black dark:text-white bg-transparent border-none outline-none w-full placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Enter Quiz Title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <input
                type="text"
                className="text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none w-full max-w-2xl text-sm mt-1 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="Add a description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 sm:ml-4">
              <button
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                onClick={saveCurrent}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Progress"}
              </button>
              <button
                className="px-6 py-2 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50"
                onClick={onPublish}
                disabled={publishing || !title || questions.length === 0}
              >
                {publishing ? "Publishing..." : "Publish & Host"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 py-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 px-4">
          <aside className="md:col-span-3 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[650px]">
              <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Questions
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-6 pt-4">
                <div className="grid grid-cols-3 gap-2">
                  {questions.map((_, i) => (
                    <button
                      key={i}
                      className={`border p-2 text-sm transition-all ${
                        i === currentIndex
                          ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-sm"
                          : "bg-white dark:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm border-gray-200 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                      }`}
                      onClick={() => setCurrentIndex(i)}
                      title={`Go to question ${i + 1}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
              {/* Add Question Button at Bottom */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0">
                <button
                  className="w-full border border-dashed border-gray-300 dark:border-gray-600 p-3 text-sm bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2"
                  onClick={addQuestion}
                  disabled={questions.length >= 100}
                  title="Add question"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Question
                </button>
              </div>
            </div>
          </aside>

          <section className="md:col-span-9 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-[650px] flex flex-col">
              {/* Question Header */}
              <div className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-lg font-medium text-gray-900 dark:text-white">
                        Question {currentIndex + 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium">Time (seconds)</span>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        className="w-20 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-center focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white"
                        value={q?.timeLimitSeconds || 60}
                        onChange={(e) =>
                          updateQuestion(currentIndex, {
                            timeLimitSeconds: Number(e.target.value),
                          })
                        }
                        placeholder="60"
                        title="Time limit (seconds)"
                      />
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Marks</span>
                        <input
                          type="number"
                          min={1}
                          max={1000}
                          className="w-16 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-center focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white"
                          value={q?.maxMarks || 10}
                          onChange={(e) =>
                            updateQuestion(currentIndex, {
                              maxMarks: Number(e.target.value),
                            })
                          }
                          placeholder="10"
                          title="Max marks"
                        />
                      </label>
                      {questions.length > 1 && (
                        <button
                          onClick={() => deleteQuestion(currentIndex)}
                          className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                          title="Delete this question"
                        >
                          <svg
                            className="w-4 h-4"
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
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Sticky Question Text Input */}
                <div className="p-6 pb-4 flex-shrink-0 bg-white dark:bg-gray-800">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Question Text
                  </label>
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 text-base focus:outline-none focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white transition-all placeholder-gray-400 dark:placeholder-gray-500"
                    placeholder="Enter your question here..."
                    value={q?.text || ""}
                    onChange={(e) =>
                      updateQuestion(currentIndex, { text: e.target.value })
                    }
                  />
                </div>

                {/* Sticky Answer Options Label */}
                <div className="px-6 pb-3 flex-shrink-0 bg-white dark:bg-gray-800">
                  <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    Answer Options
                  </label>
                </div>

                {/* Scrollable Options List */}
                <div className="flex-1 overflow-y-auto px-6">
                  <div className="space-y-3">
                    {(q?.options || []).map((o, oi) => (
                      <div
                        key={o.key}
                        className={`flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors ${
                          o.isCorrect
                            ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
                            : "bg-white dark:bg-gray-700"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${currentIndex}`}
                          checked={!!o.isCorrect}
                          onChange={() => markCorrect(currentIndex, o.key)}
                          title="Mark as correct answer"
                          className="w-4 h-4 text-green-600 focus:ring-green-500 focus:ring-2 cursor-pointer"
                        />
                        <input
                          className="flex-1 border-none bg-transparent focus:outline-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                          placeholder={`Enter Option ${o.key}`}
                          value={o.text}
                          onChange={(e) =>
                            updateOption(currentIndex, oi, e.target.value)
                          }
                        />
                        {(q?.options || []).length > 2 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteOption(currentIndex, oi);
                            }}
                            className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
                            title="Delete this option"
                          >
                            <svg
                              className="w-4 h-4"
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
                        )}
                      </div>
                    ))}

                    {/* Add option button */}
                    <button
                      className="flex items-center gap-2 p-3 border border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 w-full"
                      onClick={() => addOption(currentIndex)}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      Add option
                    </button>
                  </div>
                </div>

                {/* Sticky Action Buttons at Bottom */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      className="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
                      onClick={addQuestion}
                      disabled={questions.length >= 100}
                      title="Add question"
                    >
                      Add Question ({questions.length}/100)
                    </button>
                    <button
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={saveCurrent}
                      disabled={saving || !q?.options?.some((o) => o.isCorrect)}
                      title={
                        !q?.options?.some((o) => o.isCorrect)
                          ? "Please select a correct answer before saving"
                          : ""
                      }
                    >
                      {saving ? "Saving..." : "Save this question"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function CreateQuizPage({ searchParams }: CreateQuizPageProps) {
  return (
    <Suspense
      fallback={
        <ZeroGravityLoading
          title="Loading Quiz Creator"
          subtitle="Preparing your quiz..."
          showNavigation={false}
        />
      }
    >
      <CreateQuizContent searchParams={searchParams} />
    </Suspense>
  );
}
